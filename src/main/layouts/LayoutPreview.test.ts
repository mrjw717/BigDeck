// ============================================================================
// LayoutPreview — mock clock data provider + gallery render tests
//
// Runs every bundled fixture layout through the preview pipeline (mock
// provider → LayoutRenderer PNG at gallery scale) and pins the provider
// contract: every non-unknown element gets data, gates get booleans, and the
// AM twin of a gated pair is the one drawn.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import sharp from "sharp";
import { LayoutRenderer } from "./LayoutRenderer";
import { LayoutStore } from "./LayoutStore";
import {
  buildMockDataProvider,
  renderLayoutPreview,
  LAYOUT_PREVIEW_SCALE,
} from "./LayoutPreview";
import type { Logger } from "../utils/Logger";

const logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
} as unknown as Logger;

// Repo layout: src/main/layouts → repo fixtures one level down.
const FIXTURES =
  typeof __dirname !== "undefined"
    ? path.join(__dirname, "__fixtures__")
    : path.join(process.cwd(), "src/main/layouts/__fixtures__");

let tmp: string;
let store: LayoutStore;
const renderer = new LayoutRenderer(logger);

beforeEach(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "layoutpreview-"));
  // Copy the fixtures into a store layout dir (images/fonts travel along).
  await fsp.cp(FIXTURES, path.join(tmp, "fixtures"), { recursive: true });
  store = new LayoutStore({ logger, layoutsDir: path.join(tmp, "fixtures") });
  await store.discover();
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("buildMockDataProvider", () => {
  it("provides data for every clock element across the digital-time fixtures", () => {
    for (const entry of store.list()) {
      if (entry.manifest.elements.some((e) => e.type === "carousel_page")) continue;
      const data = buildMockDataProvider(entry.manifest);
      for (const element of entry.manifest.elements) {
        expect(data[element.key], `${entry.id}:${element.key}`).toBeDefined();
      }
      expect(data.hour1).toBe(10);
      expect(data.min1).toBe(42);
      if (data.am_pm !== undefined) expect(data.am_pm).toBe("PM");
    }
  });

  it("turns AM gates on and PM gates off (no overlapping gated art)", () => {
    const entry = store.list().find((e) =>
      e.manifest.elements.some((el) => el.type === "show_on_am/pm"),
    )!;
    expect(entry).toBeTruthy();
    const data = buildMockDataProvider(entry.manifest);
    const am = entry.manifest.elements.find((e) => /am/i.test(e.key) && !/pm/i.test(e.key))!;
    const pm = entry.manifest.elements.find((e) => /pm/i.test(e.key))!;
    expect(data[am.key]).toBe(true);
    expect(data[pm.key]).toBe(false);
  });

  it("names carousel pages so the pagination preview shows text", () => {
    const entry = store.list().find((e) =>
      e.manifest.elements.some((el) => el.type === "carousel_page"),
    )!;
    expect(entry).toBeTruthy();
    const data = buildMockDataProvider(entry.manifest);
    expect(data.current_page_name).toBe("Home");
  });
});

describe("renderLayoutPreview", () => {
  it("renders every fixture layout to a 3× PNG (696×150)", async () => {
    const entries = store.list();
    expect(entries.length).toBeGreaterThanOrEqual(6);
    for (const entry of entries) {
      const png = await renderLayoutPreview(entry, renderer);
      const meta = await sharp(png).metadata();
      expect(meta.format, entry.id).toBe("png");
      expect(meta.width, entry.id).toBe(232 * LAYOUT_PREVIEW_SCALE);
      expect(meta.height, entry.id).toBe(50 * LAYOUT_PREVIEW_SCALE);
    }
  });

  it("uses the first declared theme", async () => {
    const entry = store.list()[0];
    // Two renders differing only in theme order must differ in pixels —
    // the preview is pinned to themeIds[0], not an arbitrary theme.
    const first = await renderLayoutPreview(entry, renderer);
    const other = await renderer.render(
      entry.manifest,
      buildMockDataProvider(entry.manifest),
      {
        themeId: entry.themeIds[entry.themeIds.length - 1],
        scale: LAYOUT_PREVIEW_SCALE,
        layoutDir: entry.dir,
      },
    );
    expect(first.equals(other)).toBe(false);
  });
});
