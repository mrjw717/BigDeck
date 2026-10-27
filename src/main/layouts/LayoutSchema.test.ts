// ============================================================================
// LayoutSchema — .sdLayoutEx manifest parsing/validation tests
//
// The fixtures in __fixtures__/ are real Elgato-bundled layouts (font TTFs
// stripped to keep the repo light; manifests/images/licenses intact) chosen
// to cover ALL 11 element types, both layout families, theme image tokens
// and gradient color specs. The survey contract lives in LayoutSchema.ts.
// ============================================================================

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  parseLayoutEx,
  parseLayoutExDetailed,
} from "./LayoutSchema";
import type { LayoutExManifest } from "../../shared/types";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

/** Original Elgato bundle — present only on RE machines; tests skip elsewhere. */
const ELGATO_SOURCE_DIR =
  "/home/josh/Documents/Reverse-Engineering/streamdeck/extracted/app/Applications/Stream Deck.app/Contents/Resources/InfobarLayouts";

function fixtureDirs(): string[] {
  return fs
    .readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith(".sdLayoutEx"))
    .map((d) => path.join(FIXTURES_DIR, d.name))
    .sort();
}

function loadManifest(dir: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf-8"));
}

/** Minimal valid manifest builder for negative cases. */
function validManifest(): Record<string, unknown> {
  return {
    themes: [
      {
        id: "black",
        primaryColor: "#000000",
        secondaryColor: "#FFFFFF",
        colors: { backgroundColor: "#000000", textColor: "#FFFFFF" },
        fonts: {
          timeFont: { family: "Roboto Condensed", size: 37, weight: 700, italic: false },
        },
      },
    ],
    elements: [{ key: "hour1", type: "hours" }],
    template: {
      id: "test_layout",
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
          rect: [24, 0, 38, 50],
          value: "0",
          font: "{{timeFont}}",
          color: "{{textColor}}",
          alignment: "right",
          "text-overflow": "clip",
          zOrder: 1,
        },
      ],
    },
  };
}

describe("parseLayoutEx against bundled Elgato fixtures", () => {
  it("has fixtures for both layout families", () => {
    const dirs = fixtureDirs();
    expect(dirs.length).toBeGreaterThanOrEqual(6);
    expect(dirs.some((d) => path.basename(d).startsWith("digital_time_"))).toBe(true);
    expect(dirs.some((d) => path.basename(d).startsWith("pagination_"))).toBe(true);
  });

  for (const dir of fixtureDirs()) {
    const name = path.basename(dir, ".sdLayoutEx");
    it(`parses ${name}`, () => {
      const result = parseLayoutExDetailed(loadManifest(dir));
      expect(result.errors).toEqual([]);
      expect(result.ok).toBe(true);
      const m = result.manifest as LayoutExManifest;
      expect(m.themes.length).toBeGreaterThan(0);
      expect(m.elements.length).toBeGreaterThan(0);
      expect(m.template.id).toBe(name);
      // Every template item rect stays inside the logical 232x50 canvas.
      for (const item of m.template.items) {
        expect(item.rect[0] + item.rect[2]).toBeLessThanOrEqual(232);
        expect(item.rect[1] + item.rect[3]).toBeLessThanOrEqual(50);
      }
    });
  }

  it("fixtures cover all 11 surveyed element types", () => {
    const seen = new Set<string>();
    for (const dir of fixtureDirs()) {
      const m = parseLayoutEx(loadManifest(dir)) as LayoutExManifest;
      for (const e of m.elements) seen.add(e.type);
    }
    expect(seen).toEqual(
      new Set([
        "hours",
        "minutes",
        "colon",
        "am/pm",
        "day",
        "date",
        "custom_date",
        "location",
        "carousel_page",
        "show_on_am/pm",
        "show_on_clock_type",
      ]),
    );
  });

  it("preserves per-type element fields (carousel_page, show_on_*)", () => {
    const m = parseLayoutEx(loadManifest(path.join(FIXTURES_DIR, "pagination_09.sdLayoutEx"))) as LayoutExManifest;
    const icons = m.elements.filter((e) => e.type === "carousel_page");
    expect(icons.length).toBeGreaterThanOrEqual(2);
    expect(icons[0].display).toBe("Icon");
    expect(icons[0].wrap).toBe("Unique");
    expect(typeof icons[0].offset).toBe("number");

    const dt04 = parseLayoutEx(loadManifest(path.join(FIXTURES_DIR, "digital_time_04.sdLayoutEx"))) as LayoutExManifest;
    const gates = dt04.elements.filter((e) => e.type === "show_on_am/pm");
    expect(gates.map((g) => g.periode).sort()).toEqual(["AM", "PM"]);
    expect(dt04.elements.some((e) => e.type === "show_on_clock_type" && e.format === "Hour12")).toBe(true);
    expect(dt04.elements.some((e) => e.type === "show_on_clock_type" && e.format === "Hour24")).toBe(true);
  });

  it("preserves theme token tables including gradients and image tokens", () => {
    // pagination_09 declares gradient color specs (h$…/d1$… syntax).
    const p09 = parseLayoutEx(loadManifest(path.join(FIXTURES_DIR, "pagination_09.sdLayoutEx"))) as LayoutExManifest;
    const gradients = Object.values(p09.themes[0].colors).filter((c) => c.includes("$"));
    expect(gradients.length).toBeGreaterThan(0);
    expect(gradients[0]).toMatch(/^[hd]\d*\$[\d.]+:#[0-9a-fA-F]{6}/);

    // digital_time_11 declares per-theme background images.
    const dt11 = parseLayoutEx(loadManifest(path.join(FIXTURES_DIR, "digital_time_11.sdLayoutEx"))) as LayoutExManifest;
    const images = dt11.themes[0].images ?? {};
    expect(images.backgroundImage).toBe("images/rainbow_background.png");

    // digital_time_01 uses the generic numeric token dialect (color0/color1).
    const dt01 = parseLayoutEx(loadManifest(path.join(FIXTURES_DIR, "digital_time_01.sdLayoutEx"))) as LayoutExManifest;
    expect(Object.keys(dt01.themes[0].colors).sort()).toEqual(["color0", "color1"]);
    expect(Object.keys(dt01.themes[0].fonts).sort()).toEqual(["font0", "font1"]);
    // …and the outline_only text dialect on its digits.
    const hour1 = dt01.template.items.find((i) => i.key === "hour1");
    expect(hour1?.type).toBe("text");
    if (hour1?.type === "text") {
      expect(hour1.outline_only).toBe(true);
      expect(hour1.outline_w).toBeGreaterThan(0);
    }
  });
});

describe("parseLayoutEx against the full Elgato bundle", () => {
  const sourceExists = fs.existsSync(ELGATO_SOURCE_DIR);

  it.skipIf(!sourceExists)(
    "validates every layout shipped with Stream Deck 7.x",
    () => {
      const dirs = fs
        .readdirSync(ELGATO_SOURCE_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .flatMap((family) =>
          fs
            .readdirSync(path.join(ELGATO_SOURCE_DIR, family.name), { withFileTypes: true })
            .filter((d) => d.isDirectory() && d.name.endsWith(".sdLayoutEx"))
            .map((d) => path.join(ELGATO_SOURCE_DIR, family.name, d.name)),
        );
      expect(dirs.length).toBeGreaterThanOrEqual(19);
      for (const dir of dirs) {
        const result = parseLayoutExDetailed(loadManifest(dir));
        expect(result.errors, `${dir}`).toEqual([]);
        expect(result.ok, `${dir}`).toBe(true);
      }
    },
  );
});

describe("parseLayoutEx validation", () => {
  it("accepts a valid manifest and maps its fields", () => {
    const result = parseLayoutExDetailed(validManifest());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    const m = result.manifest as LayoutExManifest;
    expect(m.themes[0].id).toBe("black");
    expect(m.themes[0].fonts.timeFont.size).toBe(37);
    expect(m.elements[0]).toEqual({ key: "hour1", type: "hours" });
    expect(m.template.items).toHaveLength(2);
  });

  it("rejects non-object payloads", () => {
    for (const raw of [null, "nope", 42, []]) {
      const result = parseLayoutExDetailed(raw);
      expect(result.ok).toBe(false);
      expect(result.manifest).toBeNull();
      expect(result.errors).toHaveLength(1);
    }
  });

  it("collects multiple problems without failing fast", () => {
    const raw = validManifest();
    (raw.themes as unknown[]).push({ id: "", primaryColor: 5 });
    raw.elements = [
      { key: "", type: "hours" },
      { key: "x", type: "warp_drive" },
      { key: "y" },
    ];
    const result = parseLayoutExDetailed(raw);
    expect(result.ok).toBe(false);
    expect(result.manifest).toBeNull();
    expect(result.errors).toContain("themes[1].id: missing or empty");
    expect(result.errors).toContain("themes[1].primaryColor: expected a string");
    expect(result.errors).toContain("elements[0].key: missing or empty");
    expect(result.errors).toContain('elements[1].type: unknown element type "warp_drive"');
    expect(result.errors).toContain("elements[2].type: unknown element type \"undefined\"");
    expect(result.errors.length).toBe(8);
  });

  it("rejects missing top-level sections", () => {
    const result = parseLayoutExDetailed({});
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining(["themes: missing", "elements: missing", "template: expected an object"]),
    );
  });

  it("validates theme font tokens", () => {
    const raw = validManifest();
    (raw.themes as Array<Record<string, unknown>>)[0].fonts = {
      timeFont: { family: "X", size: -3, weight: "bold", italic: "no" },
    };
    const result = parseLayoutExDetailed(raw);
    expect(result.errors).toContain("themes[0].fonts.timeFont.size: expected a positive number");
    expect(result.errors).toContain("themes[0].fonts.timeFont.weight: expected a number");
    expect(result.errors).toContain("themes[0].fonts.timeFont.italic: expected a boolean");
  });

  it("accepts theme image token tables", () => {
    const raw = validManifest();
    (raw.themes as Array<Record<string, unknown>>)[0].images = {
      backgroundImage: "images/bg.png",
    };
    const m = parseLayoutEx(raw) as LayoutExManifest;
    expect(m.themes[0].images).toEqual({ backgroundImage: "images/bg.png" });
  });

  it("validates carousel_page fields", () => {
    const raw = validManifest();
    raw.elements = [
      { key: "a", type: "carousel_page", display: "Pixel", wrap: "Unique", offset: 0, extend: [0, 1] },
      { key: "b", type: "carousel_page", extend: [1] },
    ];
    const result = parseLayoutExDetailed(raw);
    expect(result.errors).toContain('elements[0].display: unknown value "Pixel"');
    expect(result.errors).toContain("elements[1].extend: expected [number, number]");
  });

  it("validates visibility gate fields", () => {
    const raw = validManifest();
    raw.elements = [
      { key: "a", type: "show_on_am/pm", periode: "noon" },
      { key: "b", type: "show_on_clock_type", format: "Hour25" },
    ];
    const result = parseLayoutExDetailed(raw);
    expect(result.errors).toContain('elements[0].periode: unknown value "noon"');
    expect(result.errors).toContain('elements[1].format: unknown value "Hour25"');
  });

  it("validates template items", () => {
    const raw = validManifest();
    raw.template = {
      id: "t",
      items: [
        { key: "x", type: "vector", rect: [0, 0, 1, 1] },
        { key: "y", type: "text", rect: [0, 0, 232] },
        { key: "z", type: "text", rect: [0, 0, 10, 10], alignment: "diagonal", "text-overflow": "wrap" },
        { key: "p", type: "pixmap", rect: [0, 0, 10, 10], padding: [1, 2, 3] },
      ],
    };
    const result = parseLayoutExDetailed(raw);
    expect(result.errors).toContain('template.items[0].type: unknown item type "vector"');
    expect(result.errors).toContain("template.items[1].rect: expected [x, y, width, height] numbers");
    expect(result.errors).toContain('template.items[2].alignment: unknown value "diagonal"');
    expect(result.errors).toContain("template.items[3].padding: expected [number, number, number, number]");
  });

  it("keeps unknown extra fields out of the validated model without erroring", () => {
    const raw = validManifest();
    raw.futureField = { whatever: true };
    (raw.elements as Array<Record<string, unknown>>)[0].secret = "unused";
    const m = parseLayoutEx(raw) as LayoutExManifest;
    expect(m).not.toBeNull();
    expect((m.elements[0] as unknown as Record<string, unknown>).secret).toBeUndefined();
  });

  it("parseLayoutEx returns the manifest or null", () => {
    expect(parseLayoutEx(validManifest())).not.toBeNull();
    expect(parseLayoutEx("junk")).toBeNull();
  });
});
