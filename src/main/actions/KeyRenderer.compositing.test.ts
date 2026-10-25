// ============================================================================
// KeyRenderer — layer compositing pixel tests
//
// Pins the hardware output of renderWithLayers at the raw-RGB pixel level
// (72*72*3, what Stream Deck hardware actually receives) for the behaviors
// that regressed on live hardware:
//   1. per-layer opacity for EVERY layer type at ANY z-position
//      (image static + animated, text, icon, background)
//   2. resilience: one bad layer must not kill the key render
// ============================================================================

import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import os from "os";
import fs from "fs/promises";
import sharp from "sharp";
import { KeyRenderer } from "./KeyRenderer";
import { cssGradientEndpoints, parseHexColor } from "../../shared/color";
import type { KeyConfig, KeyLayer } from "../../shared/types";
import type { Logger } from "../utils/Logger";

const W = 72;
const H = 72;
const RGB_BYTES = W * H * 3;

const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

/** Read one raw-RGB pixel. */
function px(img: Buffer, x: number, y: number): [number, number, number] {
  const i = (y * W + x) * 3;
  return [img[i], img[i + 1], img[i + 2]];
}

function expectNear(
  actual: [number, number, number],
  expected: [number, number, number],
  delta = 3,
) {
  for (let c = 0; c < 3; c++) {
    expect(
      Math.abs(actual[c] - expected[c]),
      `channel ${c}: got ${actual}, expected ~${expected}`,
    ).toBeLessThanOrEqual(delta);
  }
}

/** Max per-pixel channel sum in the image (brightest pixel). */
function maxSum(img: Buffer): number {
  let best = 0;
  for (let i = 0; i + 2 < img.length; i += 3) {
    const s = img[i] + img[i + 1] + img[i + 2];
    if (s > best) best = s;
  }
  return best;
}

function layer(base: Partial<KeyLayer> & { type: KeyLayer["type"] }): KeyLayer {
  return { id: base.id ?? "l", visible: true, opacity: 1, order: 0, ...base };
}

function bgLayer(over: Partial<KeyLayer> = {}): KeyLayer {
  return layer({ id: "bg", type: "background", backgroundColor: "#000000", ...over });
}

function key(...layers: KeyLayer[]): KeyConfig {
  return { id: "k", keyIndex: 0, layers };
}

describe("KeyRenderer compositing (pixel assertions)", () => {
  let renderer: KeyRenderer;
  let dir: string;
  /** 144x36 bar: left quarter red, rest blue — distinguishes fit modes. */
  let markedBar: string;
  /** 48x24 solid white icon. */
  let wideIcon: string;
  const FIXTURE_GIF = path.join(__dirname, "__fixtures__", "anim-10f.gif");

  beforeAll(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "bigdeck-comp-"));
    renderer = new KeyRenderer(silentLogger, dir);

    // Marked static bar via raw RGBA
    const bw = 144;
    const bh = 36;
    const raw = Buffer.alloc(bw * bh * 4);
    for (let i = 0; i < bw * bh; i++) {
      const red = i % bw < bw / 4; // left quarter red, rest blue
      raw[i * 4] = red ? 255 : 0;
      raw[i * 4 + 2] = red ? 0 : 255;
      raw[i * 4 + 3] = 255;
    }
    markedBar = path.join(dir, "marked-bar.png");
    await sharp(raw, { raw: { width: bw, height: bh, channels: 4 } })
      .png()
      .toFile(markedBar);

    // Wide icon SVG
    await fs.mkdir(path.join(dir, "icons"), { recursive: true });
    wideIcon = "wide-icon";
    await fs.writeFile(
      path.join(dir, "icons", `${wideIcon}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24"><rect width="48" height="24" fill="#ffffff"/></svg>`,
    );
  });

  // ------------------------------------------------------------------------
  // 1. Opacity — every layer type, both z-positions
  // ------------------------------------------------------------------------

  describe("background layer opacity", () => {
    it("opaque background paints its solid color", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(bgLayer({ backgroundColor: "#ff0000", opacity: 1 })),
        "original",
      )).image as Buffer;
      expect(img.length).toBe(RGB_BYTES);
      expectNear(px(img, 36, 36), [255, 0, 0]);
    });

    it("50% opacity background blends over the black backdrop", async () => {
      // Regression: the bg color used to also be the flatten base, painting
      // it at FULL opacity underneath the (then pointlessly transparent)
      // overlay — the opacity slider did nothing on hardware.
      const img = (await renderer.renderKeyImageEx(
        key(bgLayer({ backgroundColor: "#ff0000", opacity: 0.5 })),
        "original",
      )).image as Buffer;
      expectNear(px(img, 36, 36), [128, 0, 0]);
      expectNear(px(img, 2, 2), [128, 0, 0]);
    });

    it("opacity 0 background renders as the black device-off backdrop", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(bgLayer({ backgroundColor: "#ff0000", opacity: 0 })),
        "original",
      )).image as Buffer;
      expectNear(px(img, 36, 36), [0, 0, 0]);
    });

    it("semi-transparent background lets lower layers composite through", async () => {
      const textBelow = layer({
        id: "t",
        type: "text",
        text: "XX",
        fontSize: 24,
        textColor: "#ffffff",
        order: 0,
      });
      const img = (await renderer.renderKeyImageEx(
        key(textBelow, bgLayer({ backgroundColor: "#ff0000", opacity: 0.5, order: 1 })),
        "original",
      )).image as Buffer;
      // 50% red over white text = (255,128,128), sum 511; pure 50% red over
      // black = (128,0,0), sum 128.
      expect(maxSum(img)).toBeGreaterThanOrEqual(450);
    });

    it("gradient background honors opacity too", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({
            backgroundGradientStart: "#ffffff",
            backgroundGradientEnd: "#ffffff",
            backgroundGradientDirection: 90,
            opacity: 0.5,
          }),
        ),
        "original",
      )).image as Buffer;
      expectNear(px(img, 36, 36), [128, 128, 128]);
    });
  });

  describe("static image layer opacity", () => {
    it("50% opacity at the top of the stack", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({ backgroundColor: "#000000" }),
          layer({ id: "i", type: "image", source: markedBar, fit: "fill", opacity: 0.5, order: 1 }),
        ),
        "original",
      )).image as Buffer;
      expectNear(px(img, 36, 36), [0, 0, 128]); // blue half at 50% over black
    });

    it("50% opacity UNDER a semi-transparent background still composites", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          layer({ id: "i", type: "image", source: markedBar, fit: "fill", opacity: 1, order: 0 }),
          bgLayer({ backgroundColor: "#ffffff", opacity: 0.5, order: 1 }),
        ),
        "original",
      )).image as Buffer;
      // Blue half + 50% white = (128,128,255)
      expectNear(px(img, 36, 36), [128, 128, 255]);
    });
  });

  describe("animated layer opacity", () => {
    it("applies per frame and preserves frame count", async () => {
      const mk = (opacity: number) =>
        key(
          bgLayer({ backgroundColor: "#000000" }),
          layer({ id: "i", type: "image", source: FIXTURE_GIF, fit: "contain", opacity, order: 1 }),
        );
      const full = await renderer.renderKeyImageEx(mk(1), "original");
      const half = await renderer.renderKeyImageEx(mk(0.5), "original");
      const fullFrames = full.image as Buffer[];
      const halfFrames = half.image as Buffer[];
      expect(fullFrames.length).toBeGreaterThan(1);
      expect(halfFrames.length).toBe(fullFrames.length);

      // Every sampled pixel of frame 0 and mid frame ≈ half luminance.
      for (const f of [0, Math.floor(fullFrames.length / 2)]) {
        for (let y = 4; y < H; y += 16) {
          for (let x = 4; x < W; x += 16) {
            const a = px(fullFrames[f], x, y);
            const b = px(halfFrames[f], x, y);
            for (let c = 0; c < 3; c++) {
              expect(Math.abs(b[c] - a[c] / 2)).toBeLessThanOrEqual(2);
            }
          }
        }
      }
    });

    it("non-finite opacity degrades to full visibility (not invisible)", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({ backgroundColor: "#000000" }),
          layer({ id: "i", type: "image", source: markedBar, fit: "fill", opacity: NaN, order: 1 }),
        ),
        "original",
      )).image as Buffer;
      expectNear(px(img, 36, 36), [0, 0, 255]);
    });
  });

  describe("text layer opacity", () => {
    it("50% opacity halves text luminance at any z-position", async () => {
      const mk = (order: number, opacity: number) =>
        key(
          layer({ id: "t", type: "text", text: "XX", fontSize: 24, textColor: "#ffffff", opacity, order }),
          bgLayer({ backgroundColor: "#000000", order: order === 0 ? 1 : 0 }),
        );
      const half = (await renderer.renderKeyImageEx(mk(1, 0.5), "original")).image as Buffer;
      const full = (await renderer.renderKeyImageEx(mk(1, 1), "original")).image as Buffer;
      const halfUnder = (await renderer.renderKeyImageEx(mk(0, 0.5), "original")).image as Buffer;
      expect(maxSum(half)).toBeGreaterThanOrEqual(330); // ~384 nominal
      expect(maxSum(half)).toBeLessThanOrEqual(440);
      expect(maxSum(full)).toBeGreaterThanOrEqual(700);
      // Under a (black, opaque) background layer it is hidden by z-order:
      expect(maxSum(halfUnder)).toBe(0);
    });
  });

  describe("icon layer opacity", () => {
    it("50% opacity halves icon luminance", async () => {
      const mk = (opacity: number) =>
        key(
          bgLayer({ backgroundColor: "#000000" }),
          layer({ id: "ic", type: "icon", source: wideIcon, fit: "fill", opacity, order: 1 }),
        );
      const full = (await renderer.renderKeyImageEx(mk(1), "original")).image as Buffer;
      const half = (await renderer.renderKeyImageEx(mk(0.5), "original")).image as Buffer;
      expectNear(px(full, 36, 36), [255, 255, 255]);
      expectNear(px(half, 36, 36), [128, 128, 128]);
    });
  });

  // ------------------------------------------------------------------------
  // 2. Gradients — CSS-equivalent endpoints + compositing under layers
  // ------------------------------------------------------------------------

  describe("gradient backgrounds", () => {
    it("reaches the pure start/end colors at the edges (90deg, horizontal)", async () => {
      // Regression pin: the old SVG placed its endpoints a full width outside
      // the canvas, so edges showed the washed-out middle band
      // ([187,0,68] instead of [255,0,0]) that never matched the preview.
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({
            backgroundGradientStart: "#ff0000",
            backgroundGradientEnd: "#0000ff",
            backgroundGradientDirection: 90,
          }),
        ),
        "original",
      )).image as Buffer;
      expectNear(px(img, 0, 36), [255, 0, 0], 4);
      expectNear(px(img, 71, 36), [0, 0, 255], 4);
      expectNear(px(img, 36, 36), [128, 0, 128], 4);
    });

    it("renders at XL key resolution (96x96) with correct endpoints", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({
            backgroundGradientStart: "#ff0000",
            backgroundGradientEnd: "#0000ff",
            backgroundGradientDirection: 90,
          }),
        ),
        "xl",
      )).image as Buffer;
      expect(img.length).toBe(96 * 96 * 3);
      const pxl = (x: number, y: number): [number, number, number] => {
        const i = (y * 96 + x) * 3;
        return [img[i], img[i + 1], img[i + 2]];
      };
      expectNear(pxl(0, 48), [255, 0, 0], 4);
      expectNear(pxl(95, 48), [0, 0, 255], 4);
      expectNear(pxl(48, 48), [128, 0, 128], 4);
    });

    it("direction 0 (to top) puts start at bottom, end at top", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({
            backgroundGradientStart: "#ff0000",
            backgroundGradientEnd: "#0000ff",
            backgroundGradientDirection: 0,
          }),
        ),
        "original",
      )).image as Buffer;
      expectNear(px(img, 36, 71), [255, 0, 0], 4);
      expectNear(px(img, 36, 0), [0, 0, 255], 4);
    });

    it("composites an image layer on top of a gradient", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({
            backgroundGradientStart: "#ff0000",
            backgroundGradientEnd: "#0000ff",
            backgroundGradientDirection: 90,
          }),
          layer({ id: "i", type: "image", source: markedBar, fit: "contain", order: 1 }),
        ),
        "original",
      )).image as Buffer;
      // Bar strip center is red/blue; corners show the gradient endpoints.
      expectNear(px(img, 8, 36), [255, 0, 0]); // bar red quarter
      expectNear(px(img, 40, 36), [0, 0, 255]); // bar blue part (== end color here)
      expectNear(px(img, 0, 2), [253, 0, 2], 4); // top-left ≈ start
      expectNear(px(img, 0, 69), [253, 0, 2], 4); // bottom-left: x≈0 → still start color
    });

    it("shared endpoint math matches the CSS gradient geometry", () => {
      // The preview (LayerStack canvas + CSS linear-gradient) and the
      // hardware SVG must use the same cssGradientEndpoints numbers.
      const { x1, y1, x2, y2 } = cssGradientEndpoints(72, 72, 90);
      expect(Math.round(x1)).toBe(0);
      expect(Math.round(x2)).toBe(72);
      expect(y1).toBe(36);
      expect(y2).toBe(36);
      const vertical = cssGradientEndpoints(72, 72, 0);
      expect(Math.round(vertical.y1)).toBe(72); // start at bottom (to top)
      expect(Math.round(vertical.y2)).toBe(0);
      expect(parseHexColor("#abc")).toEqual({ r: 170, g: 187, b: 204 });
      expect(parseHexColor("nope")).toBeNull();
    });
  });

  // ------------------------------------------------------------------------
  // 3. Resilience — one bad layer must not kill the key render
  // ------------------------------------------------------------------------

  describe("resilience", () => {
    it("a layer pointing at a missing file is skipped, rest of the key renders", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({ backgroundColor: "#202020" }),
          layer({ id: "bad", type: "image", source: "/nonexistent/nope.png", order: 1 }),
          layer({ id: "good", type: "image", source: markedBar, fit: "contain", order: 2 }),
        ),
        "original",
      )).image as Buffer;
      expect(img.length).toBe(RGB_BYTES);
      expectNear(px(img, 2, 2), [32, 32, 32]); // background survived
      expectNear(px(img, 8, 36), [255, 0, 0]); // good layer survived
    });

    it("NaN fontSize still renders the text layer (centered, visible)", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({ backgroundColor: "#000000" }),
          layer({ id: "t", type: "text", text: "XX", fontSize: NaN, textColor: "#ffffff", order: 1 }),
        ),
        "original",
      )).image as Buffer;
      // Regression: y="NaN" made librsvg paint the text at the TOP edge.
      expect(maxSum(img)).toBeGreaterThanOrEqual(700);
    });

    it("image layer with empty source is skipped", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(
          bgLayer({ backgroundColor: "#202020" }),
          layer({ id: "empty", type: "image", source: "", order: 1 }),
        ),
        "original",
      )).image as Buffer;
      expectNear(px(img, 36, 36), [32, 32, 32]);
    });

    it("background layer with an invalid color degrades to a colored base, not a crash", async () => {
      const img = (await renderer.renderKeyImageEx(
        key(bgLayer({ backgroundColor: "#zzzzzz" })),
        "original",
      )).image as Buffer;
      expect(img.length).toBe(RGB_BYTES);
    });
  });
});
