# ADR-0003: Shader screensaver engine — GLSL fragment shaders on the deck

- **Status:** Proposed
- **Date:** 2026-10-25
- **Relates to:** ADR-0002 (screensaver profiles), DeviceManager animation lane, `fillPanel`

## Context

The owner wants to "go absolutely wild" with screensavers: **fragment
shaders** rendered onto the deck — a full-panel plasma/starfield/rain at real
framerates, or per-key shaders — with an easy way for users to use them
(presets, not GLSL homework).

The hardware write path makes this almost free:

- `DeviceManager`'s **animation lane** already implements latest-frame-wins
  per key with exact-time timers and stale-frame dropping — a 15–30 fps
  source can push frames without ever building a USB backlog.
- `@elgato-stream-deck/node` exposes **`fillPanel`** — one image across the
  whole deck — ideal for full-panel shaders (the keys' physical gaps are
  handled by the panel layout map).
- Electron gives us a GPU process out of the box: a hidden `BrowserWindow`
  with a WebGL context can render offscreen and hand pixels to the main
  process — no new native dependencies.

## Decision

A **ShaderSource** subsystem that renders GLSL fragment shaders into the
existing animation pipeline.

### Architecture

```
┌────────────────────────────┐   frames (RGBA Buffer, fps-capped)
│ Hidden BrowserWindow       │   ───────────────────────────────▶  DeviceManager
│ (offscreen, 1 per source)  │        IPC (transferable)           animation lane
│ WebGL fragment shader      │                                     └─ fillKeyBuffer (per-key)
│  uniforms: t, res, seed    │                                      └─ fillPanel   (full-panel)
└────────────────────────────┘
```

- **Renderer side:** a tiny shader host page (plain WebGL1, no frameworks).
  Fragment shader gets `uniform float u_time; uniform vec2 u_resolution;`
  (v2: `u_pointer` for SD+ LCD touch, `u_beat` from MPRIS playback).
  `gl.readPixels` → `IPC` send as raw RGBA + dimensions. requestAnimationFrame
  capped by a `--fps` (default 24, battery saver 12).
- **Main-process side:** `ShaderSourceManager`:
  - `start(source, mode)` — mode `panel` (one canvas sized to the device
    panel incl. key gaps, → `fillPanel`) or `key` (N canvases or one atlas,
    sliced → per-key animation lane).
  - Backpressure: if the animation lane drops frames, the manager lowers fps
    (it already knows — dropped frames are its own mechanism).
  - Lifecycle: starts when a screensaver profile with a shader source
    activates (ADR-0002), stops on exit; crashed renderer → fall back to the
    profile's static layers, log loudly.

### User-facing model ("easy for them")

- **Presets ship built-in:** `plasma`, `starfield`, `matrix rain`, `waves`,
  `lava lamp`, `fire` — a JSON manifest (shader source + default palette),
  selectable in the KeyEditor/screensaver editor like any layer type
  (`layer.type: "shader"` with a preset picker).
- **Custom shader:** an "Advanced" tab — paste GLSL, live-preview on a single
  key in the UI, "Apply to all keys" or "paint onto selected keys". Validation:
  compile in the hidden window first; compile errors surface in the editor.
- Performance guardrail: shader sources are marked high-cost; the editor
  warns when >1 shader source would run concurrently.

## Consequences

- The hidden window costs ~100 MB GPU/RAM while a shader screensaver runs —
  acceptable for an idle-time visual; document it, stop it aggressively on
  exit.
- Wayland/EGL quirks: if offscreen WebGL fails to init (headless/VM), fall
  back to ADR-0002's GIF/layer screensavers — never block screensaver on
  shaders.
- `fillPanel` needs the panel image in the device's native layout; the
  elgato-stream-deck lib already owns that mapping — reuse it, don't
  re-derive key rectangles.

## Alternatives considered

- Render shaders in the main process (headless-gl) — rejected: native build
  pain on Linux/Wayland, duplicates a GPU process Electron already has.
- Canvas2D generative art instead of GLSL — kept as a *preset authoring*
  option later, but GLSL is the capability the owner asked for and is strictly
  more expressive.
- Pre-rendered video loops — trivially supported today via GIF layers; not a
  substitute for time-based shaders.

## Phases

1. Spike: hidden window → plasma shader → `fillPanel` on the XL, 24 fps,
   measure dropped frames. (Kill criteria: if lane drop-rate > 50% at 12 fps,
   redesign panel mode to per-key strips.)
2. ShaderSourceManager + lifecycle + ADR-0002 integration.
3. Presets + editor UI (picker, live per-key preview).
4. Custom GLSL tab + import/export of shader layers inside shared profiles.
