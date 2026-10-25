// ============================================================================
// BigDeck - Hardware Sync
// The ONLY writer of profile-driven key images to hardware, and the SINGLE
// OWNER of per-key rendered-image state ({ idle, pressed } per device:key).
//
// The renderer never pushes images; it saves profile config. This module
// diffs each key's appearance config against what was last rendered for the
// device, re-renders ONLY changed keys (each with a trailing debounce so
// slider drags/typing coalesce), and writes the result. Latest-write-wins via
// per-key generation counters.
//
// Every other consumer of key-image state (the IPC set-image handler and the
// hardware press/release visual path in the main entry point) reads and
// writes through getCachedImages/setCachedImages here. There must be no
// second copy of this cache — split-brain caches caused stale pressed images
// depending on which write path ran last (audit #1).
//
// HardwareSync also ACTS as the sdplugin placement authority: because it
// walks every key on apply/sync/clear, it diffs `sdplugin` action placements
// and publishes them as `placementsChanged` (consumed by the SD plugin
// bridge — see src/main/plugins/sd/SdBridge.ts). It deliberately knows
// nothing about the plugin host itself.
// ============================================================================

import { EventEmitter } from "events";
import { DEVICE_SPECS } from "../../shared/constants";
import type { KeyConfig, Profile, ProfilePage } from "../../shared/types";
import type { ActionEngine } from "./ActionEngine";
import type { DeviceManager } from "../device/DeviceManager";
import type { Logger } from "../utils/Logger";

export interface CachedKeyImages {
  idle: Buffer | Buffer[];
  pressed: Buffer | Buffer[];
}

// ---------------------------------------------------------------------------
// SD-plugin placement seam
//
// HardwareSync is the PLACEMENT AUTHORITY: it already walks every key of the
// active page on apply/sync/clear, so it is the only place that knows when an
// `sdplugin` action appears on, moves between, or vanishes from a key. The
// diff is published as a `placementsChanged` event; a bridge module (outside
// this file — HardwareSync must stay host-agnostic) forwards it to the SD
// plugin host as willAppear/willDisappear. Rendering state (images, hashes)
// and placement state are tracked independently: the render hash ignores
// plugin/action UUIDs (pixels don't change), the placement diff does not.
// ---------------------------------------------------------------------------

/** An `sdplugin` action placement on a key, as seen in a profile page. */
export interface SdPluginPlacement {
  keyIndex: number;
  pluginUUID: string;
  actionUUID: string;
  settings?: Record<string, unknown>;
}

/** Diff result carried by the `placementsChanged` event. */
export interface SdPluginPlacementChange {
  deviceId: string;
  /** Key gained an sdplugin action (was blank or another action type). */
  added: SdPluginPlacement[];
  /** Key lost its sdplugin action (cleared or another action type). */
  removed: SdPluginPlacement[];
  /** Same key re-placed with a different plugin/action identity. */
  changed: Array<{
    keyIndex: number;
    from: { pluginUUID: string; actionUUID: string };
    to: SdPluginPlacement;
  }>;
}

export class HardwareSync extends EventEmitter {
  private deviceManager: DeviceManager;
  private actionEngine: ActionEngine;
  private logger: Logger;

  /** device:key -> last rendered idle/pressed images (for instant press visuals) */
  private readonly keyImageCache = new Map<string, CachedKeyImages>();

  /** deviceId -> keyIndex -> appearance config hash of last render */
  private readonly lastDeviceState = new Map<string, Map<number, string>>();

  /**
   * deviceId -> keyIndex -> sdplugin placement identity of the last applied
   * page. In-memory only: the host's own registry owns persistence; this map
   * just scopes each `placementsChanged` diff to what THIS device currently
   * has applied.
   */
  private readonly lastSdPlacements = new Map<
    string,
    Map<number, { pluginUUID: string; actionUUID: string }>
  >();

  private readonly keyRenderTimers = new Map<string, NodeJS.Timeout>();
  private readonly keyRenderGen = new Map<string, number>();

  /** Trailing debounce per key — instant for single edits, coalesces drags. */
  private readonly debounceMs: number;

  constructor(
    deviceManager: DeviceManager,
    actionEngine: ActionEngine,
    logger: Logger,
    debounceMs = 120,
  ) {
    super();
    this.deviceManager = deviceManager;
    this.actionEngine = actionEngine;
    this.logger = logger;
    this.debounceMs = debounceMs;
  }

  getCachedImages(deviceId: string, keyIndex: number): CachedKeyImages | undefined {
    return this.keyImageCache.get(`${deviceId}:${keyIndex}`);
  }

  setCachedImages(deviceId: string, keyIndex: number, entry: CachedKeyImages): void {
    this.keyImageCache.set(`${deviceId}:${keyIndex}`, entry);
  }

  /** Appearance-relevant config fingerprint (actions don't affect pixels). */
  hashKeyConfig(keyConfig: KeyConfig): string {
    return JSON.stringify({
      img: keyConfig.image,
      lbl: keyConfig.label,
      lp: keyConfig.labelPosition,
      lc: keyConfig.labelColor,
      act: keyConfig.action?.type,
      aname: keyConfig.action?.name,
      layers: keyConfig.layers,
      pressedLayers: keyConfig.pressedLayers,
    });
  }

  private getDeviceCache(deviceId: string): Map<number, string> {
    let cache = this.lastDeviceState.get(deviceId);
    if (!cache) {
      cache = new Map();
      this.lastDeviceState.set(deviceId, cache);
    }
    return cache;
  }

  /**
   * Diff `page`'s sdplugin placements against what this device has applied,
   * update the tracking state, and emit `placementsChanged` when anything
   * moved. An undefined page (missing page, clearDevice) counts as "no
   * placements" — everything currently tracked is reported as removed.
   */
  private reconcileSdPluginPlacements(
    deviceId: string,
    page: ProfilePage | undefined,
  ): void {
    type Identity = { pluginUUID: string; actionUUID: string };
    const previous = this.lastSdPlacements.get(deviceId) ?? new Map<number, Identity>();
    const next = new Map<number, Identity>();
    const settingsByKey = new Map<number, Record<string, unknown> | undefined>();

    if (page) {
      for (const key of page.keys) {
        const action = key.action;
        if (!action || action.type !== "sdplugin") continue;
        next.set(key.keyIndex, { pluginUUID: action.pluginUUID, actionUUID: action.actionUUID });
        settingsByKey.set(key.keyIndex, action.settings);
      }
    }

    const added: SdPluginPlacement[] = [];
    const removed: SdPluginPlacement[] = [];
    const changed: SdPluginPlacementChange["changed"] = [];

    for (const [keyIndex, identity] of next) {
      const before = previous.get(keyIndex);
      if (!before) {
        added.push({ keyIndex, ...identity, settings: settingsByKey.get(keyIndex) });
      } else if (
        before.pluginUUID !== identity.pluginUUID ||
        before.actionUUID !== identity.actionUUID
      ) {
        changed.push({
          keyIndex,
          from: before,
          to: { keyIndex, ...identity, settings: settingsByKey.get(keyIndex) },
        });
      }
    }
    for (const [keyIndex, identity] of previous) {
      if (!next.has(keyIndex)) removed.push({ keyIndex, ...identity });
    }

    if (next.size > 0) this.lastSdPlacements.set(deviceId, next);
    else this.lastSdPlacements.delete(deviceId);

    if (added.length > 0 || removed.length > 0 || changed.length > 0) {
      this.emit("placementsChanged", {
        deviceId,
        added,
        removed,
        changed,
      } satisfies SdPluginPlacementChange);
    }
  }

  /**
   * Schedule a render+write for a single key. Rapid re-schedules for the same
   * key coalesce (trailing debounce); stale renders self-cancel via the
   * generation counter.
   */
  scheduleKeyRender(
    deviceId: string,
    keyIndex: number,
    keyConfig: KeyConfig,
    deviceType: Profile["deviceType"],
    opts?: { immediate?: boolean },
  ): void {
    const id = `${deviceId}:${keyIndex}`;
    const gen = (this.keyRenderGen.get(id) || 0) + 1;
    this.keyRenderGen.set(id, gen);

    const existing = this.keyRenderTimers.get(id);
    if (existing) clearTimeout(existing);

    const delay = opts?.immediate ? 0 : this.debounceMs;
    this.keyRenderTimers.set(
      id,
      setTimeout(async () => {
        this.keyRenderTimers.delete(id);
        if (this.keyRenderGen.get(id) !== gen) return; // superseded

        try {
          const rendered = await this.actionEngine.renderKeyImageEx(
            keyConfig,
            deviceType,
            false,
          );
          if (this.keyRenderGen.get(id) !== gen) return; // superseded mid-render

          this.keyImageCache.set(id, {
            idle: rendered.image,
            pressed: rendered.image,
          });
          await this.deviceManager.setKeyImage(
            deviceId,
            keyIndex,
            rendered.image,
            false,
            rendered.delays,
          );
          this.getDeviceCache(deviceId).set(keyIndex, this.hashKeyConfig(keyConfig));
        } catch (error) {
          this.logger.error(`Failed to render key ${keyIndex}: ${error}`);
        }
      }, delay),
    );
  }

  /**
   * Diff the profile's active page against the last-rendered state and
   * schedule only changed keys. Used on profile:updated.
   */
  syncChangedKeys(deviceId: string, profile: Profile): void {
    const page = profile.pages[profile.activePage];
    this.reconcileSdPluginPlacements(deviceId, page);
    if (!page) return;

    const deviceCache = this.getDeviceCache(deviceId);
    const keyCount = DEVICE_SPECS[profile.deviceType]?.keyCount || page.keys.length;

    for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
      const keyConfig = page.keys.find((k) => k.keyIndex === keyIndex) ?? {
        id: `blank-${keyIndex}`,
        keyIndex,
      };
      const configHash = this.hashKeyConfig(keyConfig as KeyConfig);
      if (deviceCache.get(keyIndex) === configHash) continue;

      this.scheduleKeyRender(deviceId, keyIndex, keyConfig as KeyConfig, profile.deviceType);
    }
  }

  /**
   * Schedule all changed keys immediately. Used on
   * connect/activate/page-switch where the whole page must appear at once.
   */
  applyProfileToDevice(deviceId: string, profile: Profile): void {
    const page = profile.pages[profile.activePage];
    this.reconcileSdPluginPlacements(deviceId, page);
    if (!page) return;

    const deviceCache = this.getDeviceCache(deviceId);
    const keyCount = DEVICE_SPECS[profile.deviceType]?.keyCount || page.keys.length;

    for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
      const keyConfig = page.keys.find((k) => k.keyIndex === keyIndex) ?? {
        id: `blank-${keyIndex}`,
        keyIndex,
      };
      const configHash = this.hashKeyConfig(keyConfig as KeyConfig);
      if (deviceCache.get(keyIndex) === configHash) continue;

      this.scheduleKeyRender(deviceId, keyIndex, keyConfig as KeyConfig, profile.deviceType, {
        immediate: true,
      });
    }
  }

  /**
   * Forget last-rendered state for a device (disconnect). Also retires every
   * sdplugin placement tracked for it — the emitted diff is what tells the
   * plugin host to deliver willDisappear; clearing the render hashes here is
   * what makes a reconnect re-render AND re-register every key (willAppear
   * again), even though the hardware panel went blank in between.
   */
  clearDevice(deviceId: string): void {
    this.lastDeviceState.delete(deviceId);
    for (const key of [...this.keyImageCache.keys()]) {
      if (key.startsWith(`${deviceId}:`)) this.keyImageCache.delete(key);
    }
    this.reconcileSdPluginPlacements(deviceId, undefined);
  }

  /** Cancel all pending renders (shutdown). */
  dispose(): void {
    for (const timer of this.keyRenderTimers.values()) clearTimeout(timer);
    this.keyRenderTimers.clear();
    this.keyRenderGen.clear();
    this.lastSdPlacements.clear();
  }
}
