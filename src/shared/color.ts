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
