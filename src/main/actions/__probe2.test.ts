// SCRATCH PROBE 2 — visual evidence, deleted before delivery.
import { describe, it, beforeAll } from "vitest";
import os from "os";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { KeyRenderer } from "./KeyRenderer";
import type { KeyConfig, KeyLayer } from "../../shared/types";
import type { Logger } from "../utils/Logger";

const silentLogger = {
  info: () => {}, warn: () => {}, error: () => {}, debug: () => {},
} as unknown as Logger;

function layer(id: string, type: KeyLayer["type"], order: number, fields: Partial<KeyLayer> = {}): KeyLayer {
  return { id, type, visible: true, opacity: 1, order, ...fields };
}

describe("probe2 visual", () => {
  let renderer: KeyRenderer;
  let userData: string;
  let outDir: string;

  beforeAll(async () => {
    userData = await fs.mkdtemp(path.join(os.tmpdir(), "bigdeck-p2-"));
    await fs.mkdir(path.join(userData, "icons"), { recursive: true });
    outDir = "/tmp/opencode/probe2";
    await fs.mkdir(outDir, { recursive: true });

    // Icon in managed dir (pack-style name)
    await fs.writeFile(
      path.join(userData, "icons", "gear.svg"),
      `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="#00ff00"/><circle cx="20" cy="20" r="8" fill="#000000"/></svg>`,
    );
    // Pack-style absolute icon (IconPackPicker contract: file path with .svg)
    await fs.writeFile(
      path.join(userData, "packicon.svg"),
      `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="32" height="32" rx="6" fill="#ff00ff"/></svg>`,
    );
    // Realistic photo-ish image layer: 96x96 JPEG (no alpha) with a yellow diagonal
    const w = 96, h = 96;
    const raw = Buffer.alloc(w * h * 3, 0);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 3;
        if (Math.abs(x - y) < 10) { raw[o] = 255; raw[o + 1] = 220; raw[o + 2] = 0; }
        else { raw[o] = 40; raw[o + 1] = 60; raw[o + 2] = 90; }
      }
    await fs.writeFile(path.join(userData, "photo.jpg"), await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg().toBuffer());
    renderer = new KeyRenderer(silentLogger, userData);
  });

  async function dump(name: string, k: KeyConfig) {
    const res = await renderer.renderKeyImageEx(k, "xl", false);
    const frames = Array.isArray(res.image) ? res.image : [res.image];
    await sharp(frames[0], { raw: { width: 96, height: 96, channels: 3 } })
      .png().toFile(path.join(outDir, `${name}.png`));
    // upscale 4x for readability
    await sharp(frames[0], { raw: { width: 96, height: 96, channels: 3 } })
      .resize(384, 384, { kernel: "nearest" }).png().toFile(path.join(outDir, `${name}-4x.png`));
  }

  it("owner combo permutations at XL size", async () => {
    // Owner stack intent (bottom→top): background, image, text, icon
    await dump("combo-bgit", {
      id: "k", keyIndex: 0,
      layers: [
        layer("bg", "background", 0, { backgroundColor: "#2030c0" }),
        layer("img", "image", 1, { source: path.join(userData, "photo.jpg"), fit: "contain" }),
        layer("txt", "text", 2, { text: "VOLUME", fontSize: 20, textColor: "#ffffff" }),
        layer("ico", "icon", 3, { source: "gear" }),
      ],
      label: "Main",
      labelPosition: "bottom",
      labelColor: "#ffffff",
    });

    // Same layers, but user reorders icon BELOW image and text at top
    await dump("combo-btig", {
      id: "k", keyIndex: 0,
      layers: [
        layer("bg", "background", 0, { backgroundColor: "#2030c0" }),
        layer("img", "image", 1, { source: path.join(userData, "photo.jpg"), fit: "contain" }),
        layer("ico", "icon", 2, { source: path.join(userData, "packicon.svg") }),
        layer("txt", "text", 3, { text: "VOLUME", fontSize: 20, textColor: "#ffffff" }),
      ],
    });

    // gradient background variant
    await dump("combo-grad", {
      id: "k", keyIndex: 0,
      layers: [
        layer("bg", "background", 0, { backgroundGradientStart: "#ff0000", backgroundGradientEnd: "#0000ff", backgroundGradientDirection: 135 }),
        layer("img", "image", 1, { source: path.join(userData, "photo.jpg"), fit: "cover" }),
        layer("ico", "icon", 2, { source: "gear" }),
        layer("txt", "text", 3, { text: "MUTE", fontSize: 24, textColor: "#ffff00" }),
      ],
    });
  });
});
