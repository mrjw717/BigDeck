// ============================================================================
// LayoutRenderer — v1 InfoBar renderer tests
//
// Exercises the documented v1 surface: 232x50 PNG output with real ink for a
// fake-data clock, show_zero padding, am/pm capitalize, visibility gates,
// carousel icon slots (theme image, neutral-block fallback), gradient specs,
// scale, and real Elgato fixtures.
// ============================================================================

import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import sharp from "sharp";
import { parseLayoutEx } from "./LayoutSchema";
import { LayoutRenderer, type LayoutDataProvider } from "./LayoutRenderer";
import type { LayoutExManifest } from "../../shared/types";
import type { Logger } from "../utils/Logger";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

const logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
} as unknown as Logger;

/** Simple digital clock manifest in the pagination_07 shape. */
function clockManifest(opts: { hourShowZero?: boolean; amPmCapitalize?: boolean } = {}): LayoutExManifest {
  return parseLayoutEx({
    themes: [
      {
        id: "black",
        primaryColor: "#000000",
        secondaryColor: "#FFFFFF",
        colors: {
          backgroundColor: "#000000",
          textColor: "#FFFFFF",
          accentColor: "#FF0000",
          activeColor: "#00FF00",
          inactiveColor: "#404040",
        },
        fonts: {
          timeFont: { family: "Some Missing Font", size: 30, weight: 700, italic: false },
        },
      },
      {
        id: "white",
        primaryColor: "#FFFFFF",
        secondaryColor: "#000000",
        colors: {
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
          accentColor: "#FF0000",
          activeColor: "#00FF00",
          inactiveColor: "#404040",
        },
        fonts: {
          timeFont: { family: "Some Missing Font", size: 30, weight: 700, italic: false },
        },
      },
    ],
    elements: [
      { key: "hour1", type: "hours", ...(opts.hourShowZero ? { show_zero: true } : {}) },
      { key: "colon1", type: "colon", animated: false },
      { key: "min1", type: "minutes", show_zero: true },
      { key: "am_pm", type: "am/pm", ...(opts.amPmCapitalize ? { capitalize: true } : {}) },
      { key: "dot_am", type: "show_on_am/pm", periode: "AM" },
      {
        key: "page_prev",
        type: "carousel_page",
        display: "Icon",
        wrap: "Unique",
        offset: -1,
        extend: [1, 1],
      },
    ],
    template: {
      id: "test_clock",
      items: [
        {
          key: "background",
          type: "pixmap",
          rect: [0, 0, 232, 50],
          background: "{{backgroundColor}}",
          zOrder: 0,
        },
        {
          key: "hour1",
          type: "text",
          rect: [10, 0, 60, 50],
          value: "0",
          font: "{{timeFont}}",
          color: "{{textColor}}",
          alignment: "right",
          "text-overflow": "clip",
          zOrder: 1,
        },
        {
          key: "colon1",
          type: "text",
          rect: [70, 0, 10, 50],
          value: ":",
          font: "{{timeFont}}",
          color: "{{textColor}}",
          alignment: "center",
          "text-overflow": "clip",
          zOrder: 2,
        },
        {
          key: "min1",
          type: "text",
          rect: [80, 0, 60, 50],
          value: "0",
          font: "{{timeFont}}",
          color: "{{textColor}}",
          alignment: "left",
          "text-overflow": "clip",
          zOrder: 3,
        },
        {
          key: "am_pm",
          type: "text",
          rect: [150, 10, 40, 14],
          value: "",
          font: "{{timeFont}}",
          color: "{{textColor}}",
          alignment: "center",
          zOrder: 4,
        },
        {
          key: "dot_am",
          type: "pixmap",
          rect: [200, 5, 10, 10],
          background: "{{accentColor}}",
          border_radius: 5,
          zOrder: 5,
        },
        {
          key: "page_prev",
          type: "pixmap",
          rect: [150, 30, 20, 14],
          background: "{{activeColor}}",
          fill_c: "{{inactiveColor}}",
          border_radius: 4,
          padding: [2, 2, 2, 2],
          zOrder: 6,
        },
      ],
    },
  }) as LayoutExManifest;
}

const fakeClockData: LayoutDataProvider = {
  hour1: "10",
  colon1: ":",
  min1: "45",
  am_pm: "PM",
  dot_am: false,
  page_prev: "previous",
};

function makeRenderer(): LayoutRenderer {
  return new LayoutRenderer(logger);
}

interface Frame {
  width: number;
  height: number;
  channels: number;
  data: Buffer;
}

async function decode(png: Buffer): Promise<Frame> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, channels: info.channels, data };
}

function pixelAt(frame: Frame, x: number, y: number): [number, number, number] {
  const i = (y * frame.width + x) * frame.channels;
  return [frame.data[i], frame.data[i + 1], frame.data[i + 2]];
}

function isNear(c: [number, number, number], target: [number, number, number], tol = 32): boolean {
  return Math.abs(c[0] - target[0]) <= tol && Math.abs(c[1] - target[1]) <= tol && Math.abs(c[2] - target[2]) <= tol;
}

function litPixelCount(frame: Frame, threshold = 40): number {
  let n = 0;
  for (let i = 0; i < frame.data.length; i += frame.channels) {
    if (
      frame.data[i] > threshold ||
      frame.data[i + 1] > threshold ||
      frame.data[i + 2] > threshold
    ) {
      n += 1;
    }
  }
  return n;
}

describe("LayoutRenderer", () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bigdeck-layouts-"));
    // A 24x24 red "page icon" for the theme-image slot test.
    const icon = await sharp({
      create: { width: 24, height: 24, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer();
    await fs.mkdir(path.join(tmpDir, "images"), { recursive: true });
    await fs.writeFile(path.join(tmpDir, "images", "page_icon.png"), icon);
  });

  it("renders a simple clock layout to a 232x50 PNG with expected non-black pixels", async () => {
    const png = await makeRenderer().render(clockManifest(), fakeClockData);
    const frame = await decode(png);

    expect(frame.width).toBe(232);
    expect(frame.height).toBe(50);
    // Fake time data painted real glyphs: far from empty, far from full.
    const lit = litPixelCount(frame);
    expect(lit).toBeGreaterThan(60);
    expect(lit).toBeLessThan(232 * 50 * 0.5);
    // Digits are white on black: sample inside the hour and minutes rects.
    const inkInHourRect = litPixelCount(
      await decode(
        await sharp(png)
          .extract({ left: 10, top: 0, width: 60, height: 50 })
          .png()
          .toBuffer(),
      ),
    );
    expect(inkInHourRect).toBeGreaterThan(20);
  }, 30000);

  it("honors the theme selection", async () => {
    const renderer = makeRenderer();
    const manifest = clockManifest();
    const dark = await decode(await renderer.render(manifest, fakeClockData));
    const light = await decode(
      await renderer.render(manifest, fakeClockData, { themeId: "white" }),
    );
    // Black theme: background pixel is black. White theme: it is white.
    expect(isNear(pixelAt(dark, 3, 3), [0, 0, 0], 12)).toBe(true);
    expect(isNear(pixelAt(light, 3, 3), [255, 255, 255], 12)).toBe(true);
  });

  it("falls back to the first theme (sans-serif) for unknown theme ids", async () => {
    const png = await makeRenderer().render(clockManifest(), fakeClockData, {
      themeId: "nope",
    });
    const frame = await decode(png);
    expect(isNear(pixelAt(frame, 3, 3), [0, 0, 0], 12)).toBe(true);
  });

  it("show_zero zero-pads single-digit hours (more ink when padded)", async () => {
    const renderer = makeRenderer();
    const data: LayoutDataProvider = { hour1: "9", min1: "45" };
    const plain = litPixelCount(await decode(await renderer.render(clockManifest(), data)));
    const padded = litPixelCount(
      await decode(await renderer.render(clockManifest({ hourShowZero: true }), data)),
    );
    expect(padded).toBeGreaterThan(plain);
  }, 30000);

  it("capitalize uppercases am/pm provider values", async () => {
    const renderer = makeRenderer();
    const data: LayoutDataProvider = { hour1: "10", min1: "45", am_pm: "pm" };
    const raw = await renderer.render(clockManifest(), data);
    const capped = await renderer.render(clockManifest({ amPmCapitalize: true }), data);
    expect(capped.equals(raw)).toBe(false);
  }, 30000);

  it("visibility-gated elements only draw on truthy provider values", async () => {
    const renderer = makeRenderer();
    const on = await decode(
      await renderer.render(clockManifest(), { ...fakeClockData, dot_am: true }),
    );
    const off = await decode(await renderer.render(clockManifest(), fakeClockData));
    // dot_am rect center: red chip when the AM gate is truthy, black when not.
    expect(isNear(pixelAt(on, 205, 10), [255, 0, 0])).toBe(true);
    expect(isNear(pixelAt(off, 205, 10), [0, 0, 0], 12)).toBe(true);
  });

  it("carousel icon slots render the theme image when the layout provides one", async () => {
    const manifest = clockManifest();
    // Bind page_prev to the icon file inside the temp layout package.
    manifest.themes[0].images = { pageIcon: "images/page_icon.png" };
    (manifest.template.items[6] as { value?: string }).value = "{{pageIcon}}";

    const frame = await decode(
      await makeRenderer().render(manifest, fakeClockData, { layoutDir: tmpDir }),
    );
    // Icon (red) fills the padding-inset chip: sample its center.
    expect(isNear(pixelAt(frame, 159, 37), [255, 0, 0], 24)).toBe(true);
  });

  it("carousel icon slots fall back to a neutral fill_c chip without an image", async () => {
    const frame = await decode(await makeRenderer().render(clockManifest(), fakeClockData));
    // Chip background (green activeColor) at the rounded corner ring +
    // gray fill_c center block inset by the 2px padding.
    expect(isNear(pixelAt(frame, 151, 31), [0, 255, 0])).toBe(true); // chip ring
    expect(isNear(pixelAt(frame, 159, 37), [64, 64, 64], 24)).toBe(true); // fill_c
  });

  it("renders Elgato gradient color specs", async () => {
    const manifest = clockManifest();
    manifest.themes[0].colors.backgroundColor = "h$0:#204CFE,1:#CE1F93";
    const frame = await decode(await makeRenderer().render(manifest, fakeClockData));
    const left = pixelAt(frame, 2, 47);
    const right = pixelAt(frame, 229, 47);
    // Gradient sweeps blue → pink across the background: endpoints differ,
    // left is closer to blue, right closer to pink.
    expect(left[2]).toBeGreaterThan(left[0]);
    expect(right[0]).toBeGreaterThan(right[2]);
    expect(Math.abs(left[0] - right[0])).toBeGreaterThan(40);
  });

  it("scales the output frame", async () => {
    const png = await makeRenderer().render(clockManifest(), fakeClockData, { scale: 2 });
    const frame = await decode(png);
    expect(frame.width).toBe(464);
    expect(frame.height).toBe(100);
  });

  it("renders the digital_time_01 fixture (outline-only digits dialect)", async () => {
    const dir = path.join(FIXTURES_DIR, "digital_time_01.sdLayoutEx");
    const manifest = parseLayoutEx(
      JSON.parse(await fs.readFile(path.join(dir, "manifest.json"), "utf-8")),
    ) as LayoutExManifest;
    const png = await makeRenderer().render(
      manifest,
      { hour1: "10", colon1: ":", min1: "45", am_pm: "PM" },
      { layoutDir: dir },
    );
    const frame = await decode(png);
    expect(frame.width).toBe(232);
    expect(frame.height).toBe(50);
    expect(litPixelCount(frame)).toBeGreaterThan(60);
  }, 30000);

  it("renders the digital_time_11 fixture (theme background image + location)", async () => {
    const dir = path.join(FIXTURES_DIR, "digital_time_11.sdLayoutEx");
    const manifest = parseLayoutEx(
      JSON.parse(await fs.readFile(path.join(dir, "manifest.json"), "utf-8")),
    ) as LayoutExManifest;
    const png = await makeRenderer().render(
      manifest,
      { hour1: "10", colon1: ":", min1: "30", am_pm: "AM", location1: "Berlin" },
      { layoutDir: dir },
    );
    const frame = await decode(png);
    expect(frame.width).toBe(232);
    expect(frame.height).toBe(50);
    // The rainbow background image itself is dark (night sky) — but it must
    // still paint: rendering WITHOUT the layout dir loses its ink entirely.
    const withImage = litPixelCount(frame);
    const withoutImage = litPixelCount(
      await decode(
        await makeRenderer().render(manifest, {
          hour1: "10",
          colon1: ":",
          min1: "30",
          am_pm: "AM",
          location1: "Berlin",
        }),
      ),
    );
    expect(withImage).toBeGreaterThan(2000);
    expect(withImage).toBeGreaterThan(withoutImage);
  }, 30000);

  it("renders the pagination_09 fixture (gradient themes, carousel slots)", async () => {
    const dir = path.join(FIXTURES_DIR, "pagination_09.sdLayoutEx");
    const manifest = parseLayoutEx(
      JSON.parse(await fs.readFile(path.join(dir, "manifest.json"), "utf-8")),
    ) as LayoutExManifest;
    const png = await makeRenderer().render(
      manifest,
      {
        current_page_icon: "current",
        current_page_name: "Home",
        next_page_icon: "next",
      },
      { layoutDir: dir },
    );
    const frame = await decode(png);
    expect(frame.width).toBe(232);
    expect(frame.height).toBe(50);
    expect(litPixelCount(frame)).toBeGreaterThan(232 * 50 * 0.25);
  }, 30000);
});
