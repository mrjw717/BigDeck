// ============================================================================
// BigDeck - Elgato .sdLayoutEx InfoBar Layout Renderer (v1)
//
// Renders a validated LayoutExManifest (see LayoutSchema.ts for the surveyed
// schema) to a PNG buffer: theme tokens (`{{name}}`) are resolved against the
// selected theme, element keys are fed from a caller-supplied data provider
// map (element key → display value, e.g. hour1 → "10"), and template items
// are painted in `zOrder` onto the 232x50 logical layout canvas.
//
// Rendering reuses the KeyRenderer SVG techniques (sharp + librsvg):
// - solid/gradient fills become <linearGradient> defs (userSpaceOnUse, item
//   rect geometry — the same endpoint discipline as KeyRenderer.createGradientSvg)
// - text is per-item <text> with text-anchor alignment; font-family carries a
//   `, sans-serif` fallback so layouts render even when the bundled TTF
//   (Orbitron, Roboto Condensed, …) is not installed — size/weight/italic
//   come from the theme token, not the font file
// - outline_w/outline_c/outline_only map to SVG stroke attributes
//
// v1 scope (see the LayoutSchema survey table): text-ish element types
// (hours / minutes / colon / am/pm plus literal template text) with
// show_zero + capitalize handling; carousel_page items render the page Icon
// image from the data provider when one is supplied (resolved against the
// layout directory), otherwise a neutral chip in `fill_c` inside the
// item's `background`/`border_radius`/`padding` geometry — matching how the
// bundled pagination layouts draw their icon slots. Visibility-gated element
// types (show_on_am/pm, show_on_clock_type) draw their item only when the
// provider supplies a truthy value for the key; date/day/location/custom_date
// are provider-fed strings. Element `animated` colons render static.
//
// NEXT PHASE (device wiring): the SD+/Neo LCD writer will consume the PNG
// produced here (optionally scaled, see LayoutRenderOptions.scale) and push
// raw RGB frames to the device.
// ============================================================================

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type {
  LayoutExElement,
  LayoutExManifest,
  LayoutExPixmapItem,
  LayoutExTemplateItem,
  LayoutExTextItem,
  LayoutExTheme,
} from "../../shared/types";
import type { Logger } from "../utils/Logger";

/** Element key → display value ("10", "AM", "Wednesday", "/path/icon.png", true…). */
export type LayoutDataProvider = Record<string, unknown>;

export interface LayoutRenderOptions {
  /** Theme id to render; defaults to the first declared theme. */
  themeId?: string;
  /**
   * Output pixels per layout unit. Default 1 → native 232x50. The SD+ info
   * bar framebuffer is 800x100 (scale ≈ 3.448); v1 renders at the logical
   * size and rescales the flattened frame.
   */
  scale?: number;
  /**
   * Layout package root (the .sdLayoutEx directory) — resolves
   * theme.images paths (`images/night_background.png`). When omitted, or
   * when the file is unreadable, image items fall back to the neutral chip.
   */
  layoutDir?: string;
  /** Flatten base behind everything; layouts paint their own background. */
  baseColor?: string;
}

interface ResolvedColor {
  /** Ready-to-use SVG paint (`#RRGGBB`). */
  paint: string;
  /** Gradient stops when the spec is an Elgato gradient string. */
  gradient?: Array<{ offset: number; color: string }>;
  /** `h` horizontal, `d` diagonal (observed prefixes). */
  gradientDir?: string;
}

const NEUTRAL_COLOR = "#808080";

export class LayoutRenderer {
  private readonly logger: Logger;
  private gradientSeq = 0;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /** Logical canvas size — every surveyed layout fits 232x50. */
  static readonly CANVAS_WIDTH = 232;
  static readonly CANVAS_HEIGHT = 50;

  /**
   * Render the layout with the given provider data to a PNG buffer.
   * Per-item failures are logged and skipped (degrade-gracefully, matching
   * KeyRenderer's layer pipeline) — a partial frame beats no frame.
   */
  async render(
    manifest: LayoutExManifest,
    data: LayoutDataProvider,
    opts: LayoutRenderOptions = {},
  ): Promise<Buffer> {
    const theme = this.selectTheme(manifest, opts.themeId);
    const scale = opts.scale !== undefined && opts.scale > 0 ? opts.scale : 1;

    // Canvas = the union of item rects (232x50 across all surveyed layouts),
    // floored to at least the known device canvas so an item-less template
    // still produces a valid frame.
    let width = LayoutRenderer.CANVAS_WIDTH;
    let height = LayoutRenderer.CANVAS_HEIGHT;
    for (const item of manifest.template.items) {
      width = Math.max(width, item.rect[0] + item.rect[2]);
      height = Math.max(height, item.rect[1] + item.rect[3]);
    }

    const elementsByKey = new Map<string, LayoutExElement>();
    for (const element of manifest.elements) elementsByKey.set(element.key, element);

    // Paint items ascending by zOrder (stable by declaration order) in
    // z-runs: consecutive non-image items share one full-canvas SVG slice so
    // image items keep their exact z position relative to text.
    const ordered = manifest.template.items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const za = a.item.zOrder ?? 0;
        const zb = b.item.zOrder ?? 0;
        return za !== zb ? za - zb : a.index - b.index;
      });

    const layers: Array<{ input: Buffer; top: number; left: number }> = [];
    let run: Array<{ item: LayoutExTemplateItem }> = [];

    const flushRun = async (): Promise<void> => {
      if (run.length === 0) return;
      const slice = this.renderRunSvg(run.map((r) => r.item), {
        theme,
        data,
        elementsByKey,
        width,
        height,
      });
      run = [];
      if (!slice) return;
      try {
        const buf = await sharp(Buffer.from(slice)).png().toBuffer();
        layers.push({ input: buf, top: 0, left: 0 });
      } catch (err) {
        this.logger.warn(`[LayoutRenderer] SVG slice failed: ${err}`);
      }
    };

    for (const { item } of ordered) {
      if (!this.itemVisible(item, elementsByKey.get(item.key), data)) continue;
      const imageBuf = await this.itemImage(item, theme, opts.layoutDir);
      if (imageBuf) {
        await flushRun();
        layers.push({ input: imageBuf, top: item.rect[1], left: item.rect[0] });
      } else {
        run.push({ item });
      }
    }
    await flushRun();

    const base = {
      create: {
        width,
        height,
        channels: 4 as const,
        background: opts.baseColor ?? "#000000",
      },
    };

    let out = sharp(base);
    if (layers.length > 0) out = out.composite(layers);
    let pipeline = out.ensureAlpha().flatten({ background: opts.baseColor ?? "#000000" });
    if (scale !== 1) {
      pipeline = pipeline.resize(
        Math.round(width * scale),
        Math.round(height * scale),
        { fit: "fill" },
      );
    }
    return pipeline.png().toBuffer();
  }

  // -- theme / token resolution ----------------------------------------------

  private selectTheme(manifest: LayoutExManifest, themeId?: string): LayoutExTheme {
    if (themeId) {
      const found = manifest.themes.find((t) => t.id === themeId);
      if (found) return found;
      this.logger.warn(`[LayoutRenderer] theme "${themeId}" not found, using first`);
    }
    return (
      manifest.themes[0] ?? {
        id: "default",
        primaryColor: "",
        secondaryColor: "",
        colors: {},
        fonts: {},
      }
    );
  }

  /** Strip `{{…}}` around a token reference; null for literal values. */
  private tokenRef(value: string | undefined): string | null {
    if (!value) return null;
    const m = /^\{\{(.+)\}\}$/.exec(value.trim());
    return m ? m[1] : null;
  }

  /**
   * Resolve a color spec (literal or `{{token}}`) into SVG paint + optional
   * gradient stops. Elgato gradient syntax: `h$0:#C1,1:#C2[,0.7:#Cm]` with
   * `h` (horizontal) / `d` (diagonal) prefixes observed. Unparseable specs
   * degrade to a neutral fill — never throw.
   */
  private resolveColor(spec: string | undefined, theme: LayoutExTheme): ResolvedColor {
    const token = this.tokenRef(spec);
    const raw = token !== null ? theme.colors[token] : spec;
    if (raw === undefined || raw === "") return { paint: NEUTRAL_COLOR };

    const gm = /^([hd]\d*)\$((?:[\d.]+:#(?:[0-9a-fA-F]{3,8}),?)+)$/.exec(raw);
    if (gm) {
      const stops: Array<{ offset: number; color: string }> = [];
      for (const part of gm[2].split(",")) {
        const sm = /^([\d.]+):(#(?:[0-9a-fA-F]{3,8}))$/.exec(part);
        if (sm) stops.push({ offset: parseFloat(sm[1]), color: sm[2] });
      }
      stops.sort((a, b) => a.offset - b.offset);
      if (stops.length >= 2) {
        return { paint: stops[0].color, gradient: stops, gradientDir: gm[1] };
      }
    }
    if (/^#(?:[0-9a-fA-F]{3,8})$/.test(raw)) return { paint: raw };
    return { paint: NEUTRAL_COLOR };
  }

  /** SVG paint for a color spec, registering a gradient def when needed. */
  private paintFor(
    spec: string | undefined,
    theme: LayoutExTheme,
    rect: readonly [number, number, number, number],
    defs: string[],
  ): string {
    const resolved = this.resolveColor(spec, theme);
    if (!resolved.gradient) return resolved.paint;
    const id = `lg${this.gradientSeq++}`;
    // `h$` = left→right across the item rect; `d1$` = top-left→bottom-right.
    const horizontal = resolved.gradientDir?.startsWith("h");
    const [x, y, w, h] = rect;
    const stops = resolved.gradient
      .map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`)
      .join("");
    defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + w}" y2="${horizontal ? y : y + h}">${stops}</linearGradient>`,
    );
    return `url(#${id})`;
  }

  // -- data binding ------------------------------------------------------------

  /**
   * Visibility-gated element types render only on a truthy provider value
   * (BigDeck's clock module owns the AM/PM and 12/24h decisions; the layout
   * only declares where the gated art sits).
   */
  private isGateElement(element: LayoutExElement | undefined): boolean {
    return (
      element?.type === "show_on_am/pm" ||
      element?.type === "show_on_clock_type"
    );
  }

  private itemVisible(
    item: LayoutExTemplateItem,
    element: LayoutExElement | undefined,
    data: LayoutDataProvider,
  ): boolean {
    if (!element) return true;
    if (this.isGateElement(element)) {
      const v = data[element.key];
      return v === true || v === 1 || v === "1" || v === "true";
    }
    // Text slots bound to a provider value stay hidden until data exists,
    // unless the template carries a literal (e.g. the ":" placeholder).
    if (item.type === "text") {
      if (data[element.key] !== undefined) return true;
      return (item.value ?? "") !== "";
    }
    return true;
  }

  /** Apply element-type transforms (show_zero padding, capitalize) to data. */
  private textValue(
    item: LayoutExTextItem,
    element: LayoutExElement,
    data: LayoutDataProvider,
  ): string {
    const raw = data[element.key];
    // No provider data → fall back to the template literal (e.g. the ":"
    // placeholder on a colon slot); templates use it for static glyphs.
    if (raw === undefined || raw === null) return item.value ?? "";
    let value = String(raw);
    switch (element.type) {
      case "hours":
      case "minutes": {
        const n = Number.parseInt(value, 10);
        if (Number.isFinite(n) && n >= 0 && n <= 9 && element.show_zero) {
          value = `0${n}`;
        }
        break;
      }
      case "am/pm":
        if (element.capitalize) value = value.toUpperCase();
        break;
      default:
        break;
    }
    return value;
  }

  // -- SVG generation ----------------------------------------------------------

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /** SVG font attributes + resolved size (baseline math needs the number). */
  private fontSpec(
    item: LayoutExTextItem,
    theme: LayoutExTheme,
  ): { attrs: string; size: number } {
    const token = this.tokenRef(item.font);
    const font = token !== null ? theme.fonts[token] : undefined;
    if (!font) return { attrs: `font-family="sans-serif" font-size="14"`, size: 14 };
    const size = Number.isFinite(font.size) && font.size > 0 ? font.size : 14;
    const family = this.escapeXml(font.family);
    const attrs =
      `font-family="${family}, sans-serif" font-size="${size}"` +
      (font.weight ? ` font-weight="${font.weight}"` : "") +
      (font.italic ? ` font-style="italic"` : "");
    return { attrs, size };
  }

  /**
   * Render one z-run of non-image items into a full-canvas transparent SVG.
   * Returns null when every item in the run drew nothing.
   */
  private renderRunSvg(
    items: LayoutExTemplateItem[],
    ctx: {
      theme: LayoutExTheme;
      data: LayoutDataProvider;
      elementsByKey: Map<string, LayoutExElement>;
      width: number;
      height: number;
    },
  ): string | null {
    const defs: string[] = [];
    const body: string[] = [];
    let clipSeq = 0;

    for (const item of items) {
      try {
        if (item.type === "pixmap") {
          this.pixmapSvg(item, ctx, defs, body);
        } else {
          this.textSvg(item, ctx, defs, body, () => `clip${clipSeq++}`);
        }
      } catch (err) {
        this.logger.warn(`[LayoutRenderer] item "${item.key}" failed: ${err}`);
      }
    }
    if (body.length === 0) return null;
    return (
      `<svg width="${ctx.width}" height="${ctx.height}" xmlns="http://www.w3.org/2000/svg">` +
      (defs.length > 0 ? `<defs>${defs.join("")}</defs>` : "") +
      body.join("") +
      `</svg>`
    );
  }

  private pixmapSvg(
    item: LayoutExPixmapItem,
    ctx: {
      theme: LayoutExTheme;
      data: LayoutDataProvider;
      elementsByKey: Map<string, LayoutExElement>;
    },
    defs: string[],
    body: string[],
  ): void {
    const [x, y, w, h] = item.rect;
    const rx = item.border_radius ?? 0;
    // Chip background — always drawn (it is the slot itself).
    if (item.background !== undefined) {
      const paint = this.paintFor(item.background, ctx.theme, item.rect, defs);
      body.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${paint}"/>`,
      );
    }
    // Icon content is inset by `padding` (observed symmetric [p,p,p,p]);
    // without a provider image the slot shows a neutral chip in fill_c.
    const pad = item.padding ? item.padding[0] : 0;
    if (w - pad * 2 > 0 && h - pad * 2 > 0 && item.fill_c !== undefined) {
      const paint = this.paintFor(
        item.fill_c,
        ctx.theme,
        [x + pad, y + pad, w - pad * 2, h - pad * 2],
        defs,
      );
      body.push(
        `<rect x="${x + pad}" y="${y + pad}" width="${w - pad * 2}" height="${h - pad * 2}" rx="${Math.max(rx - pad, 0)}" fill="${paint}"/>`,
      );
    }
  }

  private textSvg(
    item: LayoutExTextItem,
    ctx: {
      theme: LayoutExTheme;
      data: LayoutDataProvider;
      elementsByKey: Map<string, LayoutExElement>;
    },
    defs: string[],
    body: string[],
    nextClipId: () => string,
  ): void {
    const [x, y, w, h] = item.rect;
    // Optional fill behind the text (am/pm chip in digital_time_01).
    if (item.background !== undefined) {
      const paint = this.paintFor(item.background, ctx.theme, item.rect, defs);
      body.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${item.border_radius ?? 0}" fill="${paint}"/>`,
      );
    }

    const element = ctx.elementsByKey.get(item.key);
    const value = element ? this.textValue(item, element, ctx.data) : (item.value ?? "");
    if (value === "") return;

    const { attrs: fontAttrs, size: fontSize } = this.fontSpec(item, ctx.theme);

    // Alignment → text-anchor at the rect edge/center; baseline approximated
    // at cap-height center (dominant-baseline is unreliable in librsvg).
    const anchor = item.alignment === "left" ? "start" : item.alignment === "right" ? "end" : "middle";
    const anchorX = item.alignment === "left" ? x : item.alignment === "right" ? x + w : x + w / 2;
    const baselineY = y + h / 2 + fontSize * 0.35;

    const fill = item.outline_only
      ? "none"
      : this.paintFor(item.color, ctx.theme, item.rect, defs);
    const stroke =
      item.outline_w !== undefined && item.outline_w > 0 && item.outline_c !== undefined
        ? ` stroke="${this.paintFor(item.outline_c, ctx.theme, item.rect, defs)}" stroke-width="${item.outline_w}" paint-order="stroke"`
        : "";

    let clipAttr = "";
    if (item["text-overflow"] === "clip") {
      const id = nextClipId();
      defs.push(`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`);
      clipAttr = ` clip-path="url(#${id})"`;
    }

    body.push(
      `<text x="${anchorX}" y="${baselineY}" ${fontAttrs} fill="${fill}"${stroke} text-anchor="${anchor}"${clipAttr}>${this.escapeXml(value)}</text>`,
    );
  }

  // -- image items -------------------------------------------------------------

  /**
   * Load the provider/page image for an item, sized to its (padding-inset)
   * rect. Returns null when the item references no image, the provider has
   * none, or the file is missing — the caller then renders the item's SVG
   * chip instead (neutral-block fallback).
   */
  private async itemImage(
    item: LayoutExTemplateItem,
    theme: LayoutExTheme,
    layoutDir: string | undefined,
  ): Promise<Buffer | null> {
    if (item.type !== "pixmap" || item.value === undefined) return null;
    const token = this.tokenRef(item.value);
    const themePath = token !== null ? theme.images?.[token] : undefined;
    const rel = themePath ?? (token === null ? item.value : undefined);
    if (!rel || !layoutDir) return null;

    const pad = item.padding ? item.padding[0] : 0;
    const w = item.rect[2] - pad * 2;
    const h = item.rect[3] - pad * 2;
    if (w <= 0 || h <= 0) return null;

    try {
      const file = await fs.readFile(path.resolve(layoutDir, rel));
      return await sharp(file).resize(w, h, { fit: "fill" }).png().toBuffer();
    } catch (err) {
      this.logger.warn(`[LayoutRenderer] image "${rel}" unavailable: ${err}`);
      return null;
    }
  }
}
