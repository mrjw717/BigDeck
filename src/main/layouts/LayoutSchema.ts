// ============================================================================
// BigDeck - Elgato .sdLayoutEx InfoBar Layout Schema Parser
//
// Parses and validates Elgato Stream Deck+ / Neo LCD "InfoBar layout"
// manifests (.sdLayoutEx/manifest.json). The schema below was reverse
// engineered from EVERY layout bundled with Stream Deck 7.x
// (Resources/InfobarLayouts/{DigitalTime,Pagination} — 19 layouts total,
// surveyed 2026-10; fixtures live in __fixtures__/).
//
// A manifest has three sections:
// - `themes[]`  — named token tables (colors / fonts / images) referenced
//                 from the template via `{{token}}` placeholders.
// - `elements[]` — data bindings: WHAT a slot shows (hours, minutes, …).
// - `template`  — the drawing recipe: positioned items (pixmap/text) bound
//                 to elements BY KEY, painted in `zOrder` on a 232x50
//                 logical canvas.
//
// ELEMENT TYPE SURVEY (type → per-type fields → v1 renderer status):
//
//   type               fields                          v1 renderer
//   ----------------   -----------------------------   -------------------------
//   hours              show_zero?                      SUPPORTED (text data;
//                                                      show_zero zero-pads
//                                                      single digits, inferred
//                                                      from layouts that pad
//                                                      minutes but not hours)
//   minutes            show_zero?                      SUPPORTED (as hours)
//   colon              animated?                       SUPPORTED (static ":";
//                                                      only animated:false
//                                                      observed — blink is a
//                                                      device-clock behavior)
//   am/pm              capitalize?                     SUPPORTED (provider
//                                                      string; capitalize
//                                                      uppercases)
//   day                dateType?, dateFormat?          DOCUMENTED (provider
//                       observed "Text"/"Long"         supplies preformatted
//                                                      weekday string)
//   date               dateFormat? ("Short")           DOCUMENTED (provider
//                                                      supplies preformatted)
//   custom_date        dateFormat?                     DOCUMENTED (provider
//                       "Month_Day" |                  supplies preformatted;
//                       "Weekday_Month_Day" |          format names preserved)
//                       "Weekday_Month_Day_Short"
//   location           —                               DOCUMENTED (provider
//                                                      supplies city/timezone
//                                                      label)
//   carousel_page      display?("Icon"|"Name"|"        PARTIAL (v1 renders the
//                      Number"), wrap?("Unique"),     page Icon slot: provider
//                      offset?(relative page,         image when given, else
//                      -1..3 observed),               neutral chip via
//                      extend?([n,n], purpose         fill_c/background; Name/
//                      unconfirmed)                   Number flow through text
//                                                      items when bound)
//   show_on_am/pm      periode?("AM"|"PM")             DOCUMENTED (visibility
//                                                      gate; v1 shows the item
//                                                      when its key has a
//                                                      truthy provider value)
//   show_on_clock_type format?("Hour12"|"Hour24")      DOCUMENTED (visibility
//                                                      gate, same mechanism)
//
// THEME TOKEN SURVEY (token tables vary per layout; all resolve via {{name}}):
//
//   colors:  color0, color1, backgroundColor, backgroundColor(s), textColor,
//            subtextColor, timeColor, locationColor, accentColor,
//            accentColor1, accentColor2, frameColor, outlineColor,
//            numberColor, foregroundColor, imageColor, imageColor1/2,
//            imageBkColor1/2, activeColor, activeImageColor, inactive,
//            inactiveColor, inactiveColor1/2, inactiveImageColor,
//            gradient1, gradient2
//   fonts:   font0/font1/font2, timeFont, timeFontSmall, staticFont, amFont,
//            dateFont, locationFont, smallFont, numberFont, textFont,
//            clockFont
//   images:  backgroundImage, overlayImage  → layout-relative PNG paths
//
//   Color values are `#RRGGBB` or gradient strings:
//     `h$0:#204CFE,1:#CE1F93`        horizontal linear gradient
//     `d1$0:#3972DF,0.73:#16BBBB`    diagonal, multi-stop (`offset:#hex`)
//   Font values always {family, size, weight, italic}; weight 400..700.
//
// PARSING POLICY (matches SDManifest.ts): structural and dependency-free —
// the manifest comes from untrusted imports, every field is type-checked
// before use, and all problems are collected (not fail-fast) to give useful
// install errors. Unknown extra fields are ignored; we validate what BigDeck
// consumes.
// ============================================================================

import type {
  LayoutExAmPmElement,
  LayoutExCarouselPageElement,
  LayoutExColorSpec,
  LayoutExCustomDateElement,
  LayoutExDateElement,
  LayoutExDayElement,
  LayoutExElement,
  LayoutExElementType,
  LayoutExFontSpec,
  LayoutExHoursElement,
  LayoutExLocationElement,
  LayoutExManifest,
  LayoutExMinutesElement,
  LayoutExParseResult,
  LayoutExPixmapItem,
  LayoutExRect,
  LayoutExShowOnAmPmElement,
  LayoutExShowOnClockTypeElement,
  LayoutExTemplate,
  LayoutExTemplateItem,
  LayoutExTextItem,
  LayoutExTheme,
} from "../../shared/types";

/** Every element type observed across all bundled layouts. */
const ELEMENT_TYPES: ReadonlySet<string> = new Set<LayoutExElementType>([
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
]);

/** Valid carousel `display` values (exhaustive over the survey). */
const CAROUSEL_DISPLAYS = new Set(["Icon", "Name", "Number"]);

/** Valid `show_on_am/pm` periods (exhaustive). */
const PERIODES = new Set(["AM", "PM"]);

/** Valid `show_on_clock_type` formats (exhaustive). */
const CLOCK_FORMATS = new Set(["Hour12", "Hour24"]);

/** Valid template item types (exhaustive over the survey). */
const ITEM_TYPES = new Set(["pixmap", "text"]);

/** Valid text `alignment` values (exhaustive). */
const ALIGNMENTS = new Set(["left", "center", "right"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * A color spec: plain hex, or an Elgato gradient string. The survey only ever
 * produced `#RRGGBB`, `h$…` and `d1$…` values, but the validator stays loose
 * (non-empty string) so future gradient dialects still import.
 */
function isColorSpec(value: unknown): value is LayoutExColorSpec {
  return nonEmptyString(value);
}

/** Validate a theme font token object. */
function parseFontSpec(value: unknown, label: string, errors: string[]): LayoutExFontSpec | null {
  if (!isPlainObject(value)) {
    errors.push(`${label}: expected an object`);
    return null;
  }
  let ok = true;
  if (!nonEmptyString(value.family)) {
    errors.push(`${label}.family: missing or empty`);
    ok = false;
  }
  if (!isFiniteNumber(value.size) || value.size <= 0) {
    errors.push(`${label}.size: expected a positive number`);
    ok = false;
  }
  if (!isFiniteNumber(value.weight)) {
    errors.push(`${label}.weight: expected a number`);
    ok = false;
  }
  if (typeof value.italic !== "boolean") {
    errors.push(`${label}.italic: expected a boolean`);
    ok = false;
  }
  if (!ok) return null;
  return {
    family: value.family as string,
    size: value.size as number,
    weight: value.weight as number,
    italic: value.italic as boolean,
  };
}

/** Validate one theme (token table). */
function parseTheme(value: unknown, index: number, errors: string[]): LayoutExTheme | null {
  const label = `themes[${index}]`;
  if (!isPlainObject(value)) {
    errors.push(`${label}: expected an object`);
    return null;
  }
  let ok = true;
  if (!nonEmptyString(value.id)) {
    errors.push(`${label}.id: missing or empty`);
    ok = false;
  }
  if (typeof value.primaryColor !== "string") {
    errors.push(`${label}.primaryColor: expected a string`);
    ok = false;
  }
  // secondaryColor is "" in at least one bundled theme (pagination_08 red) —
  // only require string-ness.
  if (typeof value.secondaryColor !== "string") {
    errors.push(`${label}.secondaryColor: expected a string`);
    ok = false;
  }

  const colors: Record<string, LayoutExColorSpec> = {};
  if (isPlainObject(value.colors)) {
    for (const [name, spec] of Object.entries(value.colors)) {
      if (isColorSpec(spec)) colors[name] = spec;
      else errors.push(`${label}.colors.${name}: expected a color string`);
    }
  } else {
    errors.push(`${label}.colors: expected an object`);
    ok = false;
  }

  const fonts: Record<string, LayoutExFontSpec> = {};
  if (isPlainObject(value.fonts)) {
    for (const [name, spec] of Object.entries(value.fonts)) {
      const font = parseFontSpec(spec, `${label}.fonts.${name}`, errors);
      if (font) fonts[name] = font;
    }
  } else {
    errors.push(`${label}.fonts: expected an object`);
    ok = false;
  }

  const images: Record<string, string> = {};
  if (value.images !== undefined) {
    if (isPlainObject(value.images)) {
      for (const [token, rel] of Object.entries(value.images)) {
        if (nonEmptyString(rel)) images[token] = rel;
        else errors.push(`${label}.images.${token}: expected a path string`);
      }
    } else {
      errors.push(`${label}.images: expected an object`);
      ok = false;
    }
  }

  if (!ok || !nonEmptyString(value.id)) return null;
  const theme: LayoutExTheme = {
    id: value.id,
    primaryColor: value.primaryColor as string,
    secondaryColor: value.secondaryColor as string,
    colors,
    fonts,
  };
  if (Object.keys(images).length > 0) theme.images = images;
  return theme;
}

/** Validate one data-binding element, enforcing its per-type fields. */
function parseElement(value: unknown, index: number, errors: string[]): LayoutExElement | null {
  const label = `elements[${index}]`;
  if (!isPlainObject(value)) {
    errors.push(`${label}: expected an object`);
    return null;
  }
  if (!nonEmptyString(value.key)) {
    errors.push(`${label}.key: missing or empty`);
    return null;
  }
  if (!nonEmptyString(value.type) || !ELEMENT_TYPES.has(value.type)) {
    errors.push(`${label}.type: unknown element type "${String(value.type)}"`);
    return null;
  }
  const key = value.key;
  const type = value.type as LayoutExElementType;
  const optBool = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);
  const optStr = (v: unknown): string | undefined => (nonEmptyString(v) ? v : undefined);
  const optNum = (v: unknown): number | undefined => (isFiniteNumber(v) ? v : undefined);

  switch (type) {
    case "hours": {
      const out: LayoutExHoursElement = { key, type };
      const sz = optBool(value.show_zero);
      if (sz !== undefined) out.show_zero = sz;
      return out;
    }
    case "minutes": {
      const out: LayoutExMinutesElement = { key, type };
      const sz = optBool(value.show_zero);
      if (sz !== undefined) out.show_zero = sz;
      return out;
    }
    case "colon": {
      const out: LayoutExElement = { key, type };
      const a = optBool(value.animated);
      if (a !== undefined) out.animated = a;
      return out;
    }
    case "am/pm": {
      const out: LayoutExAmPmElement = { key, type };
      const c = optBool(value.capitalize);
      if (c !== undefined) out.capitalize = c;
      return out;
    }
    case "day": {
      const out: LayoutExDayElement = { key, type };
      const dt = optStr(value.dateType);
      if (dt !== undefined) out.dateType = dt;
      const df = optStr(value.dateFormat);
      if (df !== undefined) out.dateFormat = df;
      return out;
    }
    case "date": {
      const out: LayoutExDateElement = { key, type };
      const df = optStr(value.dateFormat);
      if (df !== undefined) out.dateFormat = df;
      return out;
    }
    case "custom_date": {
      const out: LayoutExCustomDateElement = { key, type };
      const df = optStr(value.dateFormat);
      if (df !== undefined) out.dateFormat = df;
      return out;
    }
    case "location": {
      const out: LayoutExLocationElement = { key, type };
      return out;
    }
    case "carousel_page": {
      const out: LayoutExCarouselPageElement = { key, type };
      if (value.display !== undefined) {
        if (nonEmptyString(value.display) && CAROUSEL_DISPLAYS.has(value.display)) {
          out.display = value.display as "Icon" | "Name" | "Number";
        } else {
          errors.push(`${label}.display: unknown value "${String(value.display)}"`);
        }
      }
      const wrap = optStr(value.wrap);
      if (wrap !== undefined) out.wrap = wrap;
      const offset = optNum(value.offset);
      if (offset !== undefined) out.offset = offset;
      if (value.extend !== undefined) {
        if (
          Array.isArray(value.extend) &&
          value.extend.length === 2 &&
          isFiniteNumber(value.extend[0]) &&
          isFiniteNumber(value.extend[1])
        ) {
          out.extend = [value.extend[0], value.extend[1]];
        } else {
          errors.push(`${label}.extend: expected [number, number]`);
        }
      }
      return out;
    }
    case "show_on_am/pm": {
      const out: LayoutExShowOnAmPmElement = { key, type };
      if (value.periode !== undefined) {
        if (nonEmptyString(value.periode) && PERIODES.has(value.periode)) {
          out.periode = value.periode as "AM" | "PM";
        } else {
          errors.push(`${label}.periode: unknown value "${String(value.periode)}"`);
        }
      }
      return out;
    }
    case "show_on_clock_type": {
      const out: LayoutExShowOnClockTypeElement = { key, type };
      if (value.format !== undefined) {
        if (nonEmptyString(value.format) && CLOCK_FORMATS.has(value.format)) {
          out.format = value.format as "Hour12" | "Hour24";
        } else {
          errors.push(`${label}.format: unknown value "${String(value.format)}"`);
        }
      }
      return out;
    }
  }
}

/** Validate a rect: [x, y, w, h] finite numbers. */
function parseRect(value: unknown, label: string, errors: string[]): LayoutExRect | null {
  if (
    !Array.isArray(value) ||
    value.length !== 4 ||
    !value.every(isFiniteNumber)
  ) {
    errors.push(`${label}.rect: expected [x, y, width, height] numbers`);
    return null;
  }
  return [value[0], value[1], value[2], value[3]];
}

/** Validate one template item (pixmap or text) with its per-type fields. */
function parseItem(value: unknown, index: number, errors: string[]): LayoutExTemplateItem | null {
  const label = `template.items[${index}]`;
  if (!isPlainObject(value)) {
    errors.push(`${label}: expected an object`);
    return null;
  }
  if (!nonEmptyString(value.key)) {
    errors.push(`${label}.key: missing or empty`);
    return null;
  }
  if (!nonEmptyString(value.type) || !ITEM_TYPES.has(value.type)) {
    errors.push(`${label}.type: unknown item type "${String(value.type)}"`);
    return null;
  }
  const rect = parseRect(value.rect, label, errors);
  if (!rect) return null;

  const base = {
    key: value.key,
    rect,
    zOrder: isFiniteNumber(value.zOrder) ? value.zOrder : undefined,
    border_radius: isFiniteNumber(value.border_radius) ? value.border_radius : undefined,
  };
  const optStr = (v: unknown): string | undefined => (nonEmptyString(v) ? v : undefined);

  if (value.type === "pixmap") {
    const item: LayoutExPixmapItem = { ...base, type: "pixmap" };
    const bg = optStr(value.background);
    if (bg !== undefined) item.background = bg;
    const fill = optStr(value.fill_c);
    if (fill !== undefined) item.fill_c = fill;
    const val = optStr(value.value);
    if (val !== undefined) item.value = val;
    if (value.padding !== undefined) {
      if (Array.isArray(value.padding) && value.padding.length === 4 && value.padding.every(isFiniteNumber)) {
        item.padding = [value.padding[0], value.padding[1], value.padding[2], value.padding[3]];
      } else {
        errors.push(`${label}.padding: expected [number, number, number, number]`);
      }
    }
    return item;
  }

  const item: LayoutExTextItem = { ...base, type: "text" };
  const val = optStr(value.value);
  if (val !== undefined) item.value = val;
  const font = optStr(value.font);
  if (font !== undefined) item.font = font;
  const color = optStr(value.color);
  if (color !== undefined) item.color = color;
  const bg = optStr(value.background);
  if (bg !== undefined) item.background = bg;
  if (value.alignment !== undefined) {
    if (nonEmptyString(value.alignment) && ALIGNMENTS.has(value.alignment)) {
      item.alignment = value.alignment as "left" | "center" | "right";
    } else {
      errors.push(`${label}.alignment: unknown value "${String(value.alignment)}"`);
    }
  }
  const overflow = optStr(value["text-overflow"]);
  if (overflow !== undefined) item["text-overflow"] = overflow;
  const ow = isFiniteNumber(value.outline_w) ? value.outline_w : undefined;
  if (ow !== undefined) item.outline_w = ow;
  const oc = optStr(value.outline_c);
  if (oc !== undefined) item.outline_c = oc;
  if (typeof value.outline_only === "boolean") item.outline_only = value.outline_only;
  return item;
}

/**
 * Parse and validate a raw manifest.json payload, collecting every validation
 * problem into `errors`; `ok` is true only when none were found.
 */
export function parseLayoutExDetailed(raw: unknown): LayoutExParseResult {
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, manifest: null, errors: ["manifest.json: expected a JSON object"] };
  }

  // ---- themes[] ------------------------------------------------------------
  const themes: LayoutExTheme[] = [];
  if (raw.themes !== undefined) {
    if (!Array.isArray(raw.themes)) {
      errors.push("themes: expected an array");
    } else {
      raw.themes.forEach((t, i) => {
        const theme = parseTheme(t, i, errors);
        if (theme) themes.push(theme);
      });
    }
  } else {
    errors.push("themes: missing");
  }

  // ---- elements[] ------------------------------------------------------------
  const elements: LayoutExElement[] = [];
  if (raw.elements !== undefined) {
    if (!Array.isArray(raw.elements)) {
      errors.push("elements: expected an array");
    } else {
      raw.elements.forEach((e, i) => {
        const element = parseElement(e, i, errors);
        if (element) elements.push(element);
      });
    }
  } else {
    errors.push("elements: missing");
  }

  // ---- template --------------------------------------------------------------
  let template: LayoutExTemplate | null = null;
  if (isPlainObject(raw.template)) {
    const tplLabel = "template";
    let tplOk = true;
    if (!nonEmptyString(raw.template.id)) {
      errors.push(`${tplLabel}.id: missing or empty`);
      tplOk = false;
    }
    const items: LayoutExTemplateItem[] = [];
    if (!Array.isArray(raw.template.items)) {
      errors.push(`${tplLabel}.items: expected an array`);
      tplOk = false;
    } else {
      raw.template.items.forEach((it, i) => {
        const item = parseItem(it, i, errors);
        if (item) items.push(item);
      });
    }
    if (tplOk) {
      template = { id: raw.template.id as string, items };
    }
  } else {
    errors.push("template: expected an object");
  }

  if (errors.length > 0 || template === null) {
    return { ok: false, manifest: null, errors };
  }

  const manifest: LayoutExManifest = { themes, elements, template };
  return { ok: true, manifest, errors: [] };
}

/**
 * Parse a raw manifest payload, returning the manifest or null. Errors are
 * collected internally; use parseLayoutExDetailed() when the error list is
 * needed (install flows log it).
 */
export function parseLayoutEx(manifest: unknown): LayoutExManifest | null {
  return parseLayoutExDetailed(manifest).manifest;
}
