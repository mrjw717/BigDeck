// ============================================================================
// ActionTickService — reusable per-key re-render ticker
//
// WHY: BigDeck renders keys only on config change (HardwareSync diff +
// debounce). Actions like Timer and Clock need re-renders nobody's config
// change triggered (docs/PLUGIN-ACTIONS-MATRIX.md §"Tick rendering").
//
// DESIGN (ADR-0002/0003 groundwork): this is a generic TICK-RENDERER
// REGISTRY, not a timer service. One 1s setInterval (never per-key) walks
// the registry and re-renders every entry whose `intervalMs` bucket has
// elapsed. Registrations are {keyId, render} pairs owned by whoever placed
// them (today: the timer/clock executor closures; tomorrow: screensavers,
// count-up badges, any display-state action). Frames are delivered through
// a TickImageSink wired from the app entry point:
//
//   - pushImage   → DeviceManager.setKeyImage (its hash-skip makes an
//                   unchanged frame a free no-op write),
//   - restoreIdle → HardwareSync.getCachedImages re-applied (a finished
//                   tick display hands the key back to its static look).
//
// A render fn returning NULL is the generic "my display finished" signal:
// the service unregisters the key and restores its idle image. That keeps
// state machines (timer countdown expiry) in the registration closures and
// the loop itself dumb.
//
// COST: one interval for the whole app; entries are skipped until their
// bucket elapses, and identical frames never reach the hardware.
//
// CLEANUP: stop() clears the interval and drops the registry — wired into
// the app's before-quit cleanup alongside HardwareSync.dispose().
// ============================================================================

import sharp from "sharp";
import { DEVICE_SPECS } from "../../shared/constants";
import type { DeviceType } from "../../shared/types";
import type { Logger } from "../utils/Logger";

/** Delivery seam — wired from index.ts where DeviceManager/HardwareSync live. */
export interface TickImageSink {
  /** Push a freshly rendered frame (or frames) to the device. */
  pushImage(
    deviceId: string,
    keyIndex: number,
    image: Buffer | Buffer[],
  ): Promise<void>;
  /** Re-apply the key's cached static appearance. True when restored. */
  restoreIdle(deviceId: string, keyIndex: number): Promise<boolean>;
}

/** One registered tick-rendered key. */
export interface TickEntry {
  /** `${deviceId}:${keyIndex}` — registry identity. */
  keyId: string;
  deviceId: string;
  keyIndex: number;
  /** Re-render when at least this much time passed since the last render. */
  intervalMs: number;
  /** Display owner label for logs ("timer", "clock", future "screensaver"). */
  kind: string;
  /**
   * Produce the next frame(s). Returning null means "display finished":
   * the entry is unregistered and the key's idle appearance is restored.
   */
  render: () => Promise<Buffer | Buffer[] | null>;
}

interface RegistryEntry extends TickEntry {
  /** Timestamp of the last actual render (bucket bookkeeping). */
  lastRender: number;
  /** Guards overlapping renders (a slow render must not double-fire). */
  inFlight: boolean;
}

const TICK_INTERVAL_MS = 1000;

export class ActionTickService {
  private readonly logger: Logger;
  private sink: TickImageSink | null = null;
  private readonly entries = new Map<string, RegistryEntry>();
  private interval: NodeJS.Timeout | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /** Called by the app entry point before the first registration. */
  setSink(sink: TickImageSink): void {
    this.sink = sink;
  }

  /** Registered key count (diagnostics). */
  get size(): number {
    return this.entries.size;
  }

  has(keyId: string): boolean {
    return this.entries.has(keyId);
  }

  /** Kind of the entry registered for keyId, if any. */
  kindOf(keyId: string): string | undefined {
    return this.entries.get(keyId)?.kind;
  }

  /** Snapshot of registered keys (for placement-sync diffs in callers). */
  listKeys(): Array<
    Pick<TickEntry, "keyId" | "deviceId" | "keyIndex" | "kind">
  > {
    return [...this.entries.values()].map(({ keyId, deviceId, keyIndex, kind }) => ({
      keyId,
      deviceId,
      keyIndex,
      kind,
    }));
  }

  /**
   * Register a key for tick re-rendering and render it immediately (the
   * display should appear on registration, not one tick later). Re-registering
   * the same keyId replaces the previous entry — used for config changes and
   * timer restarts.
   */
  register(entry: TickEntry): void {
    this.entries.set(entry.keyId, { ...entry, lastRender: 0, inFlight: false });
    this.ensureInterval();
    // Immediate first frame, off the interval's phase. Fire-and-forget: the
    // render's own errors are handled in renderOne.
    void this.renderOne(entry.keyId);
  }

  /**
   * Stop rendering a key. `restore` re-applies its cached static appearance
   * (set false when the caller restores it some other way).
   */
  async unregister(keyId: string, restore = true): Promise<void> {
    const entry = this.entries.get(keyId);
    if (!entry) return;
    this.entries.delete(keyId);
    if (restore) {
      try {
        await this.sink?.restoreIdle(entry.deviceId, entry.keyIndex);
      } catch (error) {
        this.logger.warn(
          `tick: failed to restore key ${keyId} after unregister:`,
          error,
        );
      }
    }
    if (this.entries.size === 0) this.stopInterval();
  }

  /** Shutdown: clear the interval and drop every registration. */
  stop(): void {
    this.stopInterval();
    this.entries.clear();
  }

  /** Test hook: fire one tick manually (production uses the 1s interval). */
  async tickForTests(now = Date.now()): Promise<void> {
    await this.tick(now);
  }

  private ensureInterval(): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      void this.tick();
    }, TICK_INTERVAL_MS);
  }

  private stopInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async tick(now = Date.now()): Promise<void> {
    const due = [...this.entries.values()].filter(
      (entry) =>
        !entry.inFlight &&
        (entry.lastRender === 0 || now - entry.lastRender >= entry.intervalMs),
    );
    await Promise.all(due.map((entry) => this.renderOne(entry.keyId)));
  }

  private async renderOne(keyId: string): Promise<void> {
    const entry = this.entries.get(keyId);
    if (!entry || entry.inFlight) return;
    if (!this.sink) {
      this.logger.warn(
        `tick: no image sink wired — cannot render ${entry.kind} on key ${keyId}`,
      );
      return;
    }
    entry.inFlight = true;
    try {
      const image = await entry.render();
      if (!this.entries.has(keyId)) return; // unregistered/replaced mid-render
      if (image === null) {
        // Generic "display finished" — hand the key back to its static look,
        // but only when THIS entry still owns the key (it may have been
        // re-registered while the render was in flight).
        if (this.entries.get(keyId) === entry) {
          this.entries.delete(keyId);
          try {
            await this.sink.restoreIdle(entry.deviceId, entry.keyIndex);
          } catch (error) {
            this.logger.warn(`tick: restore after finish failed for ${keyId}:`, error);
          }
          if (this.entries.size === 0) this.stopInterval();
        }
        return;
      }
      entry.lastRender = Date.now();
      await this.sink.pushImage(entry.deviceId, entry.keyIndex, image);
    } catch (error) {
      this.logger.error(`tick: render failed for ${keyId}:`, error);
    } finally {
      entry.inFlight = false;
    }
  }
}

// ---------------------------------------------------------------------------
// Tick frame rendering (SVG → PNG via sharp)
// ---------------------------------------------------------------------------

export interface TickFrameOptions {
  /** Backdrop fill (default: dark slab like the built-in action keys). */
  background?: string;
  /** Text fill (default white). */
  color?: string;
  /** Font size in px (default: auto-scaled from the longer text dimension). */
  fontSize?: number;
}

/**
 * Render one key frame with big bold text centered on a dark rounded rect —
 * the same visual language as KeyRenderer's text layers (white bold text on
 * a dark slab), produced independently so the tick pipeline stays decoupled
 * from KeyRenderer internals.
 */
export async function renderTickTextFrame(
  text: string,
  width: number,
  height: number,
  options: TickFrameOptions = {},
): Promise<Buffer> {
  const background = options.background ?? "#101018";
  const color = options.color ?? "#ffffff";
  const fontSize =
    options.fontSize ?? Math.round(Math.min(width, height) * 0.34);
  const radius = Math.round(Math.min(width, height) * 0.12);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="${radius}" ry="${radius}" fill="${background}"/>
  <text x="50%" y="50%" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" text-anchor="middle" dominant-baseline="central">${escapeXml(text)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Key pixel dimensions for a device type (tick frames must match hardware). */
export function tickKeySize(deviceType: DeviceType): {
  width: number;
  height: number;
} {
  const specs = DEVICE_SPECS[deviceType] ?? DEVICE_SPECS.original;
  return { width: specs.keyWidth, height: specs.keyHeight };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
