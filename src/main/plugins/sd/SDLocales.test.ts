// ============================================================================
// SDLocales — unit tests + SDPluginHost summary integration
//
// The locale schema is the one recovered from the bundled Stream Deck 7.x
// plugins: { Name, Description, <actionUUID>: { Name, Tooltip } } — action
// entries at the TOP level, keyed by UUID (SDLocales.ts header has the full
// survey). The host integration exercises the fixture plugin
// (__fixtures__/fake-plugin.sdPlugin, which ships en.json + de.json) through
// SDPluginHost.loadPlugins() — no spawning needed, discovery is enough to
// shape the summaries.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import {
  loadSdLocale,
  normalizeSdLanguage,
  parseSdLocale,
} from "./SDLocales";
import { SDPluginHost, type SDDevicePort } from "./SDPluginHost";
import type { Logger } from "../../utils/Logger";

// Same shim strategy as SDPluginHost.test.ts (vitest module runner vs. the
// CommonJS main build).
const FIXTURES = path.join(
  typeof __dirname !== "undefined"
    ? __dirname
    : path.join(process.cwd(), "src/main/plugins/sd"),
  "__fixtures__",
);
const FIXTURE_PLUGIN_DIR = path.join(FIXTURES, "fake-plugin.sdPlugin");

function makeLogger() {
  const records: Array<{ level: string; msg: string }> = [];
  const push = (level: string) => (msg: unknown, err?: unknown) =>
    records.push({ level, msg: `${String(msg)}${err ? ` ${String(err)}` : ""}` });
  return {
    debug: push("debug"),
    info: push("info"),
    warn: push("warn"),
    error: push("error"),
  } as unknown as Logger;
}

describe("normalizeSdLanguage", () => {
  it.each([
    ["en", "en"],
    ["en-US", "en"],
    ["de", "de"],
    ["zh_CN", "zh"],
    ["fr.UTF-8", "fr"],
    ["", "en"],
    ["not a locale!", "en"],
    [undefined, "en"],
    [42, "en"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeSdLanguage(input)).toBe(expected);
  });
});

describe("parseSdLocale", () => {
  it("extracts Name/Description and top-level action entries", () => {
    const locale = parseSdLocale({
      Name: "Hotkey Plugin",
      Description: "desc",
      "com.elgato.streamdeck.system.hotkey": {
        Name: "Hotkey",
        Tooltip: "Activate a key command",
      },
    });
    expect(locale.Name).toBe("Hotkey Plugin");
    expect(locale.Description).toBe("desc");
    expect(locale.actions["com.elgato.streamdeck.system.hotkey"]).toEqual({
      Name: "Hotkey",
      Tooltip: "Activate a key command",
    });
  });

  it("ignores non-object action entries and non-string fields (tolerant)", () => {
    const locale = parseSdLocale({
      Name: 42,
      Description: null,
      "com.test.action": { Name: "Keep", Tooltip: 7, Encoder: { TriggerDescription: {} } },
      "com.test.broken": "not an object",
    });
    expect(locale.Name).toBeUndefined();
    expect(locale.Description).toBeUndefined();
    // Name kept, non-string Tooltip and extra nested payload dropped.
    expect(locale.actions["com.test.action"]).toEqual({ Name: "Keep" });
    expect(locale.actions["com.test.broken"]).toBeUndefined();
  });

  it("returns an empty locale for non-object payloads", () => {
    expect(parseSdLocale("junk")).toEqual({ actions: {} });
    expect(parseSdLocale(null)).toEqual({ actions: {} });
  });
});

describe("loadSdLocale", () => {
  let tmp: string;
  let pluginDir: string;

  beforeEach(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sdlocale-"));
    pluginDir = path.join(tmp, "com.test.plugin.sdPlugin");
    await fsp.mkdir(pluginDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("loads <lang>.json for the requested language", async () => {
    await fsp.writeFile(
      path.join(pluginDir, "de.json"),
      JSON.stringify({ Name: "Plug-in", "com.test.a": { Name: "Aktion" } }),
    );
    const res = loadSdLocale(pluginDir, "de-DE", makeLogger());
    expect(res.language).toBe("de");
    expect(res.locale?.Name).toBe("Plug-in");
    expect(res.locale?.actions["com.test.a"]?.Name).toBe("Aktion");
  });

  it("falls back to en.json when the requested language is missing", async () => {
    await fsp.writeFile(
      path.join(pluginDir, "en.json"),
      JSON.stringify({ Name: "Plugin" }),
    );
    const res = loadSdLocale(pluginDir, "de", makeLogger());
    expect(res.language).toBe("en");
    expect(res.locale?.Name).toBe("Plugin");
  });

  it("resolves to null when neither language nor fallback exists", async () => {
    const res = loadSdLocale(pluginDir, "de", makeLogger());
    expect(res).toEqual({ locale: null, language: null, file: null });
  });

  it("skips malformed JSON with a warning (never throws)", async () => {
    const records: Array<{ level: string; msg: string }> = [];
    const logger = {
      warn: (msg: unknown, err?: unknown) =>
        records.push({ level: "warn", msg: `${String(msg)}${err ? ` ${String(err)}` : ""}` }),
    };
    await fsp.writeFile(path.join(pluginDir, "en.json"), "{not json");
    const res = loadSdLocale(pluginDir, "en", logger);
    expect(res.locale).toBeNull();
    expect(records.some((r) => r.msg.includes("malformed JSON"))).toBe(true);
  });
});

describe("SDPluginHost summary localization (discovery only, no spawn)", () => {
  let tmp: string;
  let pluginsDir: string;
  let stateDir: string;
  let host: SDPluginHost | null = null;

  beforeEach(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sdlocale-host-"));
    pluginsDir = path.join(tmp, "sdplugins");
    stateDir = path.join(pluginsDir, "state");
    await fsp.mkdir(pluginsDir, { recursive: true });
    await fsp.cp(FIXTURE_PLUGIN_DIR, path.join(pluginsDir, "fake.sdPlugin"), {
      recursive: true,
    });
  });

  afterEach(async () => {
    await host?.stop();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  function makeDevicePort(): SDDevicePort {
    // loadPlugins() never touches the device port; a minimal stub suffices.
    return {
      on: () => undefined,
      off: () => undefined,
      getDevice: () => null,
      getDevices: () => [],
      setKeyImage: async () => undefined,
    } as unknown as SDDevicePort;
  }

  it("surfaces localized plugin + action names for the host language", async () => {
    host = new SDPluginHost({
      logger: makeLogger(),
      devicePort: makeDevicePort(),
      pluginsDir,
      stateDir,
      language: "de",
    });
    await host.loadPlugins();

    const summary = host.getPlugins().find((p) => p.uuid === "com.bigdeck.test.fake");
    expect(summary).toBeTruthy();
    expect(summary!.localeLanguage).toBe("de");
    expect(summary!.name).toBe("Fake-SD-Plugin");
    expect(summary!.actions).toEqual([
      {
        uuid: "com.bigdeck.test.fake.action",
        name: "Fake-Aktion",
        tooltip: "Gibt Host-Events als logMessage zurück",
      },
    ]);
  });

  it("falls back to manifest names when no locale matches (en exists → used)", async () => {
    // Request an unprovided language: en.json is present on the fixture and
    // mirrors the manifest exactly, so names stay manifest-stable.
    host = new SDPluginHost({
      logger: makeLogger(),
      devicePort: makeDevicePort(),
      pluginsDir,
      stateDir,
      language: "fr",
    });
    await host.loadPlugins();

    const summary = host.getPlugins().find((p) => p.uuid === "com.bigdeck.test.fake");
    expect(summary!.localeLanguage).toBe("en");
    expect(summary!.name).toBe("Fake SD Plugin");
    expect(summary!.actions[0]).toEqual({
      uuid: "com.bigdeck.test.fake.action",
      name: "Fake Action",
      tooltip: "Echoes host events back as logMessage",
    });
  });
});
