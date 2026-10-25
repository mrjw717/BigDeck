# Changelog

All notable changes to BigDeck are documented here. Versions follow
[semver](https://semver.org/).

## [1.0.21] – 2026-06-18

### Fixed
- **Multi-layer compositing now renders all layers.** Replaced chained
  `sharp().composite()` calls with a single `composite(overlays)` call. This
  resolves the issue where only the topmost (SVG) layer was visible when a key
  had multiple layers (text + image + icon).
- **Missing asset files no longer crash the entire key render.** Each layer is
  rendered independently inside `renderLayerToBuffer()` with its own
  `try/catch`. A missing or corrupt asset skips that one layer; all other
  layers on the key continue to render normally.
- **Text layers render reliably on hardware.** Replaced `<tspan>` elements in
  the generated text SVG with separate `<text>` elements per wrapped line.
  librsvg (used by sharp) has inconsistent `<tspan>` support across Linux
  distributions, which caused text to render as blank on some setups.
- **Pressed-state race condition eliminated.** Replaced the per-key sequence
  counter with a pre-rendered image cache populated at profile load. Key-down
  and key-up now read from the cache with zero render latency.
- **SVG assets stored with correct layer type.** Uploaded SVG files now use
  `type: "image"` (not `type: "icon"`), so they resolve through
  `resolveAssetPath()` instead of the built-in icon path builder.
- **Missing `Eye` import in KeyEditor** no longer crashes the Appearance tab.

### Added
- **Pre-rendered image cache** (`keyImageCache`) in the main process. Idle
  state is rendered at profile load; pressed state is lazily rendered on first
  press via `ensurePressedCached()`.
- **GIF frame-delay extraction.** `KeyRenderer.getAnimationDelays()` reads
  per-frame delays from animated GIFs via sharp metadata and exposes them over
  the `ACTION_ANIMATION_DELAYS` IPC channel. `DeviceManager.setKeyImage`
  accepts a `delays` array as its 5th parameter.
- **Comprehensive rendering diagnostics.** `KeyRenderer` now logs every layer's
  type, order, source, and visibility at `INFO` level, plus buffer sizes and
  any per-layer errors. See `docs/LAYER_RENDERING.md` §5.1.
- **Drag-and-drop swap logic.** Dragging a key onto another key now swaps
  configurations when both have content (no data loss), moves when the target
  is empty, and is a no-op when the source is empty.
- **`ErrorBoundary`** wraps the renderer to prevent black-screen crashes.

### Documentation
- Added `docs/LAYER_RENDERING.md` — full architecture reference for the layer
  rendering pipeline, pressed-state cache, common pitfalls, and debugging.

## [1.0.20] – 2026-06-10

### Known Issues
- Multi-layer keys only showed the topmost SVG layer (fixed in 1.0.21).
- Missing asset files crashed the full key render (fixed in 1.0.21).
