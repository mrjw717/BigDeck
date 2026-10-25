# BigDeck – Layer Rendering Architecture

This document describes how key images are rendered from layers and pushed to the
Stream Deck hardware. It covers the data model, the rendering pipeline, the
pressed-state cache, common pitfalls, and how to debug rendering issues.

---

## 1. Data Model

A `KeyConfig` carries two parallel appearance systems:

| Field              | Purpose                                              | When used                       |
|--------------------|------------------------------------------------------|---------------------------------|
| `keyConfig.layers`     | Modern ordered layer list (background, image, icon, text) | Whenever `layers.length > 0`    |
| `keyConfig.pressedLayers` | Alternate layer list shown while the key is held    | Only if `syncPressedState === false` |
| `keyConfig.image`      | Legacy single-image appearance (pre-layer system)    | Fallback when `layers` is empty |

`renderKeyImage()` always prefers `layers` over `image`. Mixing the two is not
supported — if both are set, `layers` wins and `image` is ignored.

### Layer types

```ts
type KeyLayer = {
  id: string;
  type: "background" | "image" | "icon" | "text";
  order: number;           // lower = rendered first (bottom)
  visible: boolean;
  opacity?: number;        // 0..1, default 1
  source?: string;         // for image/icon: bigdeck-asset://, file path, or icon name
  text?: string;           // for text layers
  textColor?: string;
  fontSize?: number;
  fit?: "contain" | "cover" | "fill";
  // background-only
  backgroundColor?: string;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundGradientDirection?: number;  // degrees, default 135
};
```

**Ordering rule:** Layers are sorted ascending by `order`. The lowest `order`
is rendered at the bottom of the stack; the highest is rendered on top.

---

## 2. Rendering Pipeline

All rendering happens in the **main process** inside `KeyRenderer.ts`.
The renderer process never touches sharp directly — it sends a `KeyConfig`
over IPC and receives a raw RGB buffer back.

```
UI / profile load
      │
      ▼
ActionEngine.renderKeyImage(keyConfig, deviceType, pressed)
      │
      ▼
KeyRenderer.renderKeyImage()
      │
      ├── if layers.length > 0  ──► renderWithLayers()
      │                                    │
      │                                    ├── 1. Build background image
      │                                    ├── 2. Render each layer → Buffer
      │                                    ├── 3. Composite all layers (single call)
      │                                    └── 4. Finalize: flatten + raw RGB
      │
      └── else  ──► renderLegacy()   (single-image path)
```

### 2.1 Background creation

Before any layers are composited, a fully-opaque background image is created:

- **Solid color:** `sharp({ create: { width, height, channels: 4, background } })`
- **Gradient:** An inline SVG with a `<linearGradient>` is rendered via sharp.

The background colour is also reused as the `flatten` background in the finalize
step, so any remaining alpha is blended against the same colour.

### 2.2 Per-layer rendering (`renderLayerToBuffer`)

Each visible, non-background layer is converted to a standalone PNG buffer with
alpha. This is intentionally decoupled from compositing so that:

1. A single failing layer (missing file, corrupt SVG) **does not** abort the
   entire key render — it is skipped and the remaining layers still appear.
2. Buffers can be collected into a single `composite()` call (see §2.3).

| Layer type | Render path                                                       |
|------------|-------------------------------------------------------------------|
| `text`     | Inline SVG `<text>` elements → `sharp(svg).ensureAlpha().png()`   |
| `icon`     | Read `{userDataPath}/icons/{source}.svg` → `sharp(svgContent)`    |
| `image`    | `resolveAssetPath(source)` → `sharp(path)` (with GIF frame index) |
| `background` | **Skipped here** — already baked into the base image             |

**Text SVG format note:** BigDeck uses separate `<text>` elements per wrapped
line rather than `<tspan>`. librsvg (used by sharp) has inconsistent `<tspan>`
support across distributions; separate `<text>` elements render reliably.

**GIF/WebP animation:** When an image layer's metadata reports `pages > 1`,
`renderLayerToBuffer` is called once per frame with a `frameIdx`. Sharp's
`page` option selects the frame: `sharp(raw, { page: frameIdx })`.

### 2.3 Compositing

All layer buffers are composited onto the background in a **single** call:

```ts
const overlays = sortedLayers
  .filter(l => l.type !== "background")
  .map(l => ({ input: renderLayerToBuffer(l, frameIdx) }))
  .filter(o => o.input !== null);

const result = backgroundImage.composite(overlays);
```

A single `composite()` call is used instead of chaining
`base.composite(...).composite(...)` because:

- It avoids subtle ordering/alpha differences between chained and single-call
  compositing in sharp 0.35.
- It is easier to reason about: each overlay is applied to the same base in the
  order it appears in the array.

### 2.4 Finalize

```ts
const { data, info } = await img
  .flatten({ background: baseBackground })   // blend remaining alpha
  .resize(width, height, { fit: "contain", background: baseBackground })
  .raw()
  .toBuffer({ resolveWithObject: true });

return info.channels === 4
  ? convertToRgb(data, width, height)        // strip alpha → 3-channel RGB
  : data;
```

Sharp 0.35's `flatten()` blends alpha into RGB but **keeps** the 4th channel,
so `convertToRgb` strips it to produce the 3-channel raw RGB that
`device.deck.fillKeyBuffer(keyIndex, buf, { format: "rgb" })` expects.

---

## 3. Pressed-State Cache

Rendering a multi-layer key (especially with an animated GIF) can take hundreds
of milliseconds. To keep key-down latency imperceptible, rendered images are
cached in the main process:

```
keyImageCache: Map<keyId, { idle: Buffer | Buffer[]; pressed: Buffer | Buffer[] }>
```

| Event       | Action                                                              |
|-------------|---------------------------------------------------------------------|
| Profile load | `applyProfileToDevice` pre-renders the **idle** state for every key and populates the cache. The pressed entry is initialised to idle. |
| `key:down`  | The cached `pressed` image is written fire-and-forget. Then `ensurePressedCached()` runs in the background to lazily render the *real* pressed state for the *next* press. |
| `key:up`    | The cached `idle` image is written fire-and-forget.                  |

Because the first press of a key uses the idle image as its pressed state, there
is zero render latency. The second press onward uses the true pressed render.

---

## 4. Common Pitfalls & Fixes

### 4.1 Missing asset file crashes the whole key

**Symptom:** Key renders blank or shows only some layers; log shows
`Input file is missing: …/assets/<file>.png`.

**Cause:** `sharp(path).metadata()` throws when the file does not exist. If the
throw escaped `renderWithLayers`, the entire key render aborted and the cache
was never updated.

**Fix:** `renderLayerToBuffer` wraps every layer in a `try/catch` that returns
`null`. Null overlays are filtered out before compositing, so one missing file
only skips that one layer.

### 4.2 Chained `.composite()` discrepancies

**Symptom:** Single-layer keys render fine, but multi-layer keys show only the
topmost layer.

**Cause:** Sharp's chained `base.composite([a]).composite([b])` and single-call
`base.composite([a, b])` produce slightly different alpha-blended results. In
some edge cases (semi-transparent overlays, GIF frames) the chained form can
drop intermediate layers.

**Fix:** Always use a single `composite()` call with the full overlay array.

### 4.3 Text not rendering on hardware

**Symptom:** Text appears in the UI preview but not on the Stream Deck.

**Cause:** librsvg's `<tspan>` handling is unreliable. Multi-line text built
with `<tspan x="..." y="...">` may render as blank on some systems.

**Fix:** Emit one `<text>` element per wrapped line, each with its own `y`
coordinate and `text-anchor="middle"`.

### 4.4 SVG assets stored as `type: "icon"`

**Symptom:** Uploaded SVG (stored as `bigdeck-asset://…`) does not render.

**Cause:** The `icon` composite path builds the path
`{userDataPath}/icons/{source}.svg`, which is only valid for built-in icon
names. User-uploaded SVGs must use `type: "image"`.

**Fix:** `addLayerFromAsset` (KeyEditor) and `handleDrop` (LayerEditor) both
create layers with `type: "image"` for any uploaded file, including SVGs.

### 4.5 Animation delays ignored

**Symptom:** GIF animates but at a fixed 100 ms/frame regardless of source.

**Cause:** `DeviceManager.setKeyImage` needs a `delays` array to match frame
timing. Without it, every frame uses the default 100 ms.

**Fix:** `KeyRenderer.getAnimationDelays()` reads `metadata.delay` from the
GIF via sharp and returns the longest delay array across all image layers. The
IPC channel `ACTION_ANIMATION_DELAYS` exposes this to the renderer, and
`setKeyImage` accepts `delays` as its 5th parameter.

---

## 5. Debugging Rendering Issues

### 5.1 Enable verbose logging

`KeyRenderer` logs every layer at `INFO` level. Tail the log file:

```bash
tail -f ~/.config/bigdeck/bigdeck/logs/bigdeck.log | grep -E "renderWithLayers|renderLayerToBuffer"
```

Example output for a healthy multi-layer key:

```
[renderWithLayers] keyIndex=0 layers=4 sorted=text(order=0,visible=true),image(order=1,visible=true),image(order=2,visible=true),background(order=3,visible=true)
[renderWithLayers] baseBackground=#000000 gradient=none
[renderWithLayers] maxFrames=121
[renderWithLayers] Starting composite (single call, 4 layers)
[renderLayerToBuffer] image metadata: format=gif pages=121
```

### 5.2 Inspect the rendered output

Temporarily write the finalized buffer to disk to inspect it:

```ts
// In finalize(), before returning:
fs.writeFileSync(`/tmp/key-${keyConfig.keyIndex}-frame${frameIdx}.raw`, data);
```

Then convert to PNG for viewing:

```bash
ffmpeg -f rawvideo -pixel_format rgb24 -video_size 72x72 -i /tmp/key-0.raw /tmp/key-0.png
```

### 5.3 Verify asset files exist

```bash
ls -la ~/.config/bigdeck/assets/
```

If a file referenced by a layer is missing, the log will show
`[renderLayerToBuffer] failed for image: Error: Input file is missing: …` at
`ERROR` level, but the key will still render its other layers.

---

## 6. File Reference

| File                                         | Responsibility                                              |
|----------------------------------------------|------------------------------------------------------------|
| `src/main/actions/KeyRenderer.ts`            | Layer compositing pipeline, text/icon/image rendering       |
| `src/main/actions/ActionEngine.ts`           | Thin facade over `KeyRenderer` exposed via IPC             |
| `src/main/device/DeviceManager.ts`           | Hardware I/O, animation intervals, `fillKeyBuffer`         |
| `src/main/index.ts`                          | IPC handlers, `keyImageCache`, `applyProfileToDevice`      |
| `src/preload/preload.ts`                     | IPC bridge: `renderKeyImage`, `setKeyImage`, `getAnimationDelays` |
| `src/shared/constants.ts`                    | `DEVICE_SPECS`, IPC channel names                          |
| `src/shared/types.ts`                        | `KeyConfig`, `KeyLayer`, `DeviceType`                      |
| `src/renderer/components/KeyEditor.tsx`      | Appearance tab, layer add/reorder, `pushKeyToHardware`     |
| `src/renderer/components/LayerEditor.tsx`    | Per-layer property editing, drag-drop asset import         |
| `src/renderer/components/StreamdeckView.tsx` | Grid UI, drag-end swap/move logic, key clear               |
