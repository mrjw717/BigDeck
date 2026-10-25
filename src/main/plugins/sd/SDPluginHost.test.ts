// ============================================================================
// SDPluginHost — integration tests
//
// These tests run the REAL host end to end: the fixture plugin
// (__fixtures__/fake-plugin.sdPlugin) is spawned through SDPluginProcess
// with the spec argv, connects as a WebSocket client, registers, and echoes
// everything the host delivers back as logMessage — so assertions observe
// exactly what crossed the wire in both directions.
//
// DeviceManager is replaced with an EventEmitter-based fake exposing the
// same public event/payload contract the host consumes
// (key:down/key:up/dial:rotate/dial:down/dial:up/touch:tap).
//
// NOTE on delivery ordering (mirrors app wiring in index.ts): the host's
// device-event listeners must be registered BEFORE the ActionExecutor
// dispatch path for the same physical press. The single-delivery guarantee
// in dispatchAction relies on that order.
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
  type SDController,
} from "./SDPluginHost";
import type { Logger } from "../../utils/Logger";

// These tests spawn real child processes and wait on real WebSocket I/O;
// give them more headroom than the 30s global default on loaded machines.
vi.setConfig({ testTimeout: 60_000 });

// Fixtures live next to this file. `__dirname` is shimmed by vitest's module
// runner and native under the CommonJS main-process build; the cwd fallback
// covers any environment that provides neither.
const FIXTURES = path.join(
  typeof __dirname !== "undefined"
    ? __dirname
    : path.join(process.cwd(), "src/main/plugins/sd"),
  "__fixtures__",
);
const FIXTURE_PLUGIN_DIR = path.join(FIXTURES, "fake-plugin.sdPlugin");
const FIXTURE_PACKAGE = path.join(FIXTURES, "fake-plugin.streamDeckPlugin");

const PLUGIN_UUID = "com.bigdeck.test.fake";
const ACTION_UUID = "com.bigdeck.test.fake.action";
const KEY_BYTES = 72 * 72 * 3; // original: 72px square, raw RGB

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

/** EventEmitter-based stand-in for DeviceManager's public surface. */
class FakeDevicePort extends EventEmitter implements SDDevicePort {
  readonly writes: Array<{ deviceId: string; keyIndex: number; bytes: number }> = [];

  getDevice(id: string) {
    return { id, type: "original" as const, rows: 3, columns: 5, keyCount: 15, connected: true };
  }

  getDevices() {
    return [this.getDevice("dev1")];
  }

  async setKeyImage(deviceId: string, keyIndex: number, image: Buffer | Buffer[]): Promise<void> {
    const buf = Array.isArray(image) ? image[0] : image;
    this.writes.push({ deviceId, keyIndex, bytes: buf.length });
  }
}

class FakeKeyImageCache implements SDKeyImageCachePort {
  readonly entries = new Map<string, { idle: Buffer | Buffer[]; pressed: Buffer | Buffer[] }>();
  setCachedImages(
    deviceId: string,
    keyIndex: number,
    entry: { idle: Buffer | Buffer[]; pressed: Buffer | Buffer[] },
  ): void {
    this.entries.set(`${deviceId}:${keyIndex}`, entry);
  }
}

function makeLogger() {
  const records: Array<{ level: string; msg: string }> = [];
  const push = (level: string) => (msg: unknown, err?: unknown) =>
    records.push({ level, msg: `${String(msg)}${err ? ` ${String(err)}` : ""}` });
  const logger = {
    debug: push("debug"),
    info: push("info"),
    warn: push("warn"),
    error: push("error"),
  } as unknown as Logger;
  return { logger, records };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function waitFor<T>(fn: () => T | undefined | null | false, timeoutMs = 10000): Promise<T> {
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

interface InboundMessage {
  pluginUUID: string;
  message: Record<string, unknown> & { event: string; payload?: Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// Shared harness
// ---------------------------------------------------------------------------

let tmp: string;
let pluginsDir: string;
let stateDir: string;
let device: FakeDevicePort;
let cache: FakeKeyImageCache;
let host: SDPluginHost;
let messages: InboundMessage[];
let records: Array<{ level: string; msg: string }>;
let previousNodePath: string | undefined;

async function makeHost(opts: { copyFixture?: boolean } = { copyFixture: true }): Promise<SDPluginHost> {
  device = new FakeDevicePort();
  cache = new FakeKeyImageCache();
  messages = [];
  const log = makeLogger();
  records = log.records;
  const h = new SDPluginHost({
    logger: log.logger,
    devicePort: device,
    keyImageCache: cache,
    pluginsDir,
    stateDir,
    appVersion: "test",
  });
  h.on("plugin-message", (m) => messages.push(m as InboundMessage));
  await h.start();
  return h;
}

function findMessage(event: string, predicate?: (m: InboundMessage) => boolean) {
  return messages.find(
    (m) =>
      m.message.event === event &&
      (!predicate || predicate(m)),
  );
}

/**
 * The fixture echoes every host-delivered frame back as
 * `logMessage { echo: <event>, body: <original frame> }` — this helper
 * returns the original OUTBOUND frame (what the host actually put on the
 * wire) for assertions.
 */
function echoFrame(event: string, predicate?: (frame: Record<string, unknown>) => boolean) {
  const hit = findMessage("logMessage", (m) => {
    if (m.message.payload?.echo !== event) return false;
    if (!predicate) return true;
    return predicate((m.message.payload.body ?? {}) as Record<string, unknown>);
  });
  return hit ? (hit.message.payload!.body as Record<string, unknown>) : undefined;
}

beforeEach(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sdhost-"));
  pluginsDir = path.join(tmp, "sdplugins");
  stateDir = path.join(pluginsDir, "state");
  fs.mkdirSync(pluginsDir, { recursive: true });
  await fsp.cp(FIXTURE_PLUGIN_DIR, path.join(pluginsDir, "fake.sdPlugin"), { recursive: true });

  // The fixture plugin requires `ws`; real plugins ship their own deps, this
  // one borrows the repo's node_modules via NODE_PATH (inherited by the
  // spawned child through SDPluginProcess's env passthrough).
  const repoNodeModules = path.join(FIXTURES, "..", "..", "..", "..", "..", "node_modules");
  previousNodePath = process.env.NODE_PATH;
  process.env.NODE_PATH = previousNodePath
    ? `${previousNodePath}:${repoNodeModules}`
    : repoNodeModules;
});

afterEach(async () => {
  if (host) await host.stop();
  host = undefined as unknown as SDPluginHost;
  process.env.NODE_PATH = previousNodePath;
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SDPluginHost end-to-end (spawned fixture plugin)", () => {
  it("completes the registerPlugin handshake with the spec spawn argv", async () => {
    host = await makeHost();

    expect(host.getPort()).toBeGreaterThan(0);

    // Fixture process spawned → connected → registerPlugin → didRegisterPlugin
    await waitFor(() => (findMessage("logMessage", (m) => {
      const body = (m.message.payload?.body ?? {}) as Record<string, unknown>;
      return (m.message.payload?.echo === "didRegisterPlugin" && !!body.spawn);
    })));
    const handshake = findMessage("logMessage", (m) => m.message.payload?.echo === "didRegisterPlugin");
    const spawn = ((handshake!.message.payload!.body as Record<string, unknown>).spawn ??
      {}) as Record<string, unknown>;
    expect(spawn).toMatchObject({
      pluginUUID: PLUGIN_UUID,
      registerEvent: "registerPlugin",
      infoApplicationPlatform: "linux",
    });
  });

  it("routes device events to the right context on the wire", async () => {
    host = await makeHost();
    await waitFor(() => host.getPlugins().find((p) => p.uuid === PLUGIN_UUID && p.status === "running"));

    // Place an action instance on dev1 key 7 → plugin receives willAppear.
    const { context, created } = host.registerActionInstance({
      pluginUUID: PLUGIN_UUID,
      actionUUID: ACTION_UUID,
      deviceId: "dev1",
      controller: "Keypad",
      index: 7,
    });
    expect(created).toBe(true);

    await waitFor(() =>
      findMessage("logMessage", (m) => m.message.payload?.echo === "willAppear"),
    );
    const willAppear = findMessage("logMessage", (m) => m.message.payload?.echo === "willAppear");
    expect((willAppear!.message.payload!.body as Record<string, unknown>).context).toBe(context);

    // Hardware press → keyDown with correct context/action/device/coordinates.
    device.emit("key:down", { deviceId: "dev1", keyIndex: 7 });
    const keyDown = await waitFor(() => echoFrame("keyDown"));
    expect(keyDown!.context).toBe(context);
    expect(keyDown!.action).toBe(ACTION_UUID);
    expect(keyDown!.device).toBe("dev1");
    const keyDownPayload = keyDown!.payload as Record<string, unknown>;
    expect(keyDownPayload.coordinates).toEqual({ row: 1, column: 2 }); // 7 on a 3x5 grid
    expect(keyDownPayload.settings).toEqual({ echoed: true, from: "fixture" });

    // Release → keyUp for the same context.
    device.emit("key:up", { deviceId: "dev1", keyIndex: 7 });
    const keyUp = await waitFor(() => echoFrame("keyUp"));
    expect(keyUp!.context).toBe(context);
  });

  it("delivers setImage through sharp to the device write path and the key cache", async () => {
    host = await makeHost();
    await waitFor(() => host.getPlugins().find((p) => p.uuid === PLUGIN_UUID && p.status === "running"));

    host.registerActionInstance({
      pluginUUID: PLUGIN_UUID,
      actionUUID: ACTION_UUID,
      deviceId: "dev1",
      controller: "Keypad",
      index: 0,
    });
    device.emit("key:down", { deviceId: "dev1", keyIndex: 0 });

    // Fixture answers keyDown with a 1x1 PNG data-URL; the host must
    // normalize it to the device's raw RGB key format (72*72*3).
    await waitFor(() => device.writes.length > 0);
    expect(device.writes[0]).toMatchObject({ deviceId: "dev1", keyIndex: 0, bytes: KEY_BYTES });

    // The HardwareSync-equivalent cache is updated so press visuals don't
    // clobber the plugin-drawn key.
    await waitFor(() => cache.entries.has("dev1:0"));
    expect(cache.entries.get("dev1:0")!.idle).toBeInstanceOf(Buffer);
  });

  it("routes dial events to Encoder contexts", async () => {
    host = await makeHost();
    await waitFor(() => host.getPlugins().find((p) => p.uuid === PLUGIN_UUID && p.status === "running"));

    host.registerActionInstance({
      pluginUUID: PLUGIN_UUID,
      actionUUID: ACTION_UUID,
      deviceId: "dev1",
      controller: "Encoder",
      index: 0,
    });

    device.emit("dial:rotate", { deviceId: "dev1", dialIndex: 0, amount: -3 });
    const rotate = await waitFor(() => echoFrame("dialRotate"));
    expect(rotate!.payload).toMatchObject({
      controller: "Encoder",
      ticks: -3,
      pressed: false,
    });

    device.emit("dial:down", { deviceId: "dev1", dialIndex: 0 });
    const dialDown = await waitFor(() => echoFrame("dialDown"));
    expect(dialDown!.payload).toMatchObject({
      controller: "Encoder",
      pressed: true,
    });

    device.emit("touch:tap", { deviceId: "dev1", dialIndex: 0, x: 42, y: 24 });
    const tap = await waitFor(() => echoFrame("touchTap"));
    expect(tap!.payload).toMatchObject({
      controller: "Encoder",
      position: { x: 42, y: 24 },
    });
  });

  it("ignores unknown events from registered plugins (spec requirement)", async () => {
    host = await makeHost();
    // The fixture sends "someFutureElgatoEvent" after registering.
    await waitFor(() => records.find((r) => r.msg.includes("unknown event")));
    // The host is still alive and the plugin still connected.
    expect(host.getPlugins().find((p) => p.uuid === PLUGIN_UUID)?.status).toBe("running");
  });

  it("answers getTile with an empty didReceiveTile so awaiting plugins don't hang", async () => {
    host = await makeHost();

    // The fixture probes getTile right after registering; the reply frame
    // comes back echoed like any other inbound frame (documented stub
    // assumption: `didReceiveTile` with an empty payload).
    const reply = await waitFor(() => echoFrame("didReceiveTile"));
    expect(reply!.payload).toEqual({});

    // And the request itself was NOT treated as an unknown event.
    expect(
      records.find((r) => r.msg.includes('unknown event "getTile"')),
    ).toBeUndefined();
  });
});

describe("SDPluginHost settings", () => {
  it("persists per-context settings and restores them after restart", async () => {
    host = await makeHost();
    await waitFor(() => host.getPlugins().find((p) => p.uuid === PLUGIN_UUID && p.status === "running"));

    const { context } = host.registerActionInstance({
      pluginUUID: PLUGIN_UUID,
      actionUUID: ACTION_UUID,
      deviceId: "dev1",
      controller: "Keypad",
      index: 3,
    });

    // Fixture performs setSettings + getSettings on willAppear; the host
    // answers both with didReceiveSettings carrying the stored settings.
    await waitFor(() =>
      messages.filter((m) => {
        if (m.message.payload?.echo !== "didReceiveSettings") return false;
        return ((m.message.payload.body as Record<string, unknown>).context as string) === context;
      }).length >= 2,
    );
    const firstReply = echoFrame(
      "didReceiveSettings",
      (frame) => frame.context === context,
    );
    expect((firstReply!.payload as Record<string, unknown>).settings).toEqual({
      echoed: true,
      from: "fixture",
    });

    // Debounced persistence flushed by stop(); verify the on-disk file.
    await host.stop();
    const onDisk = JSON.parse(fs.readFileSync(path.join(stateDir, `${context}.json`), "utf-8"));
    expect(onDisk.settings).toEqual({ echoed: true, from: "fixture" });

    // Restart: the context (and its settings) survive.
    host = await makeHost();
    expect(host.getContext(context)?.settings).toEqual({ echoed: true, from: "fixture" });
    const again = host.registerActionInstance({
      pluginUUID: PLUGIN_UUID,
      actionUUID: ACTION_UUID,
      deviceId: "dev1",
      controller: "Keypad",
      index: 3,
    });
    expect(again.context).toBe(context);
    expect(again.created).toBe(false);
  });

  it("persists per-plugin global settings and serves getGlobalSettings", async () => {
    host = await makeHost();
    await waitFor(() => host.getPlugins().find((p) => p.uuid === PLUGIN_UUID && p.status === "running"));

    // Fixture requested globals right after registration → empty payload.
    const initial = await waitFor(() => echoFrame("didReceiveGlobalSettings"));
    expect(initial!.payload).toEqual({});

    host.setGlobalSettings(PLUGIN_UUID, { token: "abc" });
    const updated = await waitFor(() =>
      echoFrame(
        "didReceiveGlobalSettings",
        (frame) => (frame.payload as Record<string, unknown>).token === "abc",
      ),
    );
    expect((updated!.payload as Record<string, unknown>).token).toBe("abc");

    // Persistence is debounced; stop() flushes before the file is checked.
    await host.stop();
    const file = path.join(stateDir, "global-com.bigdeck.test.fake.json");
    expect(JSON.parse(fs.readFileSync(file, "utf-8")).settings).toEqual({ token: "abc" });
  });
});

describe("SDPluginHost instance registry", () => {
  it("keeps context ids stable across restarts (settings stay attached)", async () => {
    // Empty plugins dir: registry semantics without a live plugin.
    await fsp.rm(path.join(pluginsDir, "fake.sdPlugin"), { recursive: true, force: true });
    host = await makeHost();

    const placement = {
      pluginUUID: PLUGIN_UUID,
      actionUUID: ACTION_UUID,
      deviceId: "dev1",
      controller: "Keypad" as SDController,
      index: 4,
    };
    const first = host.registerActionInstance(placement);
    expect(first.created).toBe(true);
    await host.stop();

    host = await makeHost();
    const second = host.registerActionInstance(placement);
    expect(second.context).toBe(first.context);
    expect(second.created).toBe(false);
  });

  it("rejects a second owner for an occupied slot", async () => {
    await fsp.rm(path.join(pluginsDir, "fake.sdPlugin"), { recursive: true, force: true });
    host = await makeHost();

    const placement = {
      pluginUUID: PLUGIN_UUID,
      actionUUID: ACTION_UUID,
      deviceId: "dev1",
      controller: "Keypad" as SDController,
      index: 1,
    };
    host.registerActionInstance(placement);
    const squatter = host.registerActionInstance({
      ...placement,
      actionUUID: "com.bigdeck.test.other",
    });
    expect(squatter.created).toBe(false);
    // The original owner keeps the slot.
    expect(host.getContext(squatter.context)?.actionUUID).toBe(ACTION_UUID);
  });
});

describe("SDPluginHost.dispatchAction (ActionExecutor integration)", () => {
  it("lazily creates the instance and sends keyDown once; later presses flow through the device path", async () => {
    host = await makeHost();
    await waitFor(() => host.getPlugins().find((p) => p.uuid === PLUGIN_UUID && p.status === "running"));

    const outbound: Array<Record<string, unknown> & { event: string }> = [];
    host.on("outbound", (m) => outbound.push(m as Record<string, unknown> & { event: string }));

    const action = {
      type: "sdplugin" as const,
      id: "a1",
      name: "SD Action",
      pluginUUID: PLUGIN_UUID,
      actionUUID: ACTION_UUID,
    };

    // First dispatch on an unplaced slot: creates the instance, delivers keyDown.
    await host.dispatchAction(action, { deviceId: "dev1", keyIndex: 2 });
    expect(outbound.filter((m) => m.event === "willAppear")).toHaveLength(1);
    const downs = outbound.filter((m) => m.event === "keyDown");
    expect(downs).toHaveLength(1);
    expect((downs[0].payload as Record<string, unknown>).coordinates).toEqual({ row: 0, column: 2 });

    // Same-origin dispatch now that the instance exists: the host's device
    // listener owns delivery for this physical press — dispatch is a no-op.
    outbound.length = 0;
    await host.dispatchAction(action, { deviceId: "dev1", keyIndex: 2 });
    expect(outbound.filter((m) => m.event === "keyDown")).toHaveLength(0);

    // The hardware press itself reaches the plugin exactly once.
    device.emit("key:down", { deviceId: "dev1", keyIndex: 2 });
    await waitFor(() => outbound.filter((m) => m.event === "keyDown").length === 1);

    // Origin-less dispatch (network API): synthetic tap on the resolved context.
    outbound.length = 0;
    await host.dispatchAction(action);
    expect(outbound.filter((m) => m.event === "keyDown")).toHaveLength(1);
    expect(outbound.filter((m) => m.event === "keyUp")).toHaveLength(1);
  });
});

describe("SDPluginHost.installFromFile", () => {
  it("unzips a .streamDeckPlugin into <uuid>.sdPlugin and registers it", async () => {
    await fsp.rm(path.join(pluginsDir, "fake.sdPlugin"), { recursive: true, force: true });
    host = await makeHost();

    const summary = await host.installFromFile(FIXTURE_PACKAGE);
    expect(summary.uuid).toBe(PLUGIN_UUID);
    expect(summary.platformStatus).toBe("unverified"); // manifest declares mac only

    const installed = path.join(pluginsDir, "com.bigdeck.test.fake.sdPlugin");
    expect(fs.existsSync(path.join(installed, "manifest.json"))).toBe(true);
    expect(fs.existsSync(path.join(installed, "plugin.js"))).toBe(true);
    expect(host.getPlugins().find((p) => p.uuid === PLUGIN_UUID)).toBeTruthy();

    // Reinstall replaces the directory in place instead of failing.
    await expect(host.installFromFile(FIXTURE_PACKAGE)).resolves.toMatchObject({ uuid: PLUGIN_UUID });
  });

  it("rejects packages without a manifest", async () => {
    await fsp.rm(path.join(pluginsDir, "fake.sdPlugin"), { recursive: true, force: true });
    host = await makeHost();

    const garbage = path.join(tmp, "garbage.streamDeckPlugin");
    fs.writeFileSync(garbage, Buffer.from("not a zip"));
    await expect(host.installFromFile(garbage)).rejects.toThrow();
  });
});

describe("SDPluginHost discovery robustness", () => {
  it("skips invalid manifests and PrivateAPI plugins without dying", async () => {
    await fsp.rm(path.join(pluginsDir, "fake.sdPlugin"), { recursive: true, force: true });

    const broken = path.join(pluginsDir, "broken.sdPlugin");
    fs.mkdirSync(broken, { recursive: true });
    fs.writeFileSync(path.join(broken, "manifest.json"), "{not json");

    const priv = path.join(pluginsDir, "builtin.sdPlugin");
    fs.mkdirSync(priv, { recursive: true });
    fs.writeFileSync(
      path.join(priv, "manifest.json"),
      JSON.stringify({ Name: "Builtin", UUID: "com.elgato.builtin", Version: "1", PrivateAPI: true, Actions: [] }),
    );

    host = await makeHost();
    expect(host.getPlugins()).toEqual([]);
    expect(records.find((r) => r.msg.includes("broken.sdPlugin"))).toBeTruthy();
    expect(records.find((r) => r.msg.includes("PrivateAPI"))).toBeTruthy();
  });
});
