// ============================================================================
// BigDeck - Device Manager
// Handles Streamdeck device detection, connection, and communication
//
// Write pipeline (single physical writer per device):
// - CONTROL lane: config images, pressed states, brightness, clears.
//   FIFO, never dropped, always drained before animation frames.
// - ANIMATION lane: latest-frame-wins per key; superseded frames are dropped
//   before they ever reach USB, so slow devices can't build up a backlog.
// - Animations are registered once and advanced by a single global timer with
//   time-based catch-up (late frames are skipped, keeping real-time sync).
// - Re-applying identical frames is a no-op (content hash), so key presses and
//   profile re-applies don't restart running animations.
// - Failed key writes are retried through the CONTROL lane (never raw USB
//   writes), so retries serialize with animation frames instead of tearing
//   them; writes that arrive while a device is momentarily missing (USB flap)
//   are queued at the boundary and land once the device returns.
// - Discovery is 2s polling with per-device connect backoff (5s doubling to a
//   30s cap) and a concurrent-connect guard; polling connects pass the
//   already-enumerated entry through, so no second enumeration can race the
//   first and re-open a device mid-enumeration.
// ============================================================================

import { EventEmitter } from "events";
import { createHash } from "crypto";
import {
  openStreamDeck,
  listStreamDecks,
  StreamDeck,
} from "@elgato-stream-deck/node";
import {
  ELGATO_VENDOR_ID,
  ELGATO_PRODUCT_IDS,
  DEVICE_SPECS,
} from "../../shared/constants";
import type { DeviceInfo, DeviceType } from "../../shared/types";
import type { Logger } from "../utils/Logger";

interface ConnectedDevice {
  info: DeviceInfo;
  deck: StreamDeck;
}

interface ControlOp {
  run: () => Promise<void>;
  resolve: () => void;
  reject: (err: unknown) => void;
}

interface DeviceWriteState {
  controlQueue: ControlOp[];
  /** keyIndex -> latest due animation frame (superseded frames overwritten) */
  pendingAnimFrames: Map<number, Buffer>;
  pumping: boolean;
}

interface AnimatedKey {
  deviceId: string;
  keyIndex: number;
  frames: Buffer[];
  /** Per-frame display durations in ms, aligned 1:1 with frames. */
  delays: number[];
  /** Index of the frame currently displayed. */
  currentFrame: number;
  /** Timestamp (ms) when the next frame is due. */
  nextFrameTime: number;
  /** Content identity — identical re-applies are ignored. */
  hash: string;
  /** Exact-time timer for the next frame (no tick quantization). */
  timer: NodeJS.Timeout | null;
}

/** A device entry as returned by listStreamDecks() enumeration. */
interface DiscoveredDevice {
  model: string;
  path: string;
  serialNumber?: string;
}

export class DeviceManager extends EventEmitter {
  private devices: Map<string, ConnectedDevice> = new Map();
  private writeStates: Map<string, DeviceWriteState> = new Map();
  private logger: Logger;
  private detectionInterval: NodeJS.Timeout | null = null;
  private isDetecting = false;
  private lastKeyTime: Map<string, number> = new Map();
  private failedWrites: Array<{
    deviceId: string;
    keyIndex: number;
    buffer: Buffer;
    retries: number;
  }> = [];
  private retryInterval: NodeJS.Timeout | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  /** deviceIds with an in-flight connect attempt (collapses concurrent tries). */
  private connecting: Set<string> = new Set();
  /** deviceId -> failures + earliest next attempt (flaky-USB thrash guard). */
  private connectBackoff: Map<
    string,
    { failures: number; nextAttemptAt: number }
  > = new Map();
  private readonly CONNECT_BACKOFF_BASE_MS = 5 * 1000;
  private readonly CONNECT_BACKOFF_MAX_MS = 30 * 1000;
  /** Hardware key-press debounce (switch noise is ~5-20ms; 80ms is safe). */
  private readonly KEY_DEBOUNCE_MS = 80;
  private inactivityTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
  private readonly DIM_LEVEL = 30;
  private currentBrightness: Map<string, number> = new Map();

  // ---- ANIMATION SYSTEM ----
  // Each animated key has its own exact-time setTimeout chain, so frames are
  // presented at their true delay times (a 60ms frame shows at +60ms, not at
  // the next 50ms tick boundary). Frame times accumulate from the original
  // schedule (no drift); when a frame fires late, stale frames are skipped
  // (catch-up) instead of bursting.
  private animatedKeys: Map<string, AnimatedKey> = new Map();
  /** Hash of the last config-level image written per key (static or frame 0). */
  private lastWrittenHash: Map<string, string> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  /**
   * Start device detection (including hot-plug monitoring)
   */
  async startDetection(): Promise<void> {
    this.logger.info("Starting device detection...");

    // Initial scan
    await this.scanDevices();

    // Setup polling for hot-plug detection
    // Note: node-hid doesn't support native hot-plug events on all platforms
    this.detectionInterval = setInterval(async () => {
      if (!this.isDetecting) {
        await this.scanDevices();
      }
    }, 2000);
  }

  /**
   * Stop device detection
   */
  stopDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  /**
   * Scan for connected Streamdeck devices
   */
  private async scanDevices(): Promise<void> {
    this.isDetecting = true;

    try {
      const detectedDevices = await listStreamDecks();
      const currentDeviceIds = new Set(this.devices.keys());
      const detectedIds = new Set<string>();

      for (const detected of detectedDevices) {
        const deviceId =
          detected.serialNumber || `${detected.model}-${detected.path}`;
        detectedIds.add(deviceId);

        if (!this.devices.has(deviceId)) {
          // Backoff gate: a device that just failed to open (flaky USB,
          // mid-reset) is not re-attempted until its cooldown expires —
          // retrying on every 2s poll thrashed the device.
          if (!this.canAttemptConnect(deviceId)) continue;

          // New device found — pass the enumeration entry through. A second
          // listStreamDecks() inside connectDevice could disagree with this
          // one (mid-enumeration race).
          await this.connectDevice(deviceId, detected);
        }
      }

      // Check for disconnected devices
      for (const existingId of currentDeviceIds) {
        if (!detectedIds.has(existingId)) {
          await this.handleDeviceDisconnect(existingId);
        }
      }
    } catch (error) {
      this.logger.error("Error scanning devices:", error);
    } finally {
      this.isDetecting = false;
    }
  }

  /**
   * Connect to a specific device.
   *
   * `deviceInfo` is the enumeration entry from the scan that discovered the
   * device; passing it through avoids a second listStreamDecks() whose result
   * could race the first (mid-enumeration opens on flaky USB). Manual connects
   * (IPC) without an entry fall back to a single enumeration lookup.
   *
   * Concurrent connects for the same deviceId are collapsed by `connecting`.
   * Repeated failures record an exponential backoff (5s doubling, 30s cap)
   * which the polling gate in scanDevices respects; a manual connect bypasses
   * the gate (explicit user intent) but still records failures.
   */
  async connectDevice(
    deviceId: string,
    deviceInfo?: DiscoveredDevice,
  ): Promise<boolean> {
    if (this.devices.has(deviceId)) {
      return true; // Already connected
    }
    if (this.connecting.has(deviceId)) {
      this.logger.debug(
        `Connect already in progress for ${deviceId}; skipping duplicate attempt`,
      );
      return false;
    }
    this.connecting.add(deviceId);

    let deck: StreamDeck | null = null;
    try {
      let discovered = deviceInfo;
      if (!discovered) {
        const devices = await listStreamDecks();
        discovered = devices.find(
          (d) =>
            d.serialNumber === deviceId ||
            `${d.model}-${d.path}` === deviceId,
        );

        if (!discovered) {
          this.logger.warn(`Device not found: ${deviceId}`);
          return false;
        }
      }

      deck = await openStreamDeck(discovered.path);

      // Get device type from model
      const deviceType = this.modelToDeviceType(discovered.model);
      const specs = DEVICE_SPECS[deviceType];

      const info: DeviceInfo = {
        id: deviceId,
        type: deviceType,
        serialNumber: discovered.serialNumber || "unknown",
        firmwareVersion: await this.getFirmwareVersion(deck),
        rows: specs.rows,
        columns: specs.columns,
        keyCount: specs.keyCount,
        keyWidth: specs.keyWidth,
        keyHeight: specs.keyHeight,
        connected: true,
      };

      // Setup event handlers - Clean up first to prevent duplicates
      deck.removeAllListeners("down");
      deck.removeAllListeners("up");

      deck.on("down", (keyIndex: number) => {
        const now = Date.now();
        const keyId = `${deviceId}-${keyIndex}`;
        const lastTime = this.lastKeyTime.get(keyId) || 0;

        if (now - lastTime < this.KEY_DEBOUNCE_MS) {
          this.logger.debug(`Debouncing duplicate key down: ${keyId}`);
          return;
        }
        this.lastKeyTime.set(keyId, now);

        this.logger.info(
          `HARDWARE EVENT: Key Down [${keyIndex}] on device ${deviceId} (Row: ${Math.floor(keyIndex / specs.columns)}, Col: ${keyIndex % specs.columns})`,
        );
        this.emit("key:down", { deviceId, keyIndex });

        // Reset inactivity timer on key press
        this.resetInactivityTimer(deviceId);
      });

      deck.on("up", (keyIndex: number) => {
        this.logger.info(
          `HARDWARE EVENT: Key Up [${keyIndex}] on device ${deviceId}`,
        );
        this.emit("key:up", { deviceId, keyIndex });
      });

      // Stream Deck + specific events
      if (deviceType === "plus") {
        deck.on("rotateLeft", (dialIndex: number, amount: number) => {
          this.emit("dial:rotate", { deviceId, dialIndex, amount: -amount });
        });

        deck.on("rotateRight", (dialIndex: number, amount: number) => {
          this.emit("dial:rotate", { deviceId, dialIndex, amount: amount });
        });

        deck.on("encoderDown", (dialIndex: number) => {
          this.emit("dial:down", { deviceId, dialIndex });
        });

        deck.on("encoderUp", (dialIndex: number) => {
          this.emit("dial:up", { deviceId, dialIndex });
        });

        deck.on(
          "lcdShortPress",
          (dialIndex: number, pos: { x: number; y: number }) => {
            this.emit("touch:tap", { deviceId, dialIndex, x: pos.x, y: pos.y });
          },
        );
      }

      deck.on("error", (error: unknown) => {
        this.logger.error(`Device error (${deviceId}):`, error);
        this.handleDeviceDisconnect(deviceId);
      });

      this.devices.set(deviceId, { info, deck });

      // Wait a bit for the device to be ready for commands
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.emit("device:connected", info);

      // Success clears the failure backoff — the next flap reconnects at once
      this.connectBackoff.delete(deviceId);

      this.logger.info(`Connected to ${specs.name} (${deviceId})`);
      return true;
    } catch (error) {
      // Don't leak an opened handle when a post-open step failed
      if (deck) {
        deck.close().catch(() => {});
      }
      this.recordConnectFailure(deviceId);
      this.logger.error(`Failed to connect device ${deviceId}:`, error);
      return false;
    } finally {
      this.connecting.delete(deviceId);
    }
  }

  /**
   * Whether a connect attempt is allowed for a device now. After a failure
   * the next attempt waits CONNECT_BACKOFF_BASE_MS, doubling per consecutive
   * failure up to CONNECT_BACKOFF_MAX_MS.
   */
  private canAttemptConnect(deviceId: string): boolean {
    const entry = this.connectBackoff.get(deviceId);
    return !entry || Date.now() >= entry.nextAttemptAt;
  }

  /** Record a failed connect attempt and schedule the next one (backoff). */
  private recordConnectFailure(deviceId: string): void {
    const entry =
      this.connectBackoff.get(deviceId) ?? { failures: 0, nextAttemptAt: 0 };
    entry.failures += 1;
    const delay = Math.min(
      this.CONNECT_BACKOFF_BASE_MS * 2 ** (entry.failures - 1),
      this.CONNECT_BACKOFF_MAX_MS,
    );
    entry.nextAttemptAt = Date.now() + delay;
    this.connectBackoff.set(deviceId, entry);
    this.logger.warn(
      `Connect failed for ${deviceId}; backing off ${Math.round(delay / 1000)}s`,
    );
  }

  /**
   * Disconnect a specific device
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      try {
        await device.deck.close();
      } catch (error) {
        this.logger.warn(`Error closing device ${deviceId}:`, error);
      }
      this.devices.delete(deviceId);
      this.writeStates.delete(deviceId);
      this.emit("device:disconnected", deviceId);
    }
  }

  /**
   * Handle device disconnect (unexpected)
   */
  private async handleDeviceDisconnect(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.info.connected = false;
      try {
        await device.deck.close();
      } catch {
        // Ignore close errors on disconnect
      }
      this.devices.delete(deviceId);
      this.writeStates.delete(deviceId);

      // Drop animation state for the departed device
      for (const [keyId, anim] of this.animatedKeys) {
        if (anim.deviceId === deviceId) {
          if (anim.timer) clearTimeout(anim.timer);
          this.animatedKeys.delete(keyId);
        }
      }

      // Forget content hashes too: they describe what the HARDWARE was
      // showing, and the departed device's panel is blank now. Keeping them
      // made post-reconnect re-applies no-op as "identical" and left blank
      // keys after a flap.
      for (const keyId of [...this.lastWrittenHash.keys()]) {
        if (keyId.startsWith(`${deviceId}-`)) this.lastWrittenHash.delete(keyId);
      }

      this.emit("device:disconnected", deviceId);
      this.logger.info(`Device disconnected: ${deviceId}`);
    }
  }

  /**
   * Get all connected devices
   */
  getDevices(): DeviceInfo[] {
    return Array.from(this.devices.values()).map((d) => d.info);
  }

  /**
   * Get a specific device
   */
  getDevice(deviceId: string): DeviceInfo | null {
    return this.devices.get(deviceId)?.info || null;
  }

  /**
   * Set device brightness
   */
  async setBrightness(deviceId: string, brightness: number): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const clampedBrightness = Math.max(0, Math.min(100, brightness));
    await this.enqueueControl(deviceId, () =>
      device.deck.setBrightness(clampedBrightness),
    );
  }

  /**
   * Content hash for identity comparison. Fast path samples up to 256 bytes
   * per frame — enough to distinguish frames without hashing megabytes.
   */
  private hashFrames(frames: Buffer[], delays: number[]): string {
    const hash = createHash("sha1");
    hash.update(String(frames.length));
    hash.update(delays.join(","));
    for (const f of frames) {
      hash.update(String(f.length));
      hash.update(f.subarray(0, Math.min(256, f.length)));
    }
    return hash.digest("hex");
  }

  /**
   * Set image on a key (static or animated).
   *
   * - Static: written via the control lane; identical re-writes are skipped.
   * - Animated: frame 0 is written immediately via the control lane, then the
   *   animation is registered with the global timer. Re-applying the identical
   *   animation (same frames + delays) is a no-op, so presses and profile
   *   re-applies don't restart running animations.
   */
  async setKeyImage(
    deviceId: string,
    keyIndex: number,
    imageOrFrames: Buffer | Buffer[],
    forceUpdate: boolean = false,
    delays?: number[],
  ): Promise<void> {
    const device = this.devices.get(deviceId);

    // Genuinely invalid request — throw without queueing; no retry can fix it.
    if (device && (keyIndex < 0 || keyIndex >= device.info.keyCount)) {
      throw new Error(
        `Invalid key index ${keyIndex} for device ${deviceId} (${device.info.keyCount} keys)`,
      );
    }

    if (!device) {
      // Transient device absence (USB flap / mid-enumeration). This is
      // retryable, so the write goes into the failedWrites retry queue here
      // at the boundary — throwing past all handlers without queueing meant
      // renders scheduled during a flap were lost forever (blank keys until
      // a manual profile re-apply). We still rethrow after queueing so
      // callers keep their existing failure handling and don't record the
      // render as complete; the retry queue delivers once the device returns.
      // For animations only frame 0 is queued — the full animation is
      // re-applied on reconnect (device:connected re-applies the profile).
      if (Array.isArray(imageOrFrames) && imageOrFrames.length === 0) {
        return; // Nothing to write (matches the connected-device no-op path)
      }
      const first = Array.isArray(imageOrFrames) ? imageOrFrames[0] : imageOrFrames;
      this.queueFailedWrite(
        deviceId,
        keyIndex,
        Buffer.isBuffer(first) ? first : Buffer.from(first),
      );
      throw new Error(
        `Device not connected, key ${keyIndex} write queued for retry: ${deviceId}`,
      );
    }

    const keyId = `${deviceId}-${keyIndex}`;

    if (Array.isArray(imageOrFrames)) {
      const frames = imageOrFrames.map((f) =>
        Buffer.isBuffer(f) ? f : Buffer.from(f),
      );
      if (frames.length === 0) return;

      // Single-frame "animation" is just a static image
      if (frames.length === 1) {
        return this.setKeyImage(deviceId, keyIndex, frames[0], forceUpdate);
      }

      // Normalize delays: floor of 20ms so catch-up loops are always bounded.
      const frameDelays = delays && delays.length > 0
        ? Array.from({ length: frames.length }, (_, i) => {
            const d = delays[Math.min(i, delays.length - 1)];
            return d > 0 ? Math.max(20, d) : 100;
          })
        : new Array(frames.length).fill(100);

      const hash = this.hashFrames(frames, frameDelays);
      const existing = this.animatedKeys.get(keyId);

      // Identical animation already running — leave it alone.
      if (!forceUpdate && existing && existing.hash === hash) {
        return;
      }

      this.stopAnimation(deviceId, keyIndex);

      // Write first frame immediately via control lane for instant feedback
      try {
        await this.writeKeyImage(deviceId, keyIndex, frames[0]);
        this.lastWrittenHash.set(keyId, hash);
      } catch (error) {
        this.logger.warn(`Animation first frame failed for ${deviceId}:${keyIndex}: ${error}`);
        return;
      }

      const now = Date.now();
      this.animatedKeys.set(keyId, {
        deviceId,
        keyIndex,
        frames,
        delays: frameDelays,
        currentFrame: 0,
        nextFrameTime: now + frameDelays[0],
        hash,
        timer: null,
      });
      this.scheduleFrameTimer(keyId);
      return;
    }

    // ---- Static image ----
    const buf = Buffer.isBuffer(imageOrFrames) ? imageOrFrames : Buffer.from(imageOrFrames);
    const hash = this.hashFrames([buf], []);

    const hadAnimation = this.animatedKeys.has(keyId);
    this.stopAnimation(deviceId, keyIndex);
    if (!forceUpdate && !hadAnimation && this.lastWrittenHash.get(keyId) === hash) {
      return; // Identical static image already on the key
    }

    await this.writeKeyImage(deviceId, keyIndex, buf);
    this.lastWrittenHash.set(keyId, hash);
  }

  /**
   * Arm the exact-time timer for a key's next frame. Frame times come from
   * the accumulated schedule (nextFrameTime), so pacing is drift-free.
   */
  private scheduleFrameTimer(keyId: string): void {
    const anim = this.animatedKeys.get(keyId);
    if (!anim) return;

    const ms = Math.max(0, anim.nextFrameTime - Date.now());
    anim.timer = setTimeout(() => this.frameDue(keyId), ms);
  }

  /**
   * A frame is due for an animated key. Advances to whichever frame should be
   * showing NOW (skipping stale frames when late — catch-up, never burst),
   * offers it to the animation lane, and arms the next exact-time timer.
   */
  private frameDue(keyId: string): void {
    const anim = this.animatedKeys.get(keyId);
    if (!anim) return;

    const now = Date.now();
    // Advance to the frame that should be showing now. Delays are normalized
    // to >=20ms at registration, so this loop is bounded by lag/20. The guard
    // is a last-resort safety net: if it's ever exhausted, resync to now
    // rather than bursting.
    let guard = 0;
    do {
      anim.currentFrame = (anim.currentFrame + 1) % anim.frames.length;
      anim.nextFrameTime += anim.delays[anim.currentFrame] || 100;
      guard++;
    } while (anim.nextFrameTime <= now && guard < 1000);

    if (anim.nextFrameTime <= now) {
      anim.nextFrameTime = now + (anim.delays[anim.currentFrame] || 100);
    }

    const frame = anim.frames[anim.currentFrame];
    if (frame) {
      this.offerAnimationFrame(anim.deviceId, anim.keyIndex, frame);
    }

    this.scheduleFrameTimer(keyId);
  }

  /**
   * Offer a frame to the animation lane. Latest-frame-wins per key: a frame
   * that arrives before the previous one was written simply replaces it.
   */
  private offerAnimationFrame(deviceId: string, keyIndex: number, frame: Buffer): void {
    const state = this.getWriteState(deviceId);
    state.pendingAnimFrames.set(keyIndex, frame);
    void this.pumpDevice(deviceId);
  }

  private getWriteState(deviceId: string): DeviceWriteState {
    let state = this.writeStates.get(deviceId);
    if (!state) {
      state = { controlQueue: [], pendingAnimFrames: new Map(), pumping: false };
      this.writeStates.set(deviceId, state);
    }
    return state;
  }

  /**
   * Enqueue a control-lane operation (config images, clears, brightness).
   * Control ops are FIFO, never dropped, and always drain before animation
   * frames — so user edits and key presses take priority over GIF frames.
   */
  private enqueueControl(deviceId: string, run: () => Promise<void>): Promise<void> {
    const state = this.getWriteState(deviceId);
    return new Promise<void>((resolve, reject) => {
      state.controlQueue.push({ run, resolve, reject });
      void this.pumpDevice(deviceId);
    });
  }

  /**
   * The single physical writer per device. Drains control ops first, then
   * writes the latest pending animation frame for each key.
   */
  private async pumpDevice(deviceId: string): Promise<void> {
    const state = this.writeStates.get(deviceId);
    if (!state || state.pumping) return;
    state.pumping = true;

    try {
      for (;;) {
        // 1. Control lane first — user edits/presses preempt animation frames
        const op = state.controlQueue.shift();
        if (op) {
          try {
            await op.run();
            op.resolve();
          } catch (err) {
            op.reject(err);
          }
          continue;
        }

        // 2. Animation lane — latest frame per key, superseded frames dropped
        if (state.pendingAnimFrames.size > 0) {
          const batch = [...state.pendingAnimFrames.entries()];
          state.pendingAnimFrames.clear();
          for (const [keyIndex, frame] of batch) {
            await this.doFillKey(deviceId, keyIndex, frame);
          }
          continue;
        }

        break; // Both lanes empty
      }
    } finally {
      state.pumping = false;
      // Work may have arrived between the last check and clearing the flag
      if (state.controlQueue.length > 0 || state.pendingAnimFrames.size > 0) {
        void this.pumpDevice(deviceId);
      }
    }
  }

  /**
   * Low-level key write with error reporting.
   */
  private async doFillKey(deviceId: string, keyIndex: number, buf: Buffer): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    try {
      await device.deck.fillKeyBuffer(keyIndex, buf, { format: "rgb" });
    } catch (innerError) {
      this.logger.error(
        `Failed to execute fillKeyBuffer for key ${keyIndex} on ${deviceId}`,
        innerError,
      );
      throw innerError;
    }
  }

  /**
   * Control-lane key image write with failure queueing.
   */
  private async writeKeyImage(
    deviceId: string,
    keyIndex: number,
    imageBuffer: Buffer,
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    // IPC serializes Buffer to Uint8Array; ensure it's a proper Buffer
    const buf = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer);

    try {
      await this.enqueueControl(deviceId, () => this.doFillKey(deviceId, keyIndex, buf));
    } catch (e) {
      this.logger.error(
        `HARDWARE WRITE ERROR: Failed to write Key [${keyIndex}]`,
        e,
      );
      this.queueFailedWrite(deviceId, keyIndex, buf);
      this.emit("hardware-error", {
        deviceId,
        keyIndex,
        error: e,
      });
      throw e;
    }
  }

  private queueFailedWrite(
    deviceId: string,
    keyIndex: number,
    buffer: Buffer,
  ): void {
    this.failedWrites.push({
      deviceId,
      keyIndex,
      buffer,
      retries: 0,
    });
    this.startRetryQueue();
  }

  /**
   * Retry failed key writes once per RETRY_DELAY_MS. Retries re-enter the
   * device's CONTROL lane (enqueueControl) rather than writing raw USB, so
   * they can never interleave with animation-lane frames. A write whose
   * device is still missing is re-queued (retries++) until MAX_RETRIES.
   */
  private startRetryQueue(): void {
    if (this.retryInterval) return;

    this.retryInterval = setInterval(async () => {
      const toRetry = [...this.failedWrites];
      this.failedWrites.length = 0;

      for (const write of toRetry) {
        if (write.retries >= this.MAX_RETRIES) {
          this.logger.error(
            `Max retries reached for key ${write.keyIndex} on ${write.deviceId}`,
          );
          continue;
        }

        try {
          const device = this.devices.get(write.deviceId);
          if (!device) {
            write.retries++;
            this.failedWrites.push(write);
            continue;
          }

          // Retry through the control lane like any other op. Writing via
          // deck.fillKeyBuffer directly here interleaved raw retries with
          // animation-lane frames on the same device -> torn/stale frames
          // while retries were in flight. The single pump serializes this
          // behind pending control ops and animation frames.
          await this.enqueueControl(
            write.deviceId,
            () => this.doFillKey(write.deviceId, write.keyIndex, write.buffer),
          );
          this.logger.info(
            `Retry successful for key ${write.keyIndex} on ${write.deviceId}`,
          );
        } catch (error) {
          write.retries++;
          this.failedWrites.push(write);
          this.logger.warn(
            `Retry failed for key ${write.keyIndex} on ${write.deviceId}, attempt ${write.retries}`,
          );
        }
      }

      if (this.failedWrites.length === 0 && this.retryInterval) {
        clearInterval(this.retryInterval);
        this.retryInterval = null;
      }
    }, this.RETRY_DELAY_MS);
  }

  /**
   * Stop any active animation for a key (clears its frame timer).
   */
  private stopAnimation(deviceId: string, keyIndex: number): void {
    const keyId = `${deviceId}-${keyIndex}`;
    const anim = this.animatedKeys.get(keyId);
    if (anim?.timer) clearTimeout(anim.timer);
    this.animatedKeys.delete(keyId);
  }

  /**
   * Clear a specific key
   */
  async clearKey(deviceId: string, keyIndex: number): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    this.stopAnimation(deviceId, keyIndex);
    this.lastWrittenHash.delete(`${deviceId}-${keyIndex}`);
    await this.enqueueControl(deviceId, () => device.deck.clearKey(keyIndex));
  }

  /**
   * Clear all keys
   */
  async clearAllKeys(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    for (const [keyId, anim] of this.animatedKeys) {
      if (anim.deviceId === deviceId) {
        if (anim.timer) clearTimeout(anim.timer);
        this.animatedKeys.delete(keyId);
      }
    }
    await this.enqueueControl(deviceId, () => device.deck.clearPanel());
  }

  /**
   * Fill a key with a solid color
   */
  async fillKeyColor(
    deviceId: string,
    keyIndex: number,
    r: number,
    g: number,
    b: number,
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    this.stopAnimation(deviceId, keyIndex);
    await this.enqueueControl(deviceId, () =>
      device.deck.fillKeyColor(keyIndex, r, g, b),
    );
  }

  /**
   * Get StreamDeck instance for advanced operations
   */
  getDeck(deviceId: string): StreamDeck | null {
    return this.devices.get(deviceId)?.deck || null;
  }

  /**
   * Cleanup all devices
   */
  async cleanup(): Promise<void> {
    this.stopDetection();

    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
    this.failedWrites.length = 0;

    for (const anim of this.animatedKeys.values()) {
      if (anim.timer) clearTimeout(anim.timer);
    }
    this.animatedKeys.clear();

    for (const timer of this.inactivityTimers.values()) {
      clearTimeout(timer);
    }
    this.inactivityTimers.clear();

    for (const [deviceId, device] of this.devices) {
      try {
        await device.deck.clearPanel();
        await device.deck.close();
      } catch (error) {
        this.logger.warn(`Error cleaning up device ${deviceId}:`, error);
      }
    }

    this.devices.clear();
    this.writeStates.clear();
    this.connecting.clear();
    this.connectBackoff.clear();
  }

  /**
   * Convert model string to DeviceType
   */
  private modelToDeviceType(model: string): DeviceType {
    const modelLower = model.toLowerCase();
    const modelMap: Record<string, DeviceType> = {
      original: "original",
      originalv2: "original-v2",
      mini: "mini",
      minimk2: "mini-mk2",
      xl: "xl",
      xlv2: "xl-v2",
      mk2: "mk2",
      pedal: "pedal",
      plus: "plus",
      neo: "neo",
      studio: "studio",
    };

    if (modelMap[modelLower]) {
      return modelMap[modelLower];
    }

    this.logger.warn(
      `Unknown device model: "${model}", falling back to 'original'`,
    );

    // Simple heuristic fallback for unmapped devices
    if (modelLower.includes("xl")) return "xl";
    if (modelLower.includes("mini")) return "mini";
    if (modelLower.includes("plus")) return "plus";
    if (modelLower.includes("neo")) return "neo";

    return "original";
  }

  /**
   * Get firmware version (if available)
   */
  private async getFirmwareVersion(deck: StreamDeck): Promise<string> {
    try {
      return await deck.getFirmwareVersion();
    } catch {
      return "unknown";
    }
  }

  /**
   * Reset inactivity timer for a device - call on any user interaction.
   * Timers are tracked per-device so multiple decks don't clobber each other.
   */
  resetInactivityTimer(deviceId: string): void {
    const existing = this.inactivityTimers.get(deviceId);
    if (existing) {
      clearTimeout(existing);
    }

    // Restore brightness if it was dimmed
    const previousBrightness = this.currentBrightness.get(deviceId);
    if (previousBrightness !== undefined && previousBrightness < 100) {
      this.setBrightness(deviceId, 100).catch(() => {});
    }

    const timer = setTimeout(async () => {
      const device = this.devices.get(deviceId);
      if (device) {
        this.currentBrightness.set(deviceId, 100);
        await this.setBrightness(deviceId, this.DIM_LEVEL);
        this.logger.info(`Auto-dimmed device ${deviceId} due to inactivity`);
      }
      this.inactivityTimers.delete(deviceId);
    }, this.INACTIVITY_TIMEOUT_MS);

    this.inactivityTimers.set(deviceId, timer);
  }

  /**
   * Enable or disable auto-dim feature
   */
  setAutoDim(enabled: boolean): void {
    if (!enabled) {
      for (const timer of this.inactivityTimers.values()) {
        clearTimeout(timer);
      }
      this.inactivityTimers.clear();
    }
  }
}
