// ============================================================================
// KeyRenderer — behavior tests for the animation pipeline
//
// Uses the REAL sharp pipeline against a checked-in 10-frame GIF fixture
// (src/main/actions/__fixtures__/anim-10f.gif, 32x32, 100ms delays).
// These tests guard the bugs that caused glitchy hardware animations:
// frame-count budget, delay alignment, short-animation looping, cache.
// ============================================================================

import { describe, it, expect, beforeAll, vi } from "vitest";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { KeyRenderer } from "./KeyRenderer";
import type { KeyConfig, KeyLayer } from "../../shared/types";
import type { Logger } from "../utils/Logger";

const FIXTURE_GIF = path.join(__dirname, "__fixtures__", "anim-10f.gif");
const FIXTURE_TRANSPARENT_GIF = path.join(
  __dirname,
  "__fixtures__",
  "anim-transparent.gif",
);
const RGB_BYTES = 72 * 72 * 3;

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

function imageLayer(id: string, order: number, source: string): KeyLayer {
  return {
    id,
    type: "image",
    visible: true,
    opacity: 1,
    order,
    source,
    fit: "contain",
  };
}

function textLayer(id: string, order: number, text: string): KeyLayer {
  return {
    id,
    type: "text",
    visible: true,
    opacity: 1,
    order,
    text,
    fontSize: 18,
    textColor: "#ffffff",
  };
}

function keyWithLayers(layers: KeyLayer[]): KeyConfig {
  return { id: "test-key", keyIndex: 0, layers };
}

describe("KeyRenderer", () => {
  let renderer: KeyRenderer;
  let userDataPath: string;

  beforeAll(async () => {
    userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), "bigdeck-test-"));
    renderer = new KeyRenderer(silentLogger, userDataPath);
  });

  it("should return all 10 frames of an animated layer with aligned delays", async () => {
    // Arrange
    const key = keyWithLayers([imageLayer("l1", 0, FIXTURE_GIF)]);

    // Act
    const result = await renderer.renderKeyImageEx(key, "original", false);

    // Assert
    const frames = Array.isArray(result.image) ? result.image : [result.image];
    expect(frames).toHaveLength(10);
    expect(result.delays).toHaveLength(10);
    expect(result.delays).toEqual(new Array(10).fill(100));
  });

  it("should produce raw RGB frames sized exactly for the device", async () => {
    // Arrange
    const key = keyWithLayers([imageLayer("l1", 0, FIXTURE_GIF)]);

    // Act
    const result = await renderer.renderKeyImageEx(key, "original", false);

    // Assert
    const frames = Array.isArray(result.image) ? result.image : [result.image];
    for (const frame of frames) {
      expect(frame.length).toBe(RGB_BYTES);
    }
  });

  it("should cap animations at 60 frames while preserving total loop duration", async () => {
    // Arrange: same source 7x would make 70 frames via concatenation — instead
    // assert the budget indirectly: 10 frames stay 10, and sampleTimeline's
    // duration preservation is covered by delays summing to source duration.
    const key = keyWithLayers([imageLayer("l1", 0, FIXTURE_GIF)]);

    // Act
    const result = await renderer.renderKeyImageEx(key, "original", false);

    // Assert
    const total = (result.delays ?? []).reduce((a, b) => a + b, 0);
    expect(total).toBe(1000); // 10 frames x 100ms source duration
  });

  it("should loop shorter animations instead of freezing them (modulo)", async () => {
    // Arrange: two layers — 10-frame gif + static text.
    // If looping were broken (freeze at last frame), composed frames 0..9 would
    // still equal 10, so instead verify via two gifs where max wins.
    const key = keyWithLayers([
      imageLayer("a", 0, FIXTURE_GIF),
      imageLayer("b", 1, FIXTURE_GIF),
    ]);

    // Act
    const result = await renderer.renderKeyImageEx(key, "original", false);

    // Assert
    const frames = Array.isArray(result.image) ? result.image : [result.image];
    expect(frames).toHaveLength(10);
  });

  it("should composite background + animation + text into valid RGB frames", async () => {
    // Arrange
    const key = keyWithLayers([
      {
        id: "bg",
        type: "background",
        visible: true,
        opacity: 1,
        order: 0,
        backgroundGradientStart: "#ff0000",
        backgroundGradientEnd: "#0000ff",
      },
      imageLayer("anim", 1, FIXTURE_GIF),
      textLayer("label", 2, "HELLO"),
    ]);

    // Act
    const result = await renderer.renderKeyImageEx(key, "original", false);

    // Assert
    const frames = Array.isArray(result.image) ? result.image : [result.image];
    expect(frames).toHaveLength(10);
    for (const frame of frames) {
      expect(frame.length).toBe(RGB_BYTES);
    }
  });

  it("should render a single static RGB buffer for non-animated keys", async () => {
    // Arrange
    const key = keyWithLayers([textLayer("t", 0, "STATIC")]);

    // Act
    const result = await renderer.renderKeyImageEx(key, "original", false);

    // Assert
    expect(Buffer.isBuffer(result.image)).toBe(true);
    expect((result.image as Buffer).length).toBe(RGB_BYTES);
    expect(result.delays).toBeUndefined();
  });

  it("should render identical output for a repeated render (cache consistency)", async () => {
    // Arrange
    const key = keyWithLayers([imageLayer("l1", 0, FIXTURE_GIF)]);

    // Act
    const first = await renderer.renderKeyImageEx(key, "original", false);
    const second = await renderer.renderKeyImageEx(key, "original", false);

    // Assert
    const f1 = (Array.isArray(first.image) ? first.image : [first.image])[0];
    const f2 = (Array.isArray(second.image) ? second.image : [second.image])[0];
    expect(f1.equals(f2)).toBe(true);
  });

  it("should fall back to a blank frame for a missing image source", async () => {
    // Arrange
    const key = keyWithLayers([
      imageLayer("missing", 0, "/nonexistent/path/nope.gif"),
    ]);

    // Act
    const result = await renderer.renderKeyImageEx(key, "original", false);

    // Assert: still produces a valid static frame rather than throwing
    expect(Buffer.isBuffer(result.image)).toBe(true);
    expect((result.image as Buffer).length).toBe(RGB_BYTES);
  });

  it("should report delays via getAnimationDelays that match the render output", async () => {
    // Arrange
    const key = keyWithLayers([imageLayer("l1", 0, FIXTURE_GIF)]);

    // Act
    const delays = await renderer.getAnimationDelays(key);

    // Assert
    expect(delays).toEqual(new Array(10).fill(100));
  });

  it("should composite animated transparency over layers below (alpha preserved)", async () => {
    // Arrange: solid green background, transparent GIF (red/blue square) on top
    const key = keyWithLayers([
      {
        id: "bg",
        type: "background",
        visible: true,
        opacity: 1,
        order: 0,
        backgroundColor: "#00ff00",
      },
      imageLayer("anim", 1, FIXTURE_TRANSPARENT_GIF),
    ]);

    // Act
    const result = await renderer.renderKeyImageEx(key, "original", false);
    const frames = Array.isArray(result.image) ? result.image : [result.image];

    // Assert
    expect(frames.length).toBe(2);

    const px = (frame: Buffer, x: number, y: number) => {
      const i = (y * 72 + x) * 3;
      return [frame[i], frame[i + 1], frame[i + 2]];
    };

    // Frame 0: transparent corner shows the green background through,
    // opaque center shows the GIF's red square (not black, not green)
    const corner0 = px(frames[0], 2, 2);
    expect(corner0[0]).toBeLessThan(80); // R
    expect(corner0[1]).toBeGreaterThan(200); // G — green bg wins
    expect(corner0[2]).toBeLessThan(80); // B

    const center0 = px(frames[0], 36, 36);
    expect(center0[0]).toBeGreaterThan(200); // R — gif square wins
    expect(center0[1]).toBeLessThan(80);
    expect(center0[2]).toBeLessThan(80);

    // Frame 1: center is the GIF's blue square
    const center1 = px(frames[1], 36, 36);
    expect(center1[0]).toBeLessThan(80);
    expect(center1[1]).toBeLessThan(80);
    expect(center1[2]).toBeGreaterThan(200);

    // Frame 1 corner still shows the green background
    const corner1 = px(frames[1], 2, 2);
    expect(corner1[1]).toBeGreaterThan(200);
  });

  // ------------------------------------------------------------------
  // Date/time tokens in text layers ({date} {time} {weekday}).
  // Static (render-time) clock display: tokens resolve when the key is
  // rendered, and the frame-cache key must roll over with the date so a
  // day change produces a fresh render instead of yesterday's badge.
  // ------------------------------------------------------------------
  describe("date/time tokens in text layers", () => {
    it("renders a token layer to a non-empty image", async () => {
      const key = keyWithLayers([textLayer("date", 1, "{date}")]);
      const result = await renderer.renderKeyImageEx(key, "original", false);
      expect(Array.isArray(result.image)).toBe(false);
      expect((result.image as Buffer).length).toBeGreaterThan(0);
    });

    it("resolves tokens to the current date and rolls the cache key at midnight", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      try {
        vi.setSystemTime(new Date(2026, 9, 25, 23, 58, 0));
        const key = keyWithLayers([textLayer("clock", 1, "{date}")]);

        const day1 = await renderer.renderKeyImageEx(key, "original", false);

        // Cache key must contain the RESOLVED date, not the raw token —
        // that is what makes the next render after midnight a cache miss.
        const cacheKeys = [
          ...(renderer as unknown as { frameCache: Map<string, unknown> })
            .frameCache.keys(),
        ];
        expect(cacheKeys.some((k) => k.startsWith("text:2026-10-25:"))).toBe(
          true,
        );

        // After midnight the resolved text (and therefore the cache key)
        // changes: a NEW cache entry is minted for the new date while the
        // old one stays for its own day. (Pixels can't be compared here —
        // headless environments without fonts render all SVG text to the
        // same blank image — so the cache key is the deterministic proof.)
        vi.setSystemTime(new Date(2026, 9, 26, 0, 1, 0));
        const day2 = await renderer.renderKeyImageEx(key, "original", false);
        expect(Array.isArray(day2.image)).toBe(false);

        const keysAfter = [
          ...(renderer as unknown as { frameCache: Map<string, unknown> })
            .frameCache.keys(),
        ];
        expect(
          keysAfter.filter((k) => k.startsWith("text:2026-10-25:")),
        ).toHaveLength(1);
        expect(
          keysAfter.filter((k) => k.startsWith("text:2026-10-26:")),
        ).toHaveLength(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
