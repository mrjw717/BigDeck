// ============================================================================
// BigDeck - Renderer asset URL resolution
// Shared by KeyImage and AssetImage: turns a stored layer/image source into a
// URL the renderer can stream directly over the `bigdeck-asset://` protocol
// (registered in src/main/index.ts with streaming + MIME sniffing, so
// animated GIF/WebP play natively without IPC base64 roundtrips).
// ============================================================================

const ASSET_SCHEME = "bigdeck-asset://";

/**
 * Resolve an asset reference to a streamable URL.
 *
 * IMPORTANT — the payload must ride in the QUERY string, never in the URL
 * host: `bigdeck-asset` is registered as a standard scheme, and Chromium
 * canonicalizes standard-scheme hosts by LOWERCASING them (and percent-
 * re-encoding disallowed characters). Host-form URLs therefore destroyed the
 * case of multi-case filenames — e.g. the stored source
 * `bigdeck-asset://Animation Waving GIF....gif` requested
 * `animation waving gif....gif` from disk and 404'd, so animated GIFs never
 * displayed in the UI preview while the hardware pipeline (which reads the
 * file directly, no URL involved) played them fine. Query strings are
 * canonicalization-transparent: case and %XX escapes round-trip exactly.
 *
 * Forms handled:
 * - `bigdeck-asset://<encoded-name>`  legacy stored host form — re-emitted as
 *   `?p=` query form (the encoded tail is reused as-is).
 * - `/absolute/path`                  drag-dropped external file — encoded
 *   into `?p=`; the protocol handler serves absolute paths as-is.
 * - http(s)/data URLs                 passed through untouched.
 */
export function resolveAssetUrl(src: string): string {
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }
  if (src.startsWith(ASSET_SCHEME)) {
    // Tail is already a single encoded component (encodeURIComponent was
    // applied when the source was stored); reuse it as the query value.
    return `${ASSET_SCHEME}local/?p=${src.slice(ASSET_SCHEME.length)}`;
  }
  if (src.startsWith("/")) {
    return `${ASSET_SCHEME}local/?p=${encodeURIComponent(src)}`;
  }
  return src;
}
