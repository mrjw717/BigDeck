// ============================================================================
// BigDeck - Elgato .sdPlugin Compatibility Host
//
// The backend half of BigDeck's Stream Deck plugin compatibility layer
// (docs/SDPLUGIN-COMPAT.md): ONE WebSocket server on 127.0.0.1 (ephemeral
// port), one child process per installed plugin connecting as a WS client,
// and the SDK-v2 JSON event protocol in both directions.
//
// Architecture:
// - Plugin discovery: every `<pluginsDir>/*.sdPlugin` directory with a
//   valid manifest.json. `.streamDeckPlugin` distributables (ZIPs) are
//   installed via installFromFile() into `<uuid>.sdPlugin`.
// - Lifecycle: each enabled plugin is spawned (SDPluginProcess) and
//   identified by its first message `{"event":"registerPlugin","uuid":...}`;
//   the host replies `didRegisterPlugin`, then replays global settings and
//   `willAppear` for every placed instance.
// - Contexts: a UUIDv4 minted per (pluginUUID, actionUUID, device,
//   controller, index) placement. Context ids are STABLE across restarts —
//   the slot→context map is persisted, because per-context settings files
//   are keyed by context id (losing it would silently reset every plugin's
//   settings).
// - Event routing: the host subscribes to DeviceManager's public events
//   (key:down/key:up/dial:rotate/dial:down/dial:up/touch:tap) and delivers
//   the matching SDK event to the plugin that owns the placed context.
//   Delivery requires a REGISTERED instance; registrations come from
//   registerActionInstance() (UI/profile-sync phase) or lazily from
//   dispatchAction() (ActionExecutor integration).
// - Dispatch rule (single-delivery guarantee): a hardware press emits
//   keyDown exactly once. If the pressed slot has no instance yet, the
//   ActionExecutor path creates one and sends keyDown at creation time;
//   afterwards (and for pre-registered instances) the DeviceManager event
//   path delivers keyDown/keyUp and dispatchAction is a no-op for that
//   slot. Origin-less dispatches (network API) resolve the first matching
//   instance and send a synthetic keyDown+keyUp tap.
// - setImage: base64 data-URL → sharp normalize (device key size, RGB) →
//   DeviceManager.setKeyImage — the same function the IPC
//   DEVICE_SET_KEY_IMAGE handler calls — plus a HardwareSync cache update
//   via its public setter so press visuals don't clobber plugin images.
//   (A renderer-facing proxy of plugin images comes in the UI phase.)
// - Settings: JSON per context plus per-plugin global under
//   <stateDir>/, using ProfileManager's write pattern (in-memory
//   authoritative, trailing debounced disk writes, flush() on quit) —
//   implemented over plain files instead of electron-store because we need
//   N small per-context files, not one app database.
// - Unknown events and malformed messages are logged and ignored — the
//   compat spec REQUIRES tolerance here (the official app ships events
//   BigDeck does not implement: didReceiveSecrets, ...). getTile is the one
//   exception: it gets an explicit empty-reply stub, because plugins await
//   that reply and hang on silence.
//
// Deliberately out of scope for the backend phase:
// - switchToProfile: emitted as an event for observability; wiring it to
//   ProfileManager is UI-phase work.
// - Property Inspector hosting: sendToPropertyInspector is stored on the
//   context and emitted, but no PI webview client exists yet.
// ============================================================================

import { EventEmitter } from "events";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { WebSocketServer, WebSocket, type RawData } from "ws";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import extractZip from "extract-zip";
import { DEVICE_SPECS } from "../../../shared/constants";
import type { DeviceType, SdPluginAction } from "../../../shared/types";
import type { Logger } from "../../utils/Logger";
import {
  parseSDManifest,
  resolveCodePath,
  type SDCodePathSource,
  type SDController,
  type SDManifest,
} from "./SDManifest";
import { SDPluginProcess, type SDProcessStatus } from "./SDPluginProcess";

// Re-exported for consumers of the host's public API.
export type { SDController, SDManifest };

// ---------------------------------------------------------------------------
// Ports (structural interfaces) — the host depends on these, not on the
// concrete DeviceManager/HardwareSync classes, so the whole host is
// integration-testable without hardware. DeviceManager and HardwareSync
// satisfy them structurally.
// ---------------------------------------------------------------------------

/** Device fields the host reads. */
export interface SDDeviceSummary {
  id: string;
  type: DeviceType;
  rows: number;
  columns: number;
  keyCount: number;
  connected: boolean;
}

/** The slice of DeviceManager the host consumes (events + key writes). */
export interface SDDevicePort {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  off(event: string, listener: (...args: unknown[]) => void): unknown;
  getDevice(deviceId: string): SDDeviceSummary | null;
  getDevices(): SDDeviceSummary[];
  setKeyImage(
    deviceId: string,
    keyIndex: number,
    image: Buffer | Buffer[],
    forceUpdate?: boolean,
    delays?: number[],
  ): Promise<void>;
}

/** The slice of HardwareSync the host keeps updated after setImage. */
export interface SDKeyImageCachePort {
  setCachedImages(
    deviceId: string,
    keyIndex: number,
    entry: { idle: Buffer | Buffer[]; pressed: Buffer | Buffer[] },
  ): void;
}

export interface SDPluginHostOptions {
  logger: Logger;
  devicePort: SDDevicePort;
  /** Optional — keeps press visuals from clobbering plugin-drawn keys. */
  keyImageCache?: SDKeyImageCachePort;
  pluginsDir: string;
  stateDir: string;
  /** Reported to plugins in the `-info` application object. */
  appVersion?: string;
  /** Respawn crashed plugin processes. Default false (v1). */
  respawn?: boolean;
}

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

/** A placed action instance, keyed by (plugin, action, device, controller, index). */
export interface SDPlacement {
  pluginUUID: string;
  actionUUID: string;
  deviceId: string;
  controller: SDController;
  /** keyIndex for Keypad, dialIndex for Encoder. */
  index: number;
}

export interface SDContext extends SDPlacement {
  /** Stable UUIDv4 minted on first placement of this slot. */
  context: string;
  settings: Record<string, unknown>;
  title: string;
  state: number;
  /** Row/column for keypad placements (null when device unknown or dial). */
  coordinates: { row: number; column: number } | null;
  /** Last sendToPropertyInspector payload (PI host phase will forward it). */
  lastPropertyInspectorMessage: unknown;
}

export type SDPluginStatus =
  | "stopped"
  | "starting"
  | "running"
  | "unsupported"
  | "disabled";

export interface SDPluginSummary {
  uuid: string;
  name: string;
  version: string;
  status: SDPluginStatus;
  enabled: boolean;
  platformStatus: "verified" | "unverified";
  codePathSource: SDCodePathSource;
}

interface SDPluginEntry {
  uuid: string;
  dir: string;
  manifest: SDManifest;
  codePath: string | null;
  codePathSource: SDCodePathSource;
  platformStatus: "verified" | "unverified";
  enabled: boolean;
  process: SDPluginProcess | null;
  socket: WebSocket | null;
  status: SDPluginStatus;
  globalSettings: Record<string, unknown>;
}

/** Persisted slot→context registry record (instances.json). */
interface SDRegistryRecord extends SDPlacement {
  context: string;
}

function slotKey(deviceId: string, controller: SDController, index: number): string {
  return `${deviceId}:${controller}:${index}`;
}

function sanitizeFileComponent(raw: string): string {
  return raw.replace(/[^A-Za-z0-9.-]/g, "_");
}

/**
 * Numeric Stream Deck type ids from the compat spec (0=SD, 1=Mini, 2=XL,
 * 5=MK.2, 7=Mini MK.2, 10=SD+). v2 hardware revisions report the same class
 * as their v1 counterpart (assumed — verify against device traffic in the
 * next RE pass). Unknown types fall back to 0 (classic SD layout) with the
 * entry left in the devices list: plugins degrade more gracefully on a
 * slightly-wrong size than on a missing device.
 */
export function deviceTypeToSdkNumber(type: DeviceType): number {
  switch (type) {
    case "original":
    case "original-v2":
      return 0;
    case "mini":
      return 1;
    case "xl":
    case "xl-v2":
      return 2;
    case "mk2":
      return 5;
    case "mini-mk2":
      return 7;
    case "plus":
      return 10;
    default:
      // pedal / neo / studio: no confirmed mapping yet (pending RE pass).
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Settings persistence — ProfileManager's pattern over plain JSON files
// ---------------------------------------------------------------------------

/**
 * In-memory authoritative JSON file store with ProfileManager's write
 * discipline: reads are synchronous through-cache, mutations are visible
 * immediately, disk writes are trailing-debounced, and flush() persists
 * synchronously for shutdown. Writes are atomic (temp file + rename in the
 * same directory — electron-store's durability model), so a crash mid-write
 * leaves the previous settings intact instead of a truncated file that reads
 * back as `{}`. Unlike electron-store (which ProfileManager uses for its
 * single profiles.json), this writes N small files — one per context/global —
 * which is what the SD settings model needs.
 */
class SDJsonStore {
  private readonly cache = new Map<string, Record<string, unknown>>();
  private readonly dirty = new Set<string>();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly dir: string,
    private readonly logger: Logger,
    private readonly debounceMs = 300,
  ) {}

  /**
   * Read-through cache. A missing file is the normal first-run shape and
   * behaves as an empty object; a CORRUPT one is recovered the same way but
   * surfaced in the log — a damaged file must never throw out of a read
   * (that would take the whole host down) nor silently look like a fresh
   * install.
   */
  get(file: string): Record<string, unknown> {
    const cached = this.cache.get(file);
    if (cached) return cached;
    let loaded: Record<string, unknown> = {};
    try {
      const raw = fs.readFileSync(path.join(this.dir, file), "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        loaded = parsed as Record<string, unknown>;
      } else {
        this.logger.warn(`[sd] settings file ${file} is not a JSON object; starting empty`);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        this.logger.warn(
          `[sd] settings file ${file} is corrupt or unreadable; starting empty:`,
          err,
        );
      }
    }
    this.cache.set(file, loaded);
    return loaded;
  }

  set(file: string, value: Record<string, unknown>): void {
    this.cache.set(file, value);
    this.dirty.add(file);
    this.schedulePersist();
  }

  /** Trailing-edge debounced write, so setSettings bursts coalesce. */
  private schedulePersist(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.persistAsync();
    }, this.debounceMs);
  }

  private async persistAsync(): Promise<void> {
    const files = [...this.dirty];
    this.dirty.clear();
    for (const file of files) {
      const value = this.cache.get(file);
      if (!value) continue;
      try {
        await this.writeAtomic(file, value);
      } catch (err) {
        this.logger.error(`[sd] failed to persist ${file}:`, err);
      }
    }
  }

  /** Synchronous write of all pending changes (call on quit). */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (const file of this.dirty) {
      const value = this.cache.get(file);
      if (!value) continue;
      try {
        this.writeAtomicSync(file, value);
      } catch (err) {
        this.logger.error(`[sd] failed to flush ${file}:`, err);
      }
    }
    this.dirty.clear();
  }

  /**
   * Temp file + rename in the SAME directory (same filesystem → rename is
   * atomic): a crash mid-write leaves the previous file intact and at worst
   * an orphaned `.tmp-` file behind, instead of resetting a context's
   * settings to `{}` on next read. Matches electron-store's durability.
   */
  private async writeAtomic(file: string, value: Record<string, unknown>): Promise<void> {
    const target = path.join(this.dir, file);
    const temp = `${target}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await fsp.writeFile(temp, JSON.stringify(value, null, 2));
    await fsp.rename(temp, target);
  }

  private writeAtomicSync(file: string, value: Record<string, unknown>): void {
    const target = path.join(this.dir, file);
    const temp = `${target}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    fs.writeFileSync(temp, JSON.stringify(value, null, 2));
    fs.renameSync(temp, target);
  }
}

// ---------------------------------------------------------------------------
// The host
// ---------------------------------------------------------------------------

export class SDPluginHost extends EventEmitter {
  private readonly logger: Logger;
  private readonly devicePort: SDDevicePort;
  private readonly keyImageCache?: SDKeyImageCachePort;
  private readonly pluginsDir: string;
  private readonly stateDir: string;
  private readonly appVersion: string;
  private readonly respawn: boolean;

  private wss: WebSocketServer | null = null;
  private port: number | null = null;
  private running = false;

  private readonly plugins = new Map<string, SDPluginEntry>();
  private readonly contexts = new Map<string, SDContext>();
  private readonly slots = new Map<string, SDContext>();
  private settings: SDJsonStore | null = null;

  /** Device event subscriptions (removed on stop). */
  private readonly deviceListeners: Array<[string, (...args: unknown[]) => void]> = [];

  constructor(opts: SDPluginHostOptions) {
    super();
    this.logger = opts.logger;
    this.devicePort = opts.devicePort;
    this.keyImageCache = opts.keyImageCache;
    this.pluginsDir = opts.pluginsDir;
    this.stateDir = opts.stateDir;
    this.appVersion = opts.appVersion ?? "1.0.0";
    this.respawn = opts.respawn ?? false;
  }

  getPort(): number | null {
    return this.port;
  }

  isRunning(): boolean {
    return this.running;
  }

  // -- lifecycle ------------------------------------------------------------

  /**
   * Start the host: load the persisted instance registry, listen on an
   * ephemeral loopback port, discover + spawn plugins, and subscribe to
   * device events. Safe to call when no plugins are installed — the flag
   * logic (start when the dir exists) lives in the app wiring.
   */
  async start(): Promise<void> {
    if (this.running) return;

    await fsp.mkdir(this.pluginsDir, { recursive: true });
    await fsp.mkdir(this.stateDir, { recursive: true });
    this.settings = new SDJsonStore(this.stateDir, this.logger);

    // Restore placements so context ids (and therefore settings) survive
    // restarts. Ephemeral dispatch instances are intentionally not persisted.
    this.loadRegistry();

    await this.listen();
    await this.loadPlugins();

    this.wireDeviceEvents();
    this.running = true;

    const enabled = [...this.plugins.values()].filter((p) => p.enabled);
    for (const entry of enabled) {
      this.spawnPlugin(entry);
    }

    this.logger.info(
      `[sd] host listening on 127.0.0.1:${this.port} (${this.plugins.size} plugins, ${this.contexts.size} instances)`,
    );
  }

  /**
   * Stop the host: kill plugin processes (awaiting REAL termination), flush
   * state, close the server.
   */
  async stop(): Promise<void> {
    if (!this.running && !this.wss) return;
    this.running = false;

    for (const [event, handler] of this.deviceListeners) {
      this.devicePort.off(event, handler);
    }
    this.deviceListeners.length = 0;

    // Wait for every plugin child to actually die, in parallel: each stop()
    // resolves only after the child honored SIGTERM or ate the SIGKILL
    // escalation (≤ KILL_GRACE_MS per plugin). This await is the last line
    // of defense against quit-time orphaning — Electron does not await
    // before-quit listeners, so nothing else guarantees a SIGTERM-trapping
    // plugin is gone before app.exit().
    await Promise.all(
      [...this.plugins.values()].map(async (entry) => {
        entry.socket?.close();
        entry.socket = null;
        if (entry.status === "running") entry.status = "stopped";
        await entry.process?.stop();
      }),
    );

    this.settings?.flush();

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      this.wss = null;
    }
    this.port = null;
    this.logger.info("[sd] host stopped");
  }

  /** Bind the WS server to a loopback ephemeral port. */
  private listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ host: "127.0.0.1", port: 0 });
      this.wss.on("connection", (ws) => this.handleConnection(ws));
      this.wss.once("error", reject);
      // The OS assigns the ephemeral port asynchronously — address() is only
      // valid after the `listening` event.
      this.wss.once("listening", () => {
        const address = this.wss!.address();
        if (!address || typeof address !== "object") {
          reject(new Error("[sd] failed to bind plugin WebSocket server"));
          return;
        }
        this.port = address.port;
        // Bind succeeded — swap the reject handler for logging so a late
        // server error can't surface as an unhandled rejection.
        this.wss!.removeListener("error", reject);
        this.wss!.on("error", (err) => this.logger.error("[sd] plugin WS server error:", err));
        resolve();
      });
    });
  }

  // -- discovery / install --------------------------------------------------

  /**
   * Scan the plugins directory and (re)load every *.sdPlugin manifest.
   * Invalid or PrivateAPI plugins are skipped with a warning — a broken
   * third-party package must never take the host down.
   */
  async loadPlugins(): Promise<number> {
    let discovered = 0;
    let entries: fs.Dirent[];
    try {
      entries = await fsp.readdir(this.pluginsDir, { withFileTypes: true });
    } catch {
      return 0;
    }

    for (const dirent of entries) {
      if (!dirent.isDirectory() || !dirent.name.endsWith(".sdPlugin")) continue;
      const dir = path.join(this.pluginsDir, dirent.name);
      const entry = await this.loadPluginDirectory(dir);
      if (entry) {
        this.plugins.set(entry.uuid, entry);
        discovered += 1;
      }
    }
    return discovered;
  }

  private async loadPluginDirectory(dir: string): Promise<SDPluginEntry | null> {
    let raw: unknown;
    try {
      raw = JSON.parse(await fsp.readFile(path.join(dir, "manifest.json"), "utf-8"));
    } catch (err) {
      this.logger.warn(`[sd] skipping ${dir}: unreadable manifest.json`, err);
      return null;
    }

    const parsed = parseSDManifest(raw);
    if (!parsed.ok || !parsed.manifest) {
      this.logger.warn(
        `[sd] skipping ${dir}: invalid manifest — ${parsed.errors.join("; ")}`,
      );
      return null;
    }
    const manifest = parsed.manifest;

    if (manifest.PrivateAPI) {
      this.logger.warn(
        `[sd] skipping ${manifest.UUID}: PrivateAPI plugin (built-in, never spawned from disk)`,
      );
      return null;
    }

    const resolution = resolveCodePath(manifest, {
      pluginDir: dir,
      fileExists: (p) => fs.existsSync(p),
    });

    const enabled = this.readEnabledMap()[manifest.UUID] !== false;

    return {
      uuid: manifest.UUID,
      dir,
      manifest,
      codePath: resolution.codePath,
      codePathSource: resolution.source,
      platformStatus: resolution.platformStatus,
      enabled,
      process: null,
      socket: null,
      status: enabled ? "stopped" : "disabled",
      globalSettings: this.readGlobalSettings(manifest.UUID),
    };
  }

  /**
   * Install a `.streamDeckPlugin` distributable (a ZIP of the plugin
   * directory). Extracts to a staging dir inside pluginsDir (same
   * filesystem → atomic rename), locates the manifest, and installs as
   * `<uuid>.sdPlugin` so reinstalls of the same plugin replace it in place.
   */
  async installFromFile(streamDeckPluginPath: string): Promise<SDPluginSummary> {
    const staging = path.join(
      this.pluginsDir,
      `.staging-install-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );
    await fsp.mkdir(staging, { recursive: true });
    try {
      await extractZip(streamDeckPluginPath, { dir: staging });

      const manifestDir = await this.findManifestDir(staging);
      if (!manifestDir) {
        throw new Error("no manifest.json found in .streamDeckPlugin package");
      }

      const parsed = parseSDManifest(
        JSON.parse(await fsp.readFile(path.join(manifestDir, "manifest.json"), "utf-8")),
      );
      if (!parsed.ok || !parsed.manifest) {
        throw new Error(`invalid manifest: ${parsed.errors.join("; ")}`);
      }
      if (parsed.manifest.PrivateAPI) {
        throw new Error("PrivateAPI plugin — refusing to install from disk");
      }

      const dest = path.join(
        this.pluginsDir,
        `${sanitizeFileComponent(parsed.manifest.UUID)}.sdPlugin`,
      );
      await fsp.rm(dest, { recursive: true, force: true });
      await fsp.rename(manifestDir, dest);

      // Refresh (or create) the registry entry; spawn if the host is running.
      const existing = this.plugins.get(parsed.manifest.UUID);
      // Fire-and-forget kill of the previous build (SIGTERM→SIGKILL
      // escalation finishes in the background).
      void existing?.process?.stop();
      const entry = (await this.loadPluginDirectory(dest))!;
      this.plugins.set(entry.uuid, entry);
      if (this.running && entry.enabled) this.spawnPlugin(entry);

      this.logger.info(`[sd] installed ${entry.manifest.Name} (${entry.uuid})`);
      return this.summarize(entry);
    } finally {
      await fsp.rm(staging, { recursive: true, force: true });
    }
  }

  /** Locate the extracted directory that owns manifest.json (≤2 levels). */
  private async findManifestDir(startDir: string): Promise<string | null> {
    if (fs.existsSync(path.join(startDir, "manifest.json"))) return startDir;
    let level1: fs.Dirent[];
    try {
      level1 = await fsp.readdir(startDir, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const dirent of level1) {
      if (!dirent.isDirectory()) continue;
      const sub = path.join(startDir, dirent.name);
      if (fs.existsSync(path.join(sub, "manifest.json"))) return sub;
      // One more level covers zips rooted at <something>/<name>.sdPlugin/.
      try {
        for (const inner of await fsp.readdir(sub, { withFileTypes: true })) {
          if (!inner.isDirectory()) continue;
          const deep = path.join(sub, inner.name);
          if (fs.existsSync(path.join(deep, "manifest.json"))) return deep;
        }
      } catch {
        // Unreadable subdir — keep scanning.
      }
    }
    return null;
  }

  getPlugins(): SDPluginSummary[] {
    return [...this.plugins.values()].map((e) => this.summarize(e));
  }

  private summarize(entry: SDPluginEntry): SDPluginSummary {
    return {
      uuid: entry.uuid,
      name: entry.manifest.Name,
      version: entry.manifest.Version,
      status: entry.status,
      enabled: entry.enabled,
      platformStatus: entry.platformStatus,
      codePathSource: entry.codePathSource,
    };
  }

  /** Enable/disable a plugin; persists across restarts and spawns/kills now. */
  async setPluginEnabled(uuid: string, enabled: boolean): Promise<void> {
    const entry = this.plugins.get(uuid);
    if (!entry) throw new Error(`SD plugin not found: ${uuid}`);

    const map = this.readEnabledMap();
    map[uuid] = enabled;
    this.settings?.set("enabled.json", map);

    entry.enabled = enabled;
    if (!enabled) {
      // Fire-and-forget: the SIGTERM→SIGKILL escalation finishes in the
      // background; nothing at quit time depends on it here.
      void entry.process?.stop();
      entry.process = null;
      entry.socket = null;
      entry.status = "disabled";
    } else if (this.running) {
      entry.status = "stopped";
      this.spawnPlugin(entry);
    }
  }

  private readEnabledMap(): Record<string, unknown> {
    return this.settings?.get("enabled.json") ?? {};
  }

  private readGlobalSettings(uuid: string): Record<string, unknown> {
    const file = `global-${sanitizeFileComponent(uuid)}.json`;
    const data = this.settings?.get(file) ?? {};
    return (data.settings as Record<string, unknown> | undefined) ?? {};
  }

  // -- instance registry ------------------------------------------------------

  /**
   * Register (or return the existing) context for a placement. Context ids
   * are minted once per slot and persisted, so plugin settings keyed by
   * context survive restarts. `willAppear` is delivered when the plugin is
   * (or becomes) connected.
   */
  registerActionInstance(
    placement: SDPlacement & { settings?: Record<string, unknown>; title?: string; state?: number },
  ): { context: string; created: boolean } {
    const key = slotKey(placement.deviceId, placement.controller, placement.index);
    const existing = this.slots.get(key);
    if (existing) {
      if (
        existing.pluginUUID !== placement.pluginUUID ||
        existing.actionUUID !== placement.actionUUID
      ) {
        this.logger.warn(
          `[sd] slot ${key} already owned by ${existing.pluginUUID}/${existing.actionUUID}; ignoring request for ${placement.pluginUUID}/${placement.actionUUID}`,
        );
        return { context: existing.context, created: false };
      }
      return { context: existing.context, created: false };
    }

    const context: SDContext = {
      ...placement,
      context: uuidv4(),
      settings: placement.settings ?? {},
      title: placement.title ?? "",
      state: placement.state ?? 0,
      coordinates: this.coordinatesFor(placement),
      lastPropertyInspectorMessage: undefined,
    };

    this.contexts.set(context.context, context);
    this.slots.set(key, context);

    // Persist the registry (immediately — placements are rare and the map is
    // tiny; settings themselves are debounced separately). Ephemeral
    // dispatch-only placements on non-devices stay memory-only.
    if (placement.deviceId !== "virtual") {
      const registry = this.settings?.get("instances.json") ?? {};
      registry[key] = {
        context: context.context,
        pluginUUID: context.pluginUUID,
        actionUUID: context.actionUUID,
        deviceId: context.deviceId,
        controller: context.controller,
        index: context.index,
      } satisfies SDRegistryRecord;
      this.settings?.set("instances.json", registry);
    }

    this.sendWillAppear(context);
    this.emit("instance-registered", context);
    return { context: context.context, created: true };
  }

  /** Remove a placement; delivers willDisappear. */
  unregisterActionInstance(deviceId: string, controller: SDController, index: number): boolean {
    const key = slotKey(deviceId, controller, index);
    const context = this.slots.get(key);
    if (!context) return false;

    this.sendToContext(
      context,
      "willDisappear",
      this.appearancePayload(context),
      { action: context.actionUUID, device: context.deviceId },
    );
    this.contexts.delete(context.context);
    this.slots.delete(key);

    const registry = this.settings?.get("instances.json") ?? {};
    delete registry[key];
    this.settings?.set("instances.json", registry);
    this.emit("instance-unregistered", context);
    return true;
  }

  hasInstanceFor(deviceId: string, controller: SDController, index: number): boolean {
    return this.slots.has(slotKey(deviceId, controller, index));
  }

  getContext(contextId: string): SDContext | null {
    return this.contexts.get(contextId) ?? null;
  }

  private loadRegistry(): void {
    const registry = this.settings?.get("instances.json") ?? {};
    for (const [key, value] of Object.entries(registry)) {
      const record = value as Partial<SDRegistryRecord>;
      if (
        !record ||
        typeof record.context !== "string" ||
        typeof record.pluginUUID !== "string" ||
        typeof record.actionUUID !== "string" ||
        typeof record.deviceId !== "string" ||
        (record.controller !== "Keypad" && record.controller !== "Encoder") ||
        typeof record.index !== "number"
      ) {
        this.logger.warn(`[sd] skipping malformed registry entry for slot ${key}`);
        continue;
      }

      const context: SDContext = {
        context: record.context,
        pluginUUID: record.pluginUUID,
        actionUUID: record.actionUUID,
        deviceId: record.deviceId,
        controller: record.controller,
        index: record.index,
        settings: this.readContextSettings(record.context),
        title: "",
        state: 0,
        coordinates: this.coordinatesFor(record as SDPlacement),
        lastPropertyInspectorMessage: undefined,
      };
      this.contexts.set(context.context, context);
      this.slots.set(key, context);
    }
  }

  private readContextSettings(contextId: string): Record<string, unknown> {
    const data = this.settings?.get(`${contextId}.json`) ?? {};
    return (data.settings as Record<string, unknown> | undefined) ?? {};
  }

  /** Row/column for a placement, or null for dials / unknown devices. */
  private coordinatesFor(placement: SDPlacement): { row: number; column: number } | null {
    if (placement.controller !== "Keypad") return null;
    const device = this.devicePort.getDevice(placement.deviceId);
    if (!device) return null;
    return {
      row: Math.floor(placement.index / device.columns),
      column: placement.index % device.columns,
    };
  }

  // -- ActionExecutor integration -------------------------------------------

  /**
   * Dispatch an `sdplugin` action to the right context.
   *
   * With an origin (hardware press): if the slot's instance already exists,
   * do NOTHING — the host's DeviceManager listener delivered keyDown for
   * this same physical press, and a second send would double-fire. If it
   * doesn't exist, lazily create it (which sends willAppear + keyDown at
   * creation). Without an origin (network API etc.): resolve the first
   * instance of (pluginUUID, actionUUID) — creating an ephemeral one on the
   * "virtual" device if none exists — and deliver a synthetic keyDown+keyUp
   * tap.
   */
  async dispatchAction(
    action: SdPluginAction,
    origin?: { deviceId: string; keyIndex: number },
  ): Promise<void> {
    if (origin) {
      const key = slotKey(origin.deviceId, "Keypad", origin.keyIndex);
      const existing = this.slots.get(key);
      if (existing) {
        if (
          existing.pluginUUID === action.pluginUUID &&
          existing.actionUUID === action.actionUUID
        ) {
          // Device-event path owns delivery for existing placements.
          return;
        }
        this.logger.warn(
          `[sd] dispatch: slot ${key} owned by ${existing.pluginUUID}/${existing.actionUUID}, not ${action.pluginUUID}/${action.actionUUID}`,
        );
        return;
      }
      const { created } = this.registerActionInstance({
        pluginUUID: action.pluginUUID,
        actionUUID: action.actionUUID,
        deviceId: origin.deviceId,
        controller: "Keypad",
        index: origin.keyIndex,
        settings: action.settings,
      });
      if (created) {
        const context = this.slots.get(key)!;
        this.sendKeyDown(context);
      }
      return;
    }

    let context = [...this.contexts.values()].find(
      (c) => c.pluginUUID === action.pluginUUID && c.actionUUID === action.actionUUID,
    );
    let ephemeral = false;
    if (!context) {
      const slot = slotKey("virtual", "Keypad", -1);
      const existingVirtual = this.slots.get(slot);
      if (
        existingVirtual &&
        existingVirtual.pluginUUID === action.pluginUUID &&
        existingVirtual.actionUUID === action.actionUUID
      ) {
        context = existingVirtual;
      } else if (!existingVirtual) {
        this.registerActionInstance({
          pluginUUID: action.pluginUUID,
          actionUUID: action.actionUUID,
          deviceId: "virtual",
          controller: "Keypad",
          index: -1,
          settings: action.settings,
        });
        context = this.slots.get(slot)!;
        ephemeral = true;
      } else {
        this.logger.warn(
          `[sd] dispatch: virtual slot owned by ${existingVirtual.pluginUUID}; dropping dispatch`,
        );
        return;
      }
    }

    this.sendKeyDown(context);
    // Synthetic tap: origin-less dispatches have no matching hardware
    // release, so the key would appear held forever without the keyUp.
    this.sendToContext(
      context,
      "keyUp",
      this.keyPayload(context),
      { action: context.actionUUID, device: context.deviceId },
    );
    if (ephemeral) {
      // Ephemeral contexts exist only for this dispatch (settings still
      // persist by context id); drop the placement to keep the slot free.
      this.unregisterActionInstance("virtual", "Keypad", -1);
    }
  }

  // -- device event routing ---------------------------------------------------

  private wireDeviceEvents(): void {
    const on = (event: string, handler: (...args: unknown[]) => void) => {
      this.devicePort.on(event, handler);
      this.deviceListeners.push([event, handler]);
    };

    on("key:down", (payload) => {
      const { deviceId, keyIndex } = payload as { deviceId: string; keyIndex: number };
      const context = this.slots.get(slotKey(deviceId, "Keypad", keyIndex));
      if (context) this.sendKeyDown(context);
    });

    on("key:up", (payload) => {
      const { deviceId, keyIndex } = payload as { deviceId: string; keyIndex: number };
      const context = this.slots.get(slotKey(deviceId, "Keypad", keyIndex));
      if (context) {
        this.sendToContext(context, "keyUp", this.keyPayload(context), {
          action: context.actionUUID,
          device: context.deviceId,
        });
      }
    });

    on("dial:rotate", (payload) => {
      const { deviceId, dialIndex, amount } = payload as {
        deviceId: string;
        dialIndex: number;
        amount: number;
      };
      const context = this.slots.get(slotKey(deviceId, "Encoder", dialIndex));
      if (context) {
        this.sendToContext(
          context,
          "dialRotate",
          {
            controller: "Encoder",
            settings: context.settings,
            ticks: amount,
            pressed: false,
          },
          { action: context.actionUUID, device: context.deviceId },
        );
      }
    });

    for (const [event, sdkEvent, pressed] of [
      ["dial:down", "dialDown", true],
      ["dial:up", "dialUp", false],
    ] as const) {
      on(event, (payload) => {
        const { deviceId, dialIndex } = payload as { deviceId: string; dialIndex: number };
        const context = this.slots.get(slotKey(deviceId, "Encoder", dialIndex));
        if (context) {
          this.sendToContext(
            context,
            sdkEvent,
            {
              controller: "Encoder",
              settings: context.settings,
              pressed,
            },
            { action: context.actionUUID, device: context.deviceId },
          );
        }
      });
    }

    on("touch:tap", (payload) => {
      const { deviceId, dialIndex, x, y } = payload as {
        deviceId: string;
        dialIndex: number;
        x: number;
        y: number;
      };
      const context = this.slots.get(slotKey(deviceId, "Encoder", dialIndex));
      if (context) {
        this.sendToContext(
          context,
          "touchTap",
          {
            controller: "Encoder",
            settings: context.settings,
            position: { x, y },
          },
          { action: context.actionUUID, device: context.deviceId },
        );
      }
    });

    // Re-appearance across connect/disconnect: the device came back, so
    // every placement on it re-announces; on loss, plugins see the keys go.
    on("device:connected", (payload) => {
      const { id } = payload as { id: string };
      for (const context of this.contexts.values()) {
        if (context.deviceId === id) this.sendWillAppear(context);
      }
    });
    on("device:disconnected", (payload) => {
      const deviceId = payload as string;
      for (const context of this.contexts.values()) {
        if (context.deviceId === deviceId) {
          this.sendToContext(context, "willDisappear", this.appearancePayload(context));
        }
      }
    });
  }

  private appearancePayload(context: SDContext): Record<string, unknown> {
    return {
      coordinates: context.coordinates,
      settings: context.settings,
      state: context.state,
      title: context.title,
    };
  }

  private keyPayload(context: SDContext): Record<string, unknown> {
    return {
      coordinates: context.coordinates,
      settings: context.settings,
    };
  }

  private sendWillAppear(context: SDContext): void {
    this.sendToContext(
      context,
      "willAppear",
      this.appearancePayload(context),
      { action: context.actionUUID, device: context.deviceId },
    );
  }

  private sendKeyDown(context: SDContext): void {
    this.sendToContext(
      context,
      "keyDown",
      this.keyPayload(context),
      { action: context.actionUUID, device: context.deviceId },
    );
  }

  // -- spawn ------------------------------------------------------------------

  private spawnPlugin(entry: SDPluginEntry): void {
    if (!entry.enabled || entry.process) return;
    if (!entry.codePath) {
      entry.status = "unsupported";
      this.logger.warn(
        `[sd] ${entry.manifest.Name}: no launchable code path for this platform (${entry.platformStatus}); plugin not started`,
      );
      return;
    }

    const info = {
      application: {
        language: "en",
        platform: "linux",
        version: this.appVersion,
      },
      devices: this.devicePort.getDevices().map((d) => ({
        id: d.id,
        name: DEVICE_SPECS[d.type]?.name ?? d.type,
        size: { rows: d.rows, columns: d.columns },
        type: deviceTypeToSdkNumber(d.type),
      })),
      pluginUUID: entry.uuid,
      registerEvent: "registerPlugin",
    };

    const process = new SDPluginProcess(
      {
        pluginUUID: entry.uuid,
        pluginName: entry.manifest.Name,
        codePath: entry.codePath,
        port: this.port!,
        info,
        respawn: this.respawn,
      },
      this.logger,
    );

    process.on("exit", () => {
      // The WS socket dies with the process; clear it so re-registration
      // (respawn) re-associates cleanly.
      if (entry.socket) {
        entry.socket.close();
        entry.socket = null;
      }
      entry.status = this.pluginStatusFromProcess(entry.process?.getStatus());
    });

    entry.process = process;
    entry.status = "starting";
    process.start();
  }

  // -- WebSocket protocol -----------------------------------------------------

  private handleConnection(ws: WebSocket): void {
    ws.on("message", (data: RawData) => {
      this.handleRawMessage(ws, data);
    });
    ws.on("close", () => {
      for (const entry of this.plugins.values()) {
        if (entry.socket === ws) {
          entry.socket = null;
          if (entry.status === "running") entry.status = "stopped";
          this.logger.debug(`[sd] ${entry.uuid}: socket closed`);
        }
      }
    });
    ws.on("error", (err) => {
      this.logger.warn("[sd] plugin socket error:", err);
    });
  }

  private handleRawMessage(ws: WebSocket, data: RawData): void {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(data.toString());
    } catch {
      this.logger.warn("[sd] dropping malformed (non-JSON) plugin message");
      return;
    }
    const event = typeof message.event === "string" ? message.event : undefined;
    if (!event) {
      this.logger.warn("[sd] dropping plugin message without an event field");
      return;
    }

    if (event === "registerPlugin") {
      this.handleRegisterPlugin(ws, message);
      return;
    }

    // Everything else is context- or plugin-scoped; resolve the sender.
    const sender = this.findEntryBySocket(ws);
    if (!sender) {
      this.logger.warn(`[sd] message "${event}" from unregistered socket ignored`);
      return;
    }

    this.emit("plugin-message", { pluginUUID: sender.uuid, message });
    try {
      this.routePluginMessage(sender, event, message);
    } catch (err) {
      this.logger.error(`[sd] error handling "${event}" from ${sender.uuid}:`, err);
    }
  }

  private handleRegisterPlugin(ws: WebSocket, message: Record<string, unknown>): void {
    const uuid = typeof message.uuid === "string" ? message.uuid : "";
    const entry = this.plugins.get(uuid);
    if (!entry) {
      this.logger.warn(`[sd] registerPlugin from unknown plugin uuid "${uuid}"; ignoring`);
      return;
    }

    // A respawning plugin may reconnect: newest socket wins.
    if (entry.socket && entry.socket !== ws) {
      entry.socket.close();
    }
    entry.socket = ws;
    entry.status = "running";

    this.send(ws, { event: "didRegisterPlugin" });
    // The official app delivers global settings right after registration.
    this.send(ws, {
      event: "didReceiveGlobalSettings",
      payload: entry.globalSettings,
    });

    // Re-announce every placed instance of this plugin.
    for (const context of this.contexts.values()) {
      if (context.pluginUUID === entry.uuid) this.sendWillAppear(context);
    }

    this.emit("plugin-registered", entry.uuid);
    this.logger.info(`[sd] ${entry.manifest.Name} (${entry.uuid}) registered`);
  }

  private routePluginMessage(
    sender: SDPluginEntry,
    event: string,
    message: Record<string, unknown>,
  ): void {
    const contextId = typeof message.context === "string" ? message.context : null;
    const context = contextId ? this.contexts.get(contextId) : null;
    if (
      ["setImage", "setTitle", "setSettings", "getSettings", "setState", "showOk", "showAlert", "sendToPropertyInspector"].includes(
        event,
      ) &&
      !context
    ) {
      this.logger.warn(
        `[sd] ${sender.uuid}: "${event}" for unknown context ${contextId ?? "<none>"} ignored`,
      );
      return;
    }
    const payload = (message.payload ?? {}) as Record<string, unknown>;

    switch (event) {
      case "setImage": {
        // Fire-and-forget, but never an unhandled rejection: async throws
        // bypass routePluginMessage's synchronous catch, so this .catch is
        // the backstop for anything handleSetImage's own try misses.
        void this.handleSetImage(sender, context!, payload).catch((err) => {
          this.logger.error(`[sd] ${sender.uuid}: setImage failed:`, err);
        });
        break;
      }

      case "setTitle": {
        context!.title = typeof payload.title === "string" ? payload.title : "";
        // No on-key text overlay yet — plugin titles are stored so
        // willAppear replays are faithful.
        this.logger.debug(`[sd] ${sender.uuid}: setTitle "${context!.title}"`);
        break;
      }

      case "setSettings": {
        context!.settings = payload;
        this.persistContext(context!);
        this.sendToContext(context!, "didReceiveSettings", {
          ...this.keyPayload(context!),
        });
        break;
      }

      case "getSettings": {
        this.sendToContext(context!, "didReceiveSettings", {
          ...this.keyPayload(context!),
        });
        break;
      }

      case "setGlobalSettings": {
        sender.globalSettings = payload;
        this.persistGlobalSettings(sender);
        this.sendGlobalSettings(sender);
        break;
      }

      case "getGlobalSettings": {
        this.sendGlobalSettings(sender);
        break;
      }

      case "logMessage": {
        this.logger.info(`[sd:${sender.uuid}] ${String(payload.message ?? "")}`);
        break;
      }

      case "showOk":
      case "showAlert": {
        // No hardware ack visual yet; surfaced for observability.
        this.logger.debug(`[sd] ${sender.uuid}: ${event} on ${contextId}`);
        this.emit(event, { pluginUUID: sender.uuid, context: contextId });
        break;
      }

      case "openUrl": {
        this.handleOpenUrl(payload.url);
        break;
      }

      case "setState": {
        context!.state = typeof payload.state === "number" ? payload.state : 0;
        this.persistContext(context!);
        this.logger.debug(`[sd] ${sender.uuid}: setState ${context!.state}`);
        break;
      }

      case "switchToProfile": {
        // Wired to ProfileManager in the UI phase; emitted here so flows are
        // observable and testable now.
        this.logger.debug(`[sd] ${sender.uuid}: switchToProfile requested`);
        this.emit("switchToProfile", {
          pluginUUID: sender.uuid,
          device: payload.device ?? null,
          profile: payload.profile ?? null,
        });
        break;
      }

      case "sendToPropertyInspector": {
        // Store + forward stub: the PI webview host is UI-phase work.
        context!.lastPropertyInspectorMessage = payload;
        this.emit("sendToPropertyInspector", {
          pluginUUID: sender.uuid,
          action: message.action ?? null,
          context: contextId,
          payload,
        });
        break;
      }

      case "getTile": {
        // SD+ tile fetch (compat spec: v2 private op — plugins await the
        // reply, so staying silent hangs them). The official reply shape is
        // not recovered yet (pending RE pass), so this is a documented
        // assumption: `didReceiveTile` with an EMPTY payload, correlated
        // with the requesting context when one was supplied. Revisit after
        // the next device-traffic RE pass.
        if (!sender.socket) break;
        this.send(sender.socket, {
          event: "didReceiveTile",
          ...(contextId ? { context: contextId } : {}),
          payload: {},
        });
        break;
      }

      default:
        // Spec requirement: unknown events are logged and ignored, never
        // fatal. This also intentionally covers INBOUND `didReceiveSecrets`
        // / `didReceiveResources` — those names are app→plugin events in
        // the official app, so a plugin sending them is bogus traffic
        // (getTile has its own stub reply above).
        this.logger.warn(`[sd] ${sender.uuid}: unknown event "${event}" ignored`);
        break;
    }
  }

  /**
   * setImage: base64 data-URL → sharp normalize → DeviceManager.setKeyImage
   * (the same write the IPC DEVICE_SET_KEY_IMAGE handler performs) plus a
   * HardwareSync cache update via its public setter so the press-visual path
   * doesn't overwrite plugin-drawn keys with the stale profile render.
   * A renderer-facing proxy of plugin images comes later (UI phase).
   */
  private async handleSetImage(
    sender: SDPluginEntry,
    context: SDContext,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const image = typeof payload.image === "string" ? payload.image : "";
    if (!image) {
      this.logger.warn(`[sd] ${sender.uuid}: setImage without an image field`);
      return;
    }
    if (context.controller !== "Keypad") {
      // Dial/LCD tile images (SD+) need the LCD write path — later RE pass.
      this.logger.debug(
        `[sd] ${sender.uuid}: setImage for ${context.controller} context ignored (LCD path not implemented yet)`,
      );
      return;
    }

    const bytes = this.decodeImageDataUrl(image);
    if (!bytes) {
      this.logger.warn(`[sd] ${sender.uuid}: setImage with unparseable image data`);
      return;
    }

    try {
      // The device/size lookups belong INSIDE the try: a device port that
      // throws (DeviceManager teardown races) or an unmapped device type
      // (specs lookup → undefined → .keyWidth TypeError) must surface as a
      // logged failure, not as an unhandled rejection escaping the
      // fire-and-forget call in routePluginMessage.
      const device = this.devicePort.getDevice(context.deviceId);
      const specs = DEVICE_SPECS[device?.type ?? "original"];
      const rgb = await sharp(bytes)
        .resize(specs.keyWidth, specs.keyHeight, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .flatten({ background: { r: 0, g: 0, b: 0 } })
        .raw()
        .toBuffer();

      // target: 0 = both, 1 = hardware only, 2 = software only (skip hw).
      const target = typeof payload.target === "number" ? payload.target : 0;
      if (target !== 2) {
        await this.devicePort.setKeyImage(context.deviceId, context.index, rgb);
        this.keyImageCache?.setCachedImages(context.deviceId, context.index, {
          idle: rgb,
          pressed: rgb,
        });
      }
      this.emit("setImage", {
        pluginUUID: sender.uuid,
        context: context.context,
        deviceId: context.deviceId,
        keyIndex: context.index,
      });
    } catch (err) {
      this.logger.error(`[sd] ${sender.uuid}: setImage failed:`, err);
    }
  }

  /** Accept `data:image/...;base64,...` (the SDK contract) or raw base64. */
  private decodeImageDataUrl(image: string): Buffer | null {
    const match = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(image.trim());
    const base64 = match ? match[1] : image;
    try {
      const bytes = Buffer.from(base64, "base64");
      return bytes.length > 0 ? bytes : null;
    } catch {
      return null;
    }
  }

  private handleOpenUrl(url: unknown): void {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      this.logger.warn(`[sd] openUrl refused (must be http(s)): ${String(url)}`);
      return;
    }
    // Same mechanism as ActionExecutor's open-url action.
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    this.logger.info(`[sd] opened URL: ${url}`);
  }

  private persistContext(context: SDContext): void {
    this.settings?.set(`${context.context}.json`, {
      settings: context.settings,
      title: context.title,
      state: context.state,
    });
  }

  /** Public API: update + persist a plugin's global settings. */
  setGlobalSettings(uuid: string, settings: Record<string, unknown>): void {
    const entry = this.plugins.get(uuid);
    if (!entry) throw new Error(`SD plugin not found: ${uuid}`);
    entry.globalSettings = settings;
    this.persistGlobalSettings(entry);
    this.sendGlobalSettings(entry);
  }

  private persistGlobalSettings(entry: SDPluginEntry): void {
    this.settings?.set(`global-${sanitizeFileComponent(entry.uuid)}.json`, {
      settings: entry.globalSettings,
    });
  }

  private sendGlobalSettings(entry: SDPluginEntry): void {
    if (!entry.socket) return;
    this.send(entry.socket, {
      event: "didReceiveGlobalSettings",
      payload: entry.globalSettings,
    });
  }

  // -- outbound helpers ---------------------------------------------------------

  /** Map process-level status onto plugin registry status. */
  private pluginStatusFromProcess(status: SDProcessStatus | undefined): SDPluginStatus {
    switch (status) {
      case "starting":
        return "starting";
      case "running":
        return "running";
      case "unsupported":
        return "unsupported";
      default:
        // idle / crashed / failed / stopped — the registry doesn't
        // distinguish crash loops from clean stops (respawn policy lives in
        // the process wrapper).
        return "stopped";
    }
  }

  private findEntryBySocket(ws: WebSocket): SDPluginEntry | null {
    for (const entry of this.plugins.values()) {
      if (entry.socket === ws) return entry;
    }
    return null;
  }

  /**
   * Send an SDK event scoped to a context. Extra top-level fields (action,
   * device, context) follow the SDK frame shape; `body` becomes `payload`.
   */
  private sendToContext(
    context: SDContext,
    event: string,
    body: Record<string, unknown>,
    topLevel?: Record<string, unknown>,
  ): void {
    const entry = this.plugins.get(context.pluginUUID);
    if (!entry?.socket) return; // Not connected — willAppear replays on register.
    this.send(entry.socket, {
      event,
      context: context.context,
      ...topLevel,
      payload: body,
    });
  }

  private send(ws: WebSocket, message: Record<string, unknown>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      this.emit("outbound", message);
    }
  }
}
