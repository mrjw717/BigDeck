// ============================================================================
// KeyRenderer — chroma-key compositing tests
//
// Pins the background-layer "transparent color" knockout end to end through
// renderKeyImageEx: a solid background keyed with its own color must fall
// through to the device-off black backdrop (renderWithLayers flattens onto
// black, so the knockout composes honestly instead of being repainted by the
// flatten step). Tolerance is per-channel and inclusive
// (shared/color isWithinTolerance).
// ============================================================================

import { describe, it, expect, beforeAll, vi } from "vitest";
import os from "os";
import fs from "fs/promises";
import path from "path";
import { KeyRenderer } from "./KeyRenderer";
import type { KeyConfig, KeyLayer } from "../../shared/types";
import type { Logger } from "../utils/Logger";

const RGB_BYTES = 72 * 72 * 3;

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

function backgroundLayer(
  id: string,
  order: number,
  fields: Partial<KeyLayer>,
): KeyLayer {
  return {
    id,
    type: "background",
    visible: true,
    opacity: 1,
    order,
    backgroundColor: "#ff0000",
    ...fields,
  };
}

function keyWithLayers(layers: KeyLayer[]): KeyConfig {
  return { id: "test-key", keyIndex: 0, layers };
}

function pixelAt(raw: Buffer, x: number, y: number): [number, number, number] {
  const o = (y * 72 + x) * 3;
  return [raw[o], raw[o + 1], raw[o + 2]];
}

describe("KeyRenderer chroma-key compositing", () => {
  let renderer: KeyRenderer;
  let userDataPath: string;

  beforeAll(async () => {
    userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), "bigdeck-test-"));
    renderer = new KeyRenderer(silentLogger, userDataPath);
  });

  it("control: an unkeyed solid background fills the key with its color", async () => {
    const key = keyWithLayers([backgroundLayer("bg", 0, {})]);
    const result = await renderer.renderKeyImageEx(key, "original", false);

    expect(Array.isArray(result.image)).toBe(false);
    const raw = result.image as Buffer;
    expect(raw.length).toBe(RGB_BYTES);
    // Center + corner are the background red — not black.
    expect(pixelAt(raw, 36, 36)).toEqual([255, 0, 0]);
    expect(pixelAt(raw, 2, 2)).toEqual([255, 0, 0]);
  });

  it("knocks out the keyed color entirely when it matches the background", async () => {
    const key = keyWithLayers([
      backgroundLayer("bg", 0, { transparentColor: "#ff0000" }),
    ]);
    const result = await renderer.renderKeyImageEx(key, "original", false);

    const raw = result.image as Buffer;
    // Every sampled pixel falls through to device-off black: the keyed
    // background is fully transparent and flatten paints nothing over black.
    for (const [x, y] of [
      [36, 36],
      [2, 2],
      [69, 69],
      [0, 71],
    ] as const) {
      expect(pixelAt(raw, x, y)).toEqual([0, 0, 0]);
    }
  });

  it("tolerance is inclusive: ±8 catches a near-exact color, 0 does not", async () => {
    // Background is #ff0008 — 8 away from the #ff0000 key on the blue channel.
    const withTolerance = keyWithLayers([
      backgroundLayer("bg", 0, {
        backgroundColor: "#ff0008",
        transparentColor: "#ff0000",
        transparentColorTolerance: 8,
      }),
    ]);
    const knocked = await renderer.renderKeyImageEx(withTolerance, "original", false);
    expect(pixelAt(knocked.image as Buffer, 36, 36)).toEqual([0, 0, 0]);

    const strict = keyWithLayers([
      backgroundLayer("bg", 0, {
        backgroundColor: "#ff0008",
        transparentColor: "#ff0000",
        transparentColorTolerance: 0,
      }),
    ]);
    const kept = await renderer.renderKeyImageEx(strict, "original", false);
    expect(pixelAt(kept.image as Buffer, 36, 36)).toEqual([255, 0, 8]);
  });

  it("knockout composes with image layers stacked on top", async () => {
    // Keyed red background with a text overlay: the text survives, the
    // background falls to black.
    const key = keyWithLayers([
      backgroundLayer("bg", 0, { transparentColor: "#ff0000" }),
      {
        id: "txt",
        type: "text",
        visible: true,
        opacity: 1,
        order: 1,
        text: "ON",
        fontSize: 24,
        textColor: "#ffffff",
      },
    ]);
    const result = await renderer.renderKeyImageEx(key, "original", false);
    const raw = result.image as Buffer;

    // A corner (no text) is black; SOMETHING bright (the white text) exists.
    expect(pixelAt(raw, 2, 2)).toEqual([0, 0, 0]);
    const brightPixels = raw.filter((v, i) => i % 3 === 0 && v > 200).length;
    expect(brightPixels).toBeGreaterThan(0);
  });
});

// ============================================================================
// Full-stack compositing: background → image → icon → text → label.
// Guards the hardware stacking order for "one key, every layer type".
// ============================================================================

describe("KeyRenderer full layer stack (hardware)", () => {
  let renderer: KeyRenderer;
  beforeAll(async () => {
    const userDataPath = await fs.mkdtemp(
      path.join(os.tmpdir(), "bigdeck-stack-"),
    );
    renderer = new KeyRenderer(silentLogger, userDataPath);
  });

  it("composites background → image → icon → text → label in order", async () => {
    // Icon fixture: full-canvas BLACK square SVG (obscures everything under
    // it; the text + label above it must still show).
    const iconSvg = path.join(os.tmpdir(), "bigdeck-stack-icon.svg");
    await fs.writeFile(
      iconSvg,
      '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="#000000"/></svg>'.replace('viewBox="0 0 256 256" ', ''),
    );

    const key: KeyConfig = {
      id: "stack-key",
      keyIndex: 0,
      label: "TEST",
      labelPosition: "bottom",
      labelColor: "#ff2020",
      layers: [
        { id: "bg", type: "background", visible: true, opacity: 1, order: 0, backgroundColor: "#0000ff" },
        { id: "img", type: "image", visible: true, opacity: 1, order: 1, source: "bigdeck-asset://wide-banner-200x80.png", fit: "fill" },
        { id: "ico", type: "icon", visible: true, opacity: 1, order: 2, source: iconSvg },
        { id: "txt", type: "text", visible: true, opacity: 1, order: 3, text: "ON", fontSize: 24, textColor: "#ffffff" },
      ],
    };

    const result = await renderer.renderKeyImageEx(key, "original", false);
    const raw = result.image as Buffer;
    const px = (x: number, y: number) => {
      const o = (y * 72 + x) * 3;
      return [raw[o], raw[o + 1], raw[o + 2]] as [number, number, number];
    };

    // 1. The black icon layer covers the banner + blue background at the
    //    top corners (no text there): proves icon sits ABOVE image+bg.
    expect(px(4, 4)[0] + px(4, 4)[1] + px(4, 4)[2]).toBeLessThan(30);

    // 2. The white text layer sits ABOVE the black icon: bright pixels
    //    exist in the upper half (the text's own color, not the scrim).
    let brightTop = 0;
    for (let y = 8; y < 30; y++)
      for (let x = 8; x < 64; x++) {
        const [r, g, b] = px(x, y);
        if (r > 180 && g > 180 && b > 180) brightTop++;
      }
    expect(brightTop).toBeGreaterThan(20);

    // 3. The label scrim + red label text render at the BOTTOM strip,
    //    above the icon: red-dominant pixels in the bottom 14 rows.
    let redBottom = 0;
    for (let y = 60; y < 71; y++)
      for (let x = 8; x < 64; x++) {
        const [r, g, b] = px(x, y);
        if (r > 90 && r > g * 2 && r > b * 2) redBottom++;
      }
    expect(redBottom).toBeGreaterThan(10);
  });
});

