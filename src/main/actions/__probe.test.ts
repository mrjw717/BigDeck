// SCRATCH PROBE — evidence gathering, deleted before delivery.
import { describe, it, expect, beforeAll } from "vitest";
import os from "os";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { KeyRenderer } from "./KeyRenderer";
import type { KeyConfig, KeyLayer } from "../../shared/types";
import type { Logger } from "../utils/Logger";

const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

function layer(id: string, type: KeyLayer["type"], order: number, fields: Partial<KeyLayer> = {}): KeyLayer {
  return { id, type, visible: true, opacity: 1, order, ...fields };
}
function key(layers: KeyLayer[], extra: Partial<KeyConfig> = {}): KeyConfig {
  return { id: "k", keyIndex: 0, layers, ...extra };
}
function px(raw: Buffer, x: number, y: number): [number, number, number] {
  const o = (y * 72 + x) * 3;
  return [raw[o], raw[o + 1], raw[o + 2]];
}
function countColor(raw: Buffer, pred: (r: number, g: number, b: number) => boolean): number {
  let n = 0;
  for (let i = 0; i < raw.length; i += 3) if (pred(raw[i], raw[i + 1], raw[i + 2])) n++;
  return n;
}

describe("probe", () => {
  let renderer: KeyRenderer;
  let userData: string;
  let iconAbsPath: string;

  beforeAll(async () => {
    userData = await fs.mkdtemp(path.join(os.tmpdir(), "bigdeck-probe-"));
    await fs.mkdir(path.join(userData, "icons"), { recursive: true });
    // Pack-style icon in userData/icons (name resolved as <source>.svg)
    await fs.writeFile(
      path.join(userData, "icons", "packicon.svg"),
      `<svg width="72" height="72" xmlns="http://www.w3.org/2000/svg"><rect x="36" y="0" width="36" height="72" fill="#00cc00"/></svg>`,
    );
    // Absolute-path icon OUTSIDE userData/icons (IconPackPicker contract)
    iconAbsPath = path.join(userData, "absicon.svg");
    await fs.writeFile(
      iconAbsPath,
      `<svg width="72" height="72" xmlns="http://www.w3.org/2000/svg"><rect x="36" y="0" width="36" height="72" fill="#00cc00"/></svg>`,
    );
    // Image layer: left half red, right half transparent
    const redRaw = Buffer.alloc(72 * 72 * 4);
    for (let y = 0; y < 72; y++)
      for (let x = 0; x < 36; x++) {
        const o = (y * 72 + x) * 4;
        redRaw[o] = 220; redRaw[o + 1] = 0; redRaw[o + 2] = 0; redRaw[o + 3] = 255;
      }
    await fs.writeFile(path.join(userData, "red.png"), await sharp(redRaw, { raw: { width: 72, height: 72, channels: 4 } }).png().toBuffer());
    renderer = new KeyRenderer(silentLogger, userData);
  });

  it("A: 4-layer stack — where does each layer land?", async () => {
    const k = key([
      layer("bg", "background", 0, { backgroundColor: "#0000ff" }),
      layer("img", "image", 1, { source: path.join(userData, "red.png"), fit: "fill" }),
      layer("ico", "icon", 2, { source: "packicon" }),
      layer("txt", "text", 3, { text: "AAA", fontSize: 24, textColor: "#ffffff" }),
    ]);
    const raw = (await renderer.renderKeyImageEx(k, "original", false)).image as Buffer;
    console.log("A (10,36) expect RED [220,0,0]:", px(raw, 10, 36));
    console.log("A (60,36) expect GREEN [0,204,0]:", px(raw, 60, 36));
    console.log("A (2,2)   expect BLUE [0,0,255]:", px(raw, 2, 2));
    console.log("A white px count (text visible):", countColor(raw, (r, g, b) => r > 200 && g > 200 && b > 200));
  });

  it("B: text sent to BOTTOM (order -5) — should be covered", async () => {
    const k = key([
      layer("bg", "background", 0, { backgroundColor: "#0000ff" }),
      layer("img", "image", 1, { source: path.join(userData, "red.png"), fit: "fill" }),
      layer("ico", "icon", 2, { source: "packicon" }),
      layer("txt", "text", -5, { text: "AAA", fontSize: 24, textColor: "#ffffff" }),
    ]);
    const raw = (await renderer.renderKeyImageEx(k, "original", false)).image as Buffer;
    console.log("B white px count (expect 0 = text covered):", countColor(raw, (r, g, b) => r > 200 && g > 200 && b > 200));
    console.log("B (10,36):", px(raw, 10, 36), "B (60,36):", px(raw, 60, 36));
  });

  it("C: label with layers — does it render?", async () => {
    const k = key([layer("bg", "background", 0, { backgroundColor: "#0000ff" })], {
      label: "VOL",
      labelPosition: "bottom",
      labelColor: "#ffff00",
    });
    const raw = (await renderer.renderKeyImageEx(k, "original", false)).image as Buffer;
    const yellow = countColor(raw, (r, g, b) => r > 200 && g > 200 && b < 80);
    console.log("C yellow px count (label pixels, expect >0):", yellow);
  });

  it("D: icon layer with ABSOLUTE path source", async () => {
    console.log("D path.join result:", path.join(userData, "icons", `${iconAbsPath}.svg`));
    const k = key([
      layer("bg", "background", 0, { backgroundColor: "#0000ff" }),
      layer("ico", "icon", 1, { source: iconAbsPath }),
    ]);
    const raw = (await renderer.renderKeyImageEx(k, "original", false)).image as Buffer;
    console.log("D (60,36) expect GREEN:", px(raw, 60, 36), " (2,2) expect BLUE:", px(raw, 2, 2));
  });

  it("E: text layer alone over background — region assert", async () => {
    const k = key([
      layer("bg", "background", 0, { backgroundColor: "#0000ff" }),
      layer("txt", "text", 1, { text: "AAA", fontSize: 24, textColor: "#ff0000" }),
    ]);
    const raw = (await renderer.renderKeyImageEx(k, "original", false)).image as Buffer;
    // scan middle band rows 20..52 for red-ish
    let red = 0;
    for (let y = 20; y <= 52; y++)
      for (let x = 0; x < 72; x++) {
        const [r, g, b] = px(raw, x, y);
        if (r > 200 && g < 80 && b < 80) red++;
      }
    console.log("E red text px in middle band:", red);
  });
});
