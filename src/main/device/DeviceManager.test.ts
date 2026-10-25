// ============================================================================
// DeviceManager — behavior tests for the write pipeline
//
// Guards the bugs behind "glitchy hardware animations":
// - identical re-applies must NOT restart running animations
// - late frames are skipped (catch-up), never burst
// - superseded animation frames are dropped before USB
// - static/animation transitions behave sanely
//
// Uses a Fake StreamDeck (records writes) injected into the manager.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DeviceManager } from "./DeviceManager";
import type { DeviceInfo } from "../../shared/types";
import type { Logger } from "../utils/Logger";
import type { StreamDeck } from "@elgato-stream-deck/node";

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

const DEVICE_ID = "fake-device";
const KEY_BYTES = 72 * 72 * 3;

/** Records every key image write; resolves immediately like a fast USB path. */
class FakeStreamDeck {
  readonly writes: Array<{ keyIndex: number; head: string }> = [];

  async fillKeyBuffer(keyIndex: number, buffer: Buffer): Promise<void> {
    this.writes.push({
      keyIndex,
      head: buffer.subarray(0, 4).toString("utf8"),
    });
  }
  async clearKey(): Promise<void> {}
  async clearPanel(): Promise<void> {}
  async setBrightness(): Promise<void> {}
}

interface AnimatedKeySnapshot {
  deviceId: string;
  keyIndex: number;
  frames: Buffer[];
  delays: number[];
  currentFrame: number;
  nextFrameTime: number;
}

interface DeviceManagerInternals {
  devices: Map<string, { info: DeviceInfo; deck: StreamDeck }>;
  animatedKeys: Map<string, AnimatedKeySnapshot>;
}

function makeFrame(tag: string): Buffer {
  const buf = Buffer.alloc(KEY_BYTES, 0);
  buf.write(tag, 0, "utf8");
  return buf;
}

function deviceInfo(): DeviceInfo {
  return {
    id: DEVICE_ID,
    type: "original",
    serialNumber: "TEST",
    firmwareVersion: "1.0",
    rows: 3,
    columns: 5,
    keyCount: 15,
    keyWidth: 72,
    keyHeight: 72,
    connected: true,
  };
}

describe("DeviceManager", () => {
  let manager: DeviceManager;
  let internals: DeviceManagerInternals;
  let deck: FakeStreamDeck;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new DeviceManager(silentLogger);
    internals = manager as unknown as DeviceManagerInternals;
    deck = new FakeStreamDeck();
    internals.devices.set(DEVICE_ID, {
      info: deviceInfo(),
      deck: deck as unknown as StreamDeck,
    });
  });

  afterEach(async () => {
    await manager.cleanup();
    vi.useRealTimers();
  });

  it("should write frame 0 immediately and register the animation", async () => {
    // Arrange
    const frames = [makeFrame("AA"), makeFrame("BB"), makeFrame("CC")];

    // Act
    await manager.setKeyImage(DEVICE_ID, 0, frames, false, [60, 60, 60]);

    // Assert
    expect(deck.writes).toHaveLength(1);
    expect(deck.writes[0].head).toBe("AA\0\0");
    expect(internals.animatedKeys.size).toBe(1);
  });

  it("should not restart an animation when identical frames are re-applied", async () => {
    // Arrange
    const frames = [makeFrame("AA"), makeFrame("BB"), makeFrame("CC")];
    await manager.setKeyImage(DEVICE_ID, 0, frames, false, [60, 60, 60]);

    // Act: same frames again (profile re-apply, synced key press)
    await manager.setKeyImage(DEVICE_ID, 0, frames, false, [60, 60, 60]);

    // Assert: no additional writes, animation untouched
    expect(deck.writes).toHaveLength(1);
    expect(internals.animatedKeys.size).toBe(1);
  });

  it("should present frames at their exact delay times (no tick quantization)", async () => {
    // Arrange
    const frames = [makeFrame("AA"), makeFrame("BB"), makeFrame("CC")];
    await manager.setKeyImage(DEVICE_ID, 0, frames, false, [60, 60, 60]);

    // Act / Assert: at +60ms exactly one new frame; at +120ms one more.
    // With the old 50ms global tick, +60 showed zero writes (frame delayed
    // to the +100 tick) — that quantization was the visible jitter.
    await vi.advanceTimersByTimeAsync(60);
    expect(deck.writes.length).toBe(2); // frame 0 + frame 1

    await vi.advanceTimersByTimeAsync(60);
    expect(deck.writes.length).toBe(3); // + frame 2

    await vi.advanceTimersByTimeAsync(60);
    expect(deck.writes.length).toBe(4); // + frame 0 (loop)
  });

  it("should skip late frames instead of bursting after lag", async () => {
    // Arrange
    const frames = [makeFrame("AA"), makeFrame("BB"), makeFrame("CC")];
    await manager.setKeyImage(DEVICE_ID, 0, frames, false, [60, 60, 60]);
    const anim = internals.animatedKeys.get(`${DEVICE_ID}-0`);
    expect(anim).toBeDefined();

    // Act: simulate 1s of unprocessed lag, then let the armed timer fire
    anim!.nextFrameTime = Date.now() - 1000;
    const writesBefore = deck.writes.length;
    await vi.advanceTimersByTimeAsync(70); // past the 60ms frame timer

    // Assert: catch-up collapsed ~16 stale frames into a single write
    expect(deck.writes.length - writesBefore).toBe(1);
  });

  it("should drop superseded animation frames (latest-frame-wins)", async () => {
    // Arrange: frame 0 passes; every later write blocks until released
    const recorded: Array<{ keyIndex: number; head: string }> = [];
    let releaseUsb: () => void = () => {};
    const usbGate = new Promise<void>((resolve) => {
      releaseUsb = resolve;
    });
    let calls = 0;
    const slowDeck = new FakeStreamDeck();
    slowDeck.fillKeyBuffer = async (keyIndex: number, buffer: Buffer) => {
      calls++;
      if (calls > 1) await usbGate;
      recorded.push({
        keyIndex,
        head: buffer.subarray(0, 4).toString("utf8"),
      });
    };
    internals.devices.set(DEVICE_ID, {
      info: deviceInfo(),
      deck: slowDeck as unknown as StreamDeck,
    });

    const frames = [makeFrame("AA"), makeFrame("BB"), makeFrame("CC")];
    await manager.setKeyImage(DEVICE_ID, 0, frames, false, [60, 60, 60]);

    // Act: ~500ms of playback while the USB path is blocked (~8 frames due),
    // then release and let the pump drain
    await vi.advanceTimersByTimeAsync(500);
    releaseUsb();
    await vi.advanceTimersByTimeAsync(0);

    // Assert: superseded frames never reached USB — frame 0, the in-flight
    // frame, and at most the latest pending one (not ~8)
    expect(recorded.length).toBeLessThanOrEqual(3);
    expect(recorded[0].head).toBe("AA\0\0");
  });

  it("should skip an identical static re-write", async () => {
    // Arrange
    await manager.setKeyImage(DEVICE_ID, 1, makeFrame("ZZ"));

    // Act
    await manager.setKeyImage(DEVICE_ID, 1, makeFrame("ZZ"));

    // Assert
    expect(deck.writes).toHaveLength(1);
  });

  it("should write a changed static image", async () => {
    // Arrange
    await manager.setKeyImage(DEVICE_ID, 1, makeFrame("ZZ"));

    // Act
    await manager.setKeyImage(DEVICE_ID, 1, makeFrame("YY"));

    // Assert
    expect(deck.writes).toHaveLength(2);
    expect(deck.writes[1].head).toBe("YY\0\0");
  });

  it("should stop the animation when a static image replaces it", async () => {
    // Arrange
    const frames = [makeFrame("AA"), makeFrame("BB"), makeFrame("CC")];
    await manager.setKeyImage(DEVICE_ID, 0, frames, false, [60, 60, 60]);

    // Act
    await manager.setKeyImage(DEVICE_ID, 0, makeFrame("SS"));

    // Assert: animation deregistered; further ticks write nothing more
    expect(internals.animatedKeys.size).toBe(0);
    const writesAfter = deck.writes.length;
    await vi.advanceTimersByTimeAsync(300);
    expect(deck.writes.length).toBe(writesAfter);
  });

  it("should stop a key's animation when the key is cleared", async () => {
    // Arrange
    const frames = [makeFrame("AA"), makeFrame("BB"), makeFrame("CC")];
    await manager.setKeyImage(DEVICE_ID, 0, frames, false, [60, 60, 60]);

    // Act
    await manager.clearKey(DEVICE_ID, 0);

    // Assert
    expect(internals.animatedKeys.size).toBe(0);
  });

  it("should treat a single-frame array as a static image", async () => {
    // Arrange / Act
    await manager.setKeyImage(DEVICE_ID, 2, [makeFrame("ONE")], false, [100]);

    // Assert
    expect(deck.writes).toHaveLength(1);
    expect(internals.animatedKeys.size).toBe(0);
  });
});
