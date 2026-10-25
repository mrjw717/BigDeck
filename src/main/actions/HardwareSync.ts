// ============================================================================
// BigDeck - Hardware Sync
// The ONLY writer of profile-driven key images to hardware.
//
// The renderer never pushes images; it saves profile config. This module
// diffs each key's appearance config against what was last rendered for the
// device, re-renders ONLY changed keys (each with a trailing debounce so
// slider drags/typing coalesce), and writes the result. Latest-write-wins via
// per-key generation counters.
// ============================================================================

import { DEVICE_SPECS } from "../../shared/constants";
import type { KeyConfig, Profile } from "../../shared/types";
import type { ActionEngine } from "./ActionEngine";
import type { DeviceManager } from "../device/DeviceManager";
import type { Logger } from "../utils/Logger";

export interface CachedKeyImages {
  idle: Buffer | Buffer[];
  pressed: Buffer | Buffer[];
}

export class HardwareSync {
  private deviceManager: DeviceManager;
  private actionEngine: ActionEngine;
  private logger: Logger;

  /** device:key -> last rendered idle/pressed images (for instant press visuals) */
  private readonly keyImageCache = new Map<string, CachedKeyImages>();

  /** deviceId -> keyIndex -> appearance config hash of last render */
  private readonly lastDeviceState = new Map<string, Map<number, string>>();

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

  /** Forget last-rendered state for a device (disconnect). */
  clearDevice(deviceId: string): void {
    this.lastDeviceState.delete(deviceId);
    for (const key of [...this.keyImageCache.keys()]) {
      if (key.startsWith(`${deviceId}:`)) this.keyImageCache.delete(key);
    }
  }

  /** Cancel all pending renders (shutdown). */
  dispose(): void {
    for (const timer of this.keyRenderTimers.values()) clearTimeout(timer);
    this.keyRenderTimers.clear();
    this.keyRenderGen.clear();
  }
}
