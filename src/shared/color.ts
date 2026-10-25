// ============================================================================
// BigDeck - Shared layer compositing math
//
// Pure functions used by BOTH the hardware renderer (src/main/actions/
// KeyRenderer.ts) and the UI preview (src/renderer/components/LayerStack.tsx).
// Keeping the math in one place is the contract: if the preview and the
// hardware disagree, the fix belongs here, not in one side's ad-hoc code.
// ============================================================================

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a hex color ("#rgb", "#rrggbb", with or without "#") to RGB.
 * Returns null for anything else — callers must treat null as "no color"
 * (feature off), never as black.
 */
export function parseHexColor(hex: string | undefined | null): Rgb | null {
  if (typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Format an Rgb as a normalized lowercase "#rrggbb" string. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Chroma-key match: per-channel RGB distance, ALL channels within tolerance.
 * Tolerance is inclusive (a difference of exactly `tolerance` still matches).
 */
export function isWithinTolerance(a: Rgb, b: Rgb, tolerance: number): boolean {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance
  );
}

/**
 * Sanitize a chroma-key tolerance coming from JSON profiles: non-finite or
 * negative values degrade to 0 (exact match).
 */
export function normalizeTolerance(tolerance: number | undefined): number {
  return typeof tolerance === "number" && Number.isFinite(tolerance)
    ? Math.max(0, tolerance)
    : 0;
}

/**
 * Sanitize a per-layer opacity coming from JSON profiles. Returns undefined
 * (= "render at full opacity", the shared default) for absent, non-finite or
 * >= 1 values; otherwise clamps to [0, 1). This matches how the preview's CSS
 * treats an invalid `opacity` (ignored → fully visible) and keeps NaN
 * profiles from silently producing invisible hardware layers.
 */
export function normalizeLayerOpacity(
  opacity: number | undefined,
): number | undefined {
  if (typeof opacity !== "number" || !Number.isFinite(opacity) || opacity >= 1) {
    return undefined;
  }
  return Math.max(0, opacity);
}

/** CSS linear-gradient default angle when a direction is absent/invalid. */
export const DEFAULT_GRADIENT_DIRECTION = 135;

/**
 * Sanitize a gradient direction coming from JSON profiles. 0 is a VALID CSS
 * angle (to top) but falsy — `||` fallbacks would silently turn it into 135.
 */
export function normalizeGradientDirection(
  direction: number | undefined,
): number {
  return typeof direction === "number" && Number.isFinite(direction)
    ? direction
    : DEFAULT_GRADIENT_DIRECTION;
}

/**
 * Gradient line endpoints for a CSS `linear-gradient(<dir>deg, A, B)` inside
 * a width×height box, in pixel coordinates. This is the exact CSS Images spec
 * geometry: the line passes through the center, runs along `<dir>` (0deg = to
 * top, 90deg = to right), and its endpoints land ON the box edges — so the
 * start/end colors are visible at the edges (unlike the previous SVG here,
 * whose endpoints overshot by a full width/height and washed the gradient
 * out to only its middle 50% band on hardware).
 *
 * Used by KeyRenderer.createGradientSvg (as SVG userSpaceOnUse coords) and by
 * the LayerStack preview canvas — identical numbers on both sides.
 */
export function cssGradientEndpoints(
  width: number,
  height: number,
  directionDeg: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const rad = (directionDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad); // screen y grows downward
  const length = Math.abs(width * dx) + Math.abs(height * dy);
  const cx = width / 2;
  const cy = height / 2;
  const half = length / 2;
  return {
    x1: cx - dx * half,
    y1: cy - dy * half,
    x2: cx + dx * half,
    y2: cy + dy * half,
  };
}
