// ============================================================================
// Example plugin (com.bigdeck.examples) — end-to-end through the REAL host
//
// The bundled product plugin (resources/example-plugin) is copied into a temp
// plugins dir and spawned through SDPluginProcess exactly like the
// fake-plugin fixture — same spec argv, same WebSocket handshake. Unlike the
// fixture (which echoes frames back), this plugin exhibits its REAL
// behavior: it appends to plugin.log inside its own directory, updates key
// titles, and consumes global settings. Assertions therefore observe (a) the
// host's registry/summary state, (b) the host's outbound frames, and (c) the
// plugin's own log file on disk.
//
// xdg-open is never spawned in tests: BIGDECK_EXAMPLE_NO_OPEN=1 (a
// documented test hook in plugin.js) turns the open-assets action into a
// dry-run log line — a real spawn would open a file manager on this machine.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "events";
import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import {
  SDPluginHost,
  type SDDevicePort,
  type SDKeyImageCachePort,
} from "./SDPluginHost";
import { parseSDManifest, resolveCodePath } from "./SDManifest";
import { loadSdLocale } from "./SDLocales";
import {
  EXAMPLE_PLUGIN_UUID,
  EXAMPLE_PLUGIN_DIR_NAME,
} from "./ExamplePluginSeed";
import type { SdPluginAction } from "../../../shared/types";
import type { Logger } from "../../utils/Logger";

// Spawning real child processes + WebSocket I/O — same headroom as the
// SDPluginHost suite on loaded machines.
vi.setConfig({ testTimeout: 60_000 });

const ACTION_LOG = "com.bigdeck.examples.log";
const ACTION_OPEN_ASSETS = "com.bigdeck.examples.openassets";

// Repo layout: src/main/plugins/sd → repo root is 4 levels up (see the
// fixture tests' __dirname shim + cwd fallback).
const REPO_ROOT =
  typeof __dirname !== "undefined"
    ? path.join(__dirname, "..", "..", "..", "..")
    : process.cwd();
const EXAMPLE_SOURCE = path.join(REPO_ROOT, "resources", "example-plugin", EXAMPLE_PLUGIN_DIR_NAME);

// ---------------------------------------------------------------------------

class FakeDevicePort extends EventEmitter implements SDDevicePort {
  getDevice(id: string) {
    return { id, type: "original" as const, rows: 3, columns: 5, keyCount: 15, connected: true };
  }
  getDevices() {
    return [this.getDevice("dev1")];
  }
  async setKeyImage(): Promise<void> {}
}

class FakeKeyImageCache implements SDKeyImageCachePort {
  setCachedImages(): void {}
}

function makeLogger() {
  const records: Array<{ level: string; msg: string }> = [];
  const push = (level: string) => (msg: unknown) =>
    records.push({ level, msg: String(msg) });
  return {
    logger: {
      debug: push("debug"),
      info: push("info"),
      warn: push("warn"),
      error: push("error"),
    } as unknown as Logger,
    records,
  };
}

function waitFor<T>(fn: () => T | undefined | null | false, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      let value: T | undefined | null | false;
      try {
        value = fn();
      } catch (err) {
        reject(err);
        return;
      }
      if (value) {
        resolve(value as T);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("waitFor: timed out"));
        return;
      }
      setTimeout(tick, 25);
    };
    tick();
  });
}

// ---------------------------------------------------------------------------

let tmp: string;
let pluginsDir: string;
let stateDir: string;
let host: SDPluginHost;
let outbound: Array<Record<string, unknown>>;
/** Host-emitted events: "showOk"/"showAlert"/"instance-registered"/... */
let hostEvents: Array<{ event: string; payload: unknown }>;
let lastContextId: string | null = null;
let previousNoOpen: string | undefined;

async function makeHost(): Promise<SDPluginHost> {
  const log = makeLogger();
  const h = new SDPluginHost({
    logger: log.logger,
    devicePort: new FakeDevicePort(),
    keyImageCache: new FakeKeyImageCache(),
    pluginsDir,
    stateDir,
    appVersion: "test",
  });
  h.on("outbound", (frame) => outbound.push(frame as Record<string, unknown>));
  for (const event of ["showOk", "showAlert", "instance-registered"] as const) {
    h.on(event, (payload) => {
      hostEvents.push({ event, payload });
      if (event === "instance-registered") {
        lastContextId = (payload as { context: string }).context;
      }
    });
  }
  await h.start();
  return h;
}

function pluginLog(): string {
  const logPath = path.join(pluginsDir, EXAMPLE_PLUGIN_DIR_NAME, "plugin.log");
  return fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf-8") : "";
}

function dispatch(actionUUID: string, keyIndex: number): Promise<void> {
  return host.dispatchAction(
    {
      type: "sdplugin",
      id: `test-${keyIndex}`,
      name: actionUUID,
      pluginUUID: EXAMPLE_PLUGIN_UUID,
      actionUUID,
      settings: {},
    } satisfies SdPluginAction,
    { deviceId: "dev1", keyIndex },
  );
}

beforeEach(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sdexample-"));
  pluginsDir = path.join(tmp, "sdplugins");
  stateDir = path.join(pluginsDir, "state");
  fs.mkdirSync(pluginsDir, { recursive: true });
  await fsp.cp(EXAMPLE_SOURCE, path.join(pluginsDir, EXAMPLE_PLUGIN_DIR_NAME), {
    recursive: true,
  });

  // Test hook (documented in plugin.js): never spawn xdg-open in tests.
  previousNoOpen = process.env.BIGDECK_EXAMPLE_NO_OPEN;
  process.env.BIGDECK_EXAMPLE_NO_OPEN = "1";

  outbound = [];
  hostEvents = [];
  lastContextId = null;
  host = undefined as unknown as SDPluginHost;
});

afterEach(async () => {
  if (host) await host.stop();
  host = undefined as unknown as SDPluginHost;
  if (previousNoOpen === undefined) {
    delete process.env.BIGDECK_EXAMPLE_NO_OPEN;
  } else {
    process.env.BIGDECK_EXAMPLE_NO_OPEN = previousNoOpen;
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------

describe("BigDeck Examples plugin (bundled product content)", () => {
  it("has a valid verified-for-linux manifest with both actions and localized names", () => {
    const raw = JSON.parse(fs.readFileSync(path.join(EXAMPLE_SOURCE, "manifest.json"), "utf-8"));
    const parsed = parseSDManifest(raw);
    expect(parsed.ok).toBe(true);
    expect(parsed.manifest!.UUID).toBe(EXAMPLE_PLUGIN_UUID);
    expect(parsed.manifest!.Actions.map((a) => a.UUID)).toEqual([
      ACTION_LOG,
      ACTION_OPEN_ASSETS,
    ]);

    // The Plugins view surfaces these: linux OS entry → verified badge,
    // CodePath → launchable on BigDeck, author → card byline.
    const resolution = resolveCodePath(parsed.manifest!, {
      pluginDir: EXAMPLE_SOURCE,
      fileExists: (p) => fs.existsSync(p),
    });
    expect(resolution.platformStatus).toBe("verified");
    expect(resolution.source).toBe("CodePath");
    expect(resolution.codePath).toBe(path.join(EXAMPLE_SOURCE, "plugin.js"));
    expect(parsed.manifest!.Author).toBe("BigDeck Team");

    // Locale file: localized action names exist for the en fallback.
    const { locale } = loadSdLocale(EXAMPLE_SOURCE, "en", makeLogger().logger);
    expect(locale?.actions[ACTION_LOG]?.Name).toBe("Log Timestamp");
    expect(locale?.actions[ACTION_OPEN_ASSETS]?.Name).toBe("Open Test Assets");
  });

  it("registers through the real spawn path and logs a timestamp on press", async () => {
    host = await makeHost();

    // Spawned + registered = the zero-dependency WebSocket client worked
    // against the host's real server; linux manifest → verified summary.
    const summary = await waitFor(() =>
      host
        .getPlugins()
        .find((p) => p.uuid === EXAMPLE_PLUGIN_UUID && p.status === "running"),
    );
    expect(summary.platformStatus).toBe("verified");
    expect(summary.name).toBe("BigDeck Examples");
    expect(summary.actions.map((a) => a.name)).toEqual([
      "Log Timestamp",
      "Open Test Assets",
    ]);

    // Hardware-style press on key 3 → willAppear + keyDown → the plugin
    // appends a timestamp line to its own plugin.log.
    await dispatch(ACTION_LOG, 3);
    await waitFor(() => pluginLog().includes("log: timestamp="));
    const logLine = pluginLog()
      .split("\n")
      .find((line) => line.includes("log: timestamp="));
    expect(logLine).toMatch(/log: timestamp=\d{4}-\d{2}-\d{2}T/);

    // The plugin's press counter arrived as setTitle and is stored on the
    // context (host state, readable through the registry API).
    expect(lastContextId).toBeTruthy();
    const context = await waitFor(() => {
      const ctx = host.getContext(lastContextId!);
      return ctx?.title === "1" ? ctx : null;
    });
    expect(context!.title).toBe("1");

    // ...and the plugin acknowledged the press with showOk. The host's
    // outbound stream shows the SDK frames the plugin consumed on the way:
    // willAppear (placement) then keyDown (the press).
    await waitFor(() => hostEvents.some((e) => e.event === "showOk"));
    expect(outbound.map((frame) => frame.event)).toContain("willAppear");
    expect(outbound.map((frame) => frame.event)).toContain("keyDown");
  });

  it("opens the configured test-assets dir (dry-run) from global settings", async () => {
    host = await makeHost();
    await waitFor(() =>
      host
        .getPlugins()
        .find((p) => p.uuid === EXAMPLE_PLUGIN_UUID && p.status === "running"),
    );

    // BigDeck pushes the test-assets dir as SDK global settings at startup;
    // the plugin resolves it at press time (dry-run logged, no xdg-open).
    const assetsDir = path.join(tmp, "test-assets");
    fs.mkdirSync(assetsDir, { recursive: true });
    host.setGlobalSettings(EXAMPLE_PLUGIN_UUID, { testAssetsDir: assetsDir });

    await dispatch(ACTION_OPEN_ASSETS, 1);
    await waitFor(() => pluginLog().includes("dry run"));
    expect(pluginLog()).toContain(assetsDir);
  });

  it("reports a missing test-assets dir instead of opening anything", async () => {
    host = await makeHost();
    await waitFor(() =>
      host
        .getPlugins()
        .find((p) => p.uuid === EXAMPLE_PLUGIN_UUID && p.status === "running"),
    );

    // No global settings, no env fallback → the plugin logs the problem and
    // sends showAlert (never xdg-open with a bogus path).
    await dispatch(ACTION_OPEN_ASSETS, 2);
    await waitFor(() => pluginLog().includes("no test-assets dir configured"));
    await waitFor(() => hostEvents.some((e) => e.event === "showAlert"));
  });
});
