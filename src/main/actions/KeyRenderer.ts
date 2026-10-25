// ============================================================================
// BigDeck - Key Renderer
// Renders key images for Stream Deck devices using sharp
//
// Performance notes (verified against sharp 0.35 / libvips):
// - Animated GIF/WebP frames are decoded in ONE pass via `animated: true`
//   ("toilet-roll" image), then sliced per frame. This is ~14x faster than
//   per-page `sharp(src, { page: f })` extraction, which re-decodes from
//   frame 0 every call (O(N^2)).
// - Frame counts are capped (MAX_ANIMATION_FRAMES) with time-preserving
//   sampling, and delays are coalesced to the hardware tick resolution.
// - Rendered layer frames are cached on disk-mtime so re-renders of
//   unchanged animated layers are effectively free.
// ============================================================================

import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { DEVICE_SPECS } from "../../shared/constants";
import type {
  KeyConfig,
  DeviceType,
  KeyLayer,
  MediaPlayerInfo,
} from "../../shared/types";
import {
  cssGradientEndpoints,
  normalizeGradientDirection,
  normalizeLayerOpacity,
  parseHexColor,
  rgbToHex,
} from "../../shared/color";
import type { Logger } from "../utils/Logger";
import { applyTextTokens } from "./textTokens";

/** Hard cap on animation frames sent to a device (time is preserved via delay scaling). */
const MAX_ANIMATION_FRAMES = 60;
/** Minimum per-frame delay the hardware pipeline can faithfully play (matches DeviceManager tick). */
const MIN_FRAME_DELAY_MS = 50;
/** Default delay when an animation provides none. */
const DEFAULT_FRAME_DELAY_MS = 100;
/** Max entries in the layer frame cache (LRU-ish, insertion order eviction). */
const FRAME_CACHE_LIMIT = 40;

export interface RenderedKey {
  image: Buffer | Buffer[];
  /** Per-frame delays in ms when `image` is an animation; aligned 1:1 with frames. */
  delays?: number[];
}

interface AnimationData {
  /** PNG buffers (with alpha), one per sampled frame, each width x height. */
  frames: Buffer[];
  /** Sampled per-frame delays in ms, aligned with `frames`. */
  delays: number[];
}

interface LayerRender {
  frames: Buffer[];
  delays: number[];
  animated: boolean;
}

export class KeyRenderer {
  private logger: Logger;
  private userDataPath: string;
  /** Cache of fully-rendered layer frames keyed by content+params+mtime. */
  private frameCache = new Map<string, LayerRender>();

  constructor(logger: Logger, userDataPath: string) {
    this.logger = logger;
    this.userDataPath = userDataPath;
  }

  async renderKeyImage(
    keyConfig: KeyConfig,
    deviceType: DeviceType = "original",
    pressed: boolean = false,
  ): Promise<Buffer | Buffer[]> {
    return (await this.renderKeyImageEx(keyConfig, deviceType, pressed)).image;
  }

  /**
   * Render a key and return the image plus aligned animation delays.
   * Prefer this over calling getAnimationDelays() separately — delays always
   * match the returned frames.
   */
  async renderKeyImageEx(
    keyConfig: KeyConfig,
    deviceType: DeviceType = "original",
    pressed: boolean = false,
  ): Promise<RenderedKey> {
    const specs = DEVICE_SPECS[deviceType];
    const width = specs.keyWidth;
    const height = specs.keyHeight;
    const layers = keyConfig.layers || [];
    const pressedLayers = keyConfig.pressedLayers || [];
    const img = keyConfig.image;

    const useLayers = layers.length > 0;

    if (useLayers) {
      const isSynced = keyConfig.syncPressedState !== false;
      const usePressedLayers = pressed && !isSynced && pressedLayers.length > 0;
      const targetLayers = usePressedLayers ? pressedLayers : layers;
      return this.renderWithLayers(keyConfig, targetLayers, width, height);
    }

    return this.renderLegacy(keyConfig, width, height, pressed, img);
  }

  // --------------------------------------------------------------------------
  // Layer-based rendering
  // --------------------------------------------------------------------------

  private async renderWithLayers(
    _keyConfig: KeyConfig,
    targetLayers: KeyLayer[],
    width: number,
    height: number,
  ): Promise<RenderedKey> {
    const sortedLayers = [...targetLayers]
      .filter((l) => l.visible)
      .sort((a, b) => a.order - b.order);

    // --- Flatten base = the device-off backdrop (black) ---
    // The background COLOR/GRADIENT is painted exclusively by the background
    // layer's overlay (renderBackgroundLayer), which honors that layer's
    // opacity and chroma-key. Flattening onto black — the same backdrop the
    // LayerStack preview paints under its layer divs — is what lets a
    // semi-transparent or knocked-out background composite honestly instead
    // of being double-painted at full opacity by the flatten step.
    let baseBackground = "#000000";

    const bgLayer = sortedLayers.find((l) => l.type === "background");

    // --- Render every layer (cached; animated layers pre-rendered per frame) ---
    const layerRenders: LayerRender[] = [];
    let bgOverlayRendered = false;
    for (const layer of sortedLayers) {
      try {
        const render = await this.renderLayer(layer, width, height);
        if (render) {
          layerRenders.push(render);
          if (layer.type === "background") bgOverlayRendered = true;
        }
      } catch (err) {
        this.logger.error(`[renderWithLayers] failed for ${layer.type}: ${err}`);
      }
    }

    // Degrade gracefully: if the background layer FAILED to render (bad hex,
    // unreadable profile value, …), fall back to painting its solid color as
    // the flatten base so the key isn't pure black. The color is validated —
    // the failure may BE the invalid color, and an invalid flatten background
    // would throw and kill the whole key render.
    if (
      bgLayer &&
      !bgOverlayRendered &&
      !(bgLayer.backgroundGradientStart && bgLayer.backgroundGradientEnd)
    ) {
      const fallback = parseHexColor(bgLayer.backgroundColor);
      if (fallback) {
        baseBackground = rgbToHex(fallback);
      }
    }

    // Frame count = longest animation; shorter animations LOOP (modulo).
    let maxFrames = 1;
    let delays: number[] | undefined;
    for (const r of layerRenders) {
      if (r.animated && r.frames.length > maxFrames) {
        maxFrames = r.frames.length;
        delays = r.delays;
      }
    }

    // --- Composite one output frame ---
    const transparentBase = {
      create: { width, height, channels: 4 as const, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    };

    const renderSingleFrame = async (frameIdx: number): Promise<Buffer> => {
      const overlays: Array<{ input: Buffer; blend: "over" }> = [];
      for (const r of layerRenders) {
        const buf = r.animated
          ? r.frames[frameIdx % r.frames.length]
          : r.frames[0];
        if (buf) overlays.push({ input: buf, blend: "over" });
      }

      const composite = overlays.length > 0
        ? sharp(transparentBase).composite(overlays)
        : sharp(transparentBase);

      const { data, info } = await composite
        .flatten({ background: baseBackground })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Hardware expects raw RGB (3 bytes per pixel)
      if (info.channels === 4) {
        return this.stripAlpha(data, width, height);
      }
      return Buffer.from(data);
    };

    if (maxFrames <= 1) {
      return { image: await renderSingleFrame(0) };
    }

    const buffers: Buffer[] = [];
    for (let f = 0; f < maxFrames; f++) {
      buffers.push(await renderSingleFrame(f));
    }
    return { image: buffers, delays };
  }

  /**
   * Render any layer type to PNG frame buffer(s), using the frame cache.
   */
  private async renderLayer(
    layer: KeyLayer,
    width: number,
    height: number,
  ): Promise<LayerRender | null> {
    const cacheKey = await this.layerCacheKey(layer, width, height);
    if (cacheKey) {
      const cached = this.frameCache.get(cacheKey);
      if (cached) {
        // Refresh recency (LRU touch)
        this.frameCache.delete(cacheKey);
        this.frameCache.set(cacheKey, cached);
        return cached;
      }
    }

    let render: LayerRender | null = null;

    if (layer.type === "background") {
      const buf = await this.renderBackgroundLayer(layer, width, height);
      if (buf) render = { frames: [buf], delays: [], animated: false };
    } else if (layer.type === "image" && layer.source) {
      const anim = await this.extractAnimationFrames(
        layer.source,
        width,
        height,
        layer.fit || "contain",
        layer.opacity,
      );
      if (anim) {
        render = { frames: anim.frames, delays: anim.delays, animated: true };
      } else {
        const buf = await this.renderImageLayer(layer, width, height);
        if (buf) render = { frames: [buf], delays: [], animated: false };
      }
    } else {
      const buf = await this.renderLayerBuffer(layer, width, height);
      if (buf) render = { frames: [buf], delays: [], animated: false };
    }

    if (render && cacheKey) {
      this.frameCache.set(cacheKey, render);
      while (this.frameCache.size > FRAME_CACHE_LIMIT) {
        const oldest = this.frameCache.keys().next().value;
        if (oldest === undefined) break;
        this.frameCache.delete(oldest);
      }
    }

    return render;
  }

  /**
   * Cache key capturing layer params + source file mtime/size.
   * Returns null for layers that shouldn't be cached.
   */
  private async layerCacheKey(
    layer: KeyLayer,
    width: number,
    height: number,
  ): Promise<string | null> {
    const base = `${width}x${height}:${layer.opacity ?? 1}`;
    try {
      if (layer.type === "image" && layer.source) {
        const resolved = this.resolveAssetPath(layer.source);
        if (Buffer.isBuffer(resolved)) return null;
        if (/^https?:\/\//.test(resolved)) return null;
        const st = await fs.stat(resolved);
        return `img:${resolved}:${base}:${layer.fit || "contain"}:${st.mtimeMs}:${st.size}`;
      }
      if (layer.type === "icon" && layer.source) {
        return `icon:${layer.source}:${base}`;
      }
      if (layer.type === "text" && layer.text) {
        // Date/time tokens ({date}/{time}/{weekday}) resolve to the CURRENT
        // moment here so the cache key rolls over at midnight instead of
        // serving yesterday's rendered frame.
        return `text:${applyTextTokens(layer.text)}:${layer.textColor || ""}:${layer.fontSize || 14}:${base}`;
      }
      if (layer.type === "background") {
        return `bg:${layer.backgroundColor || ""}:${layer.backgroundGradientStart || ""}:${layer.backgroundGradientEnd || ""}:${normalizeGradientDirection(layer.backgroundGradientDirection)}:${base}`;
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Render a background layer to a full-bleed RGBA PNG frame.
   *
   * Shared semantics with the LayerStack preview (LayerStack.tsx): the layer
   * paints gradient (start+end set) or solid backgroundColor full-bleed, and
   * per-layer `opacity` multiplies alpha — semi-transparent backgrounds blend
   * over the black device-off backdrop (renderWithLayers flatten base),
   * exactly like the preview's opacity-styled div over its black host.
   */
  private async renderBackgroundLayer(
    layer: KeyLayer,
    width: number,
    height: number,
  ): Promise<Buffer | null> {
    try {
      let buf: Buffer;
      if (layer.backgroundGradientStart && layer.backgroundGradientEnd) {
        const gradientSvg = this.createGradientSvg(
          width,
          height,
          layer.backgroundGradientStart,
          layer.backgroundGradientEnd,
          layer.backgroundGradientDirection,
        );
        buf = await sharp(Buffer.from(gradientSvg))
          .resize(width, height, { fit: "fill" })
          .ensureAlpha()
          .png()
          .toBuffer();
      } else {
        buf = await sharp({
          create: {
            width,
            height,
            channels: 4,
            background: layer.backgroundColor || "#000000",
          },
        })
          .png()
          .toBuffer();
      }
      return await this.applyOpacity(buf, normalizeLayerOpacity(layer.opacity));
    } catch (err) {
      this.logger.warn(`[renderBackgroundLayer] failed for layer ${layer.id}: ${err}`);
      return null;
    }
  }

  /**
   * Decode an animated GIF/WebP in ONE pass and return per-frame PNG buffers
   * plus aligned delays, sampled to the frame budget. Returns null for
   * non-animated or unreadable sources.
   */
  private async extractAnimationFrames(
    source: string,
    width: number,
    height: number,
    fit: keyof sharp.FitEnum,
    opacity?: number,
  ): Promise<AnimationData | null> {
    try {
      const resolved = this.resolveAssetPath(source);
      if (Buffer.isBuffer(resolved)) return null;
      if (/^https?:\/\//.test(resolved)) return null;

      const raw = await fs.readFile(resolved);
      const meta = await sharp(raw).metadata();
      const isAnimated =
        (meta.format === "gif" || meta.format === "webp") &&
        (meta.pages || 1) > 1;
      if (!isAnimated) return null;

      const totalFrames = meta.pages || 1;
      const normDelays = this.normalizeDelays(meta.delay, totalFrames);
      const { indices, delays } = this.sampleTimeline(
        normDelays,
        MAX_ANIMATION_FRAMES,
        MIN_FRAME_DELAY_MS,
      );

      // One-pass decode of ALL frames ("toilet-roll"), resized per frame.
      const roll = await sharp(raw, { animated: true })
        .resize(width, height, {
          fit,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const frameBytes = width * height * 4;
      const decodedFrames = Math.floor(roll.data.length / frameBytes);
      if (decodedFrames === 0) return null;

      // Per-frame opacity: normalizeLayerOpacity makes non-finite profile
      // values degrade to full opacity instead of silently zeroing alpha.
      const op = normalizeLayerOpacity(opacity);
      const frames: Buffer[] = [];
      for (const idx of indices) {
        const f = Math.min(idx, decodedFrames - 1);
        let frameRaw = roll.data.subarray(f * frameBytes, (f + 1) * frameBytes);
        if (op !== undefined) {
          frameRaw = this.applyOpacityRaw(frameRaw, op);
        }
        frames.push(
          await sharp(frameRaw, {
            raw: { width, height, channels: 4 },
          })
            .png()
            .toBuffer(),
        );
      }

      return { frames, delays };
    } catch (err) {
      this.logger.warn(`[extractAnimationFrames] failed for ${source}: ${err}`);
      return null;
    }
  }

  /**
   * Fill out/shorten a delay array to exactly `count` entries (ms).
   */
  private normalizeDelays(delay: number[] | undefined, count: number): number[] {
    const out = new Array<number>(count);
    for (let i = 0; i < count; i++) {
      const d = delay?.[i];
      out[i] = typeof d === "number" && d > 0 ? d : DEFAULT_FRAME_DELAY_MS;
    }
    return out;
  }

  /**
   * Time-preserving frame sampling:
   * 1. Coalesce sub-`minDelay` frames so every emitted delay is playable.
   * 2. If still over `maxFrames`, stride-sample and scale delays so the
   *    total loop duration is unchanged.
   */
  private sampleTimeline(
    delays: number[],
    maxFrames: number,
    minDelay: number,
  ): { indices: number[]; delays: number[] } {
    // Pass 1: coalesce fast frames
    const indices: number[] = [];
    const coalesced: number[] = [];
    let acc = 0;
    for (let i = 0; i < delays.length; i++) {
      acc += delays[i];
      if (acc >= minDelay) {
        indices.push(i);
        coalesced.push(acc);
        acc = 0;
      }
    }
    if (indices.length === 0) {
      indices.push(0);
      coalesced.push(Math.max(acc, minDelay));
    } else if (acc > 0) {
      // Fold the tail remainder into the last emitted frame's delay
      coalesced[coalesced.length - 1] += acc;
    }

    // Pass 2: cap frame count, preserving total duration
    if (indices.length <= maxFrames) {
      return { indices, delays: coalesced };
    }
    const step = indices.length / maxFrames;
    const outIdx: number[] = [];
    const outDelays: number[] = [];
    for (let i = 0; i < maxFrames; i++) {
      const src = Math.min(Math.floor(i * step), indices.length - 1);
      outIdx.push(indices[src]);
      outDelays.push(Math.round(coalesced[src] * step));
    }
    return { indices: outIdx, delays: outDelays };
  }

  /**
   * Render a single static layer to a PNG buffer with alpha.
   * Handles text, icon (SVG), and static image layers.
   * Returns null if the layer cannot be rendered.
   */
  private async renderLayerBuffer(
    layer: KeyLayer,
    width: number,
    height: number,
  ): Promise<Buffer | null> {
    try {
      if (layer.type === "text" && layer.text) {
        return await this.renderTextLayer(
          { ...layer, text: applyTextTokens(layer.text) },
          width,
          height,
        );
      }

      if ((layer.type === "image" || layer.type === "icon") && layer.source) {
        let layerImage: sharp.Sharp | null = null;

        if (layer.type === "icon") {
          const iconPath = path.join(this.userDataPath, "icons", `${layer.source}.svg`);
          try {
            const svgContent = await fs.readFile(iconPath, "utf-8");
            // Set density to render SVG at target resolution — prevents tiny/blurry SVGs
            layerImage = sharp(Buffer.from(svgContent), { density: 300 });
          } catch {
            try {
              const resolved = this.resolveAssetPath(layer.source);
              layerImage = sharp(resolved, { density: 300 });
            } catch {
              return null;
            }
          }
        } else {
          const resolved = this.resolveAssetPath(layer.source);
          if (Buffer.isBuffer(resolved)) {
            layerImage = sharp(resolved);
          } else {
            // Check if it's an SVG file — needs density setting
            const isSvg = resolved.toLowerCase().endsWith(".svg");
            layerImage = isSvg
              ? sharp(resolved, { density: 300 })
              : sharp(resolved);
          }
        }

        if (!layerImage) return null;
        const fit = layer.fit || "contain";
        const buf = await layerImage
          .resize(width, height, {
            fit,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .ensureAlpha()
          .png()
          .toBuffer();

        return await this.applyOpacity(buf, normalizeLayerOpacity(layer.opacity));
      }

      return null;
    } catch (err) {
      this.logger.error(`[renderLayerBuffer] failed for ${layer.type}: ${err}`);
      return null;
    }
  }

  /** Static image layer (non-animated). */
  private async renderImageLayer(
    layer: KeyLayer,
    width: number,
    height: number,
  ): Promise<Buffer | null> {
    return this.renderLayerBuffer(layer, width, height);
  }

  /**
   * Render a text layer to a PNG buffer with alpha.
   * Uses separate <text> elements per line for librsvg compatibility.
   */
  private async renderTextLayer(
    layer: KeyLayer,
    width: number,
    height: number,
  ): Promise<Buffer | null> {
    // Sanitize profile values: NaN/0/negative font sizes from JSON profiles
    // previously produced a corrupt SVG (y="NaN") that librsvg silently
    // rendered at the top edge instead of centered.
    const fontSize =
      typeof layer.fontSize === "number" &&
      Number.isFinite(layer.fontSize) &&
      layer.fontSize > 0
        ? layer.fontSize
        : 14;
    const textColor = layer.textColor || "#ffffff";
    const lines = this.wordWrapText(layer.text!, width, fontSize);
    const lineH = Math.ceil(fontSize * 1.4);
    const totalH = lines.length * lineH;
    const baseY = Math.floor((height - totalH) / 2 + fontSize);

    const textElements = lines
      .map(
        (line, i) =>
          `<text x="50%" y="${baseY + i * lineH}" font-family="Arial,sans-serif" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" dominant-baseline="alphabetic">${this.escapeXml(line)}</text>`,
      )
      .join("");

    const textSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="rgba(0,0,0,0)"/>${textElements}</svg>`;

    const buf = await sharp(Buffer.from(textSvg))
      .ensureAlpha()
      .png()
      .toBuffer();

    return this.applyOpacity(buf, normalizeLayerOpacity(layer.opacity));
  }

  /**
   * Apply opacity to a PNG buffer by multiplying the alpha channel.
   */
  private async applyOpacity(buffer: Buffer, opacity: number | undefined): Promise<Buffer> {
    if (opacity === undefined || opacity >= 1) return buffer;

    const factor = Math.max(0, Math.min(1, opacity));
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return sharp(this.applyOpacityRaw(data, factor), {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();
  }

  /** In-place-ish alpha multiply on raw RGBA pixels. Returns a new Buffer. */
  private applyOpacityRaw(data: Buffer, opacity: number): Buffer {
    const factor = Math.max(0, Math.min(1, opacity));
    const out = Buffer.from(data);
    for (let i = 3; i < out.length; i += 4) {
      out[i] = Math.round(out[i] * factor);
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // Legacy rendering (no layers)
  // --------------------------------------------------------------------------

  private async renderLegacy(
    keyConfig: KeyConfig,
    width: number,
    height: number,
    pressed: boolean,
    img: KeyConfig["image"],
  ): Promise<RenderedKey> {
    let baseBackground = "#000000";
    let gradientStart: string | undefined;
    let gradientEnd: string | undefined;
    let gradientDirection = 135;

    const syncPressed = img?.syncPressedState !== false;

    if (pressed && img && !syncPressed) {
      baseBackground =
        img.pressedBackgroundColor || img.backgroundColor || "#000000";
      gradientStart = img.pressedBackgroundGradientStart;
      gradientEnd = img.pressedBackgroundGradientEnd;
      gradientDirection =
        img.pressedBackgroundGradientDirection !== undefined
          ? normalizeGradientDirection(img.pressedBackgroundGradientDirection)
          : normalizeGradientDirection(img.backgroundGradientDirection);
    } else if (img) {
      baseBackground = img.backgroundColor || "#000000";
      gradientStart = img.backgroundGradientStart;
      gradientEnd = img.backgroundGradientEnd;
      gradientDirection = normalizeGradientDirection(
        img.backgroundGradientDirection,
      );
    }

    const processImage = async (imgToProcess: sharp.Sharp): Promise<Buffer> => {
      try {
        let processed = imgToProcess;
        if (gradientStart && gradientEnd) {
          const gradientSvg = this.createGradientSvg(
            width,
            height,
            gradientStart,
            gradientEnd,
            gradientDirection,
          );
          processed = imgToProcess.composite([
            { input: Buffer.from(gradientSvg), top: 0, left: 0 },
          ]);
        }

        const { data, info } = await processed
          .flatten({ background: baseBackground })
          .resize(width, height, {
            fit: "contain",
            background: baseBackground,
          })
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        if (info.channels === 4) {
          return this.stripAlpha(data, width, height);
        }
        return Buffer.from(data);
      } catch (e) {
        this.logger.error(`Failed to process image buffer:`, e);
        const { data, info } = await this.createBlankImage(
          width,
          height,
          baseBackground,
        )
          .flatten({ background: baseBackground })
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        if (info.channels === 4 || data.length === width * height * 4) {
          return this.stripAlpha(data, width, height);
        }
        return Buffer.from(data);
      }
    };

    let backgroundImage: sharp.Sharp;
    if (gradientStart && gradientEnd) {
      const gradientSvg = this.createGradientSvg(
        width,
        height,
        gradientStart,
        gradientEnd,
        gradientDirection,
      );
      backgroundImage = sharp(Buffer.from(gradientSvg));
    } else {
      backgroundImage = this.createBlankImage(width, height, baseBackground);
    }

    let imageOrFrames: sharp.Sharp | sharp.Sharp[] = backgroundImage;
    let delays: number[] | undefined;

    if (keyConfig.image) {
      switch (keyConfig.image.type) {
        case "static": {
          const source = keyConfig.image.source;
          if (source && source.trim()) {
            // Animated sources go through the one-pass decoder
            const anim = await this.extractAnimationFrames(
              source,
              width,
              height,
              "contain",
              undefined,
            );
            if (anim) {
              imageOrFrames = anim.frames.map((f) => sharp(f));
              delays = anim.delays;
            } else {
              imageOrFrames = await this.renderStaticImage(
                source,
                width,
                height,
                baseBackground,
              );
            }
          }
          break;
        }
        case "text":
          imageOrFrames = await this.renderTextImage(
            applyTextTokens(keyConfig.image.text || ""),
            width,
            height,
            keyConfig.image.textColor || "#ffffff",
            keyConfig.image.fontSize || 14,
            baseBackground,
          );
          break;
        case "icon":
          if (keyConfig.image.source && keyConfig.image.source.trim()) {
            imageOrFrames = await this.renderIconImage(
              keyConfig.image.source,
              width,
              height,
              baseBackground,
            );
          }
          break;
      }
    }

    if (Array.isArray(imageOrFrames)) {
      const buffers: Buffer[] = [];
      for (const frame of imageOrFrames) {
        let frameImg = frame;
        if (keyConfig.label) {
          frameImg = await this.addLabelOverlay(
            frame,
            keyConfig.label,
            keyConfig.labelPosition || "bottom",
            keyConfig.labelColor || "#ffffff",
            width,
            height,
          );
        }
        buffers.push(await processImage(frameImg));
      }
      this.logger.debug(`Rendered animation for key: ${buffers.length} frames`);
      return { image: buffers, delays };
    }

    let image = imageOrFrames;
    if (keyConfig.label) {
      image = await this.addLabelOverlay(
        image,
        keyConfig.label,
        keyConfig.labelPosition || "bottom",
        keyConfig.labelColor || "#ffffff",
        width,
        height,
      );
    }

    return { image: await processImage(image) };
  }

  private stripAlpha(data: Buffer, width: number, height: number): Buffer {
    const rgbBuffer = Buffer.alloc(width * height * 3);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgbBuffer[j] = data[i];
      rgbBuffer[j + 1] = data[i + 1];
      rgbBuffer[j + 2] = data[i + 2];
    }
    return rgbBuffer;
  }

  private createBlankImage(
    width: number,
    height: number,
    background = "#000000",
  ): sharp.Sharp {
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background,
      },
    });
  }

  /**
   * SVG for a gradient background. Uses the exact CSS `linear-gradient`
   * endpoint geometry (cssGradientEndpoints, shared with the LayerStack
   * preview) with userSpaceOnUse coordinates. The previous implementation
   * placed endpoints a full width/height OUTSIDE the canvas (±50%
   * percentages), so hardware only ever displayed the middle 50% band of the
   * gradient — washed-out colors that never matched the preview, and the
   * start/end colors were unreachable at any pixel.
   */
  private createGradientSvg(
    width: number,
    height: number,
    startColor: string,
    endColor: string,
    direction: number | undefined,
  ): string {
    const dir = normalizeGradientDirection(direction);
    const { x1, y1, x2, y2 } = cssGradientEndpoints(width, height, dir);
    const r = (n: number) => Math.round(n * 1000) / 1000;

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" gradientUnits="userSpaceOnUse" x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}">
          <stop offset="0%" stop-color="${startColor}"/>
          <stop offset="100%" stop-color="${endColor}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
    </svg>`;
  }

  async renderStaticImage(
    sourcePath: string,
    width: number,
    height: number,
    backgroundColor: string = "#000000",
  ): Promise<sharp.Sharp | sharp.Sharp[]> {
    if (!sourcePath || sourcePath.trim() === "") {
      this.logger.debug("Static image requested with empty source path");
      return this.createBlankImage(width, height, backgroundColor);
    }

    try {
      const resolved = this.resolveAssetPath(sourcePath);
      const img = Buffer.isBuffer(resolved) ? sharp(resolved) : sharp(resolved);

      const metadata = await img.metadata();
      if (
        (metadata.format === "gif" || metadata.format === "webp") &&
        metadata.pages &&
        metadata.pages > 1
      ) {
        // Animated: use the shared one-pass decoder
        const anim = await this.extractAnimationFrames(
          sourcePath,
          width,
          height,
          "contain",
          undefined,
        );
        if (anim) {
          return anim.frames.map((f) =>
            sharp(f).resize(width, height, {
              fit: "contain",
              background: backgroundColor,
            }),
          );
        }
      }

      return img
        .resize(width, height, {
          fit: "contain",
          background: backgroundColor,
        })
        .ensureAlpha();
    } catch (error) {
      this.logger.error(`Failed to load static image ${sourcePath}:`, error);
      return this.createBlankImage(width, height, backgroundColor);
    }
  }

  async renderTextImage(
    text: string,
    width: number,
    height: number,
    textColor: string = "#ffffff",
    fontSize: number = 24,
    backgroundColor: string = "#000000",
  ): Promise<sharp.Sharp | sharp.Sharp[]> {
    if (!text || text.trim() === "") {
      return this.createBlankImage(width, height, backgroundColor);
    }

    const lines = this.wordWrapText(text, width, fontSize);
    const lineHeight = Math.ceil(fontSize * 1.4);
    const totalHeight = lines.length * lineHeight;
    const startY = Math.floor((height - totalHeight) / 2 + fontSize);

    const tspans = lines
      .map(
        (line, i) =>
          `<tspan x="50%" y="${startY + i * lineHeight}">${this.escapeXml(line)}</tspan>`,
      )
      .join("");

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <text
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="${textColor}"
          text-anchor="middle"
        >${tspans}</text>
      </svg>
    `;

    try {
      return sharp(Buffer.from(svg))
        .ensureAlpha()
        .resize(width, height, { fit: "contain", background: backgroundColor });
    } catch (error) {
      this.logger.error("Failed to render text image:", error);
      return this.createBlankImage(width, height, backgroundColor);
    }
  }

  private wordWrapText(text: string, width: number, fontSize: number): string[] {
    const avgCharWidth = fontSize * 0.65;
    const maxCharsPerLine = Math.max(1, Math.floor(width / avgCharWidth));
    const result: string[] = [];

    const paragraphs = text.split("\n");
    for (const paragraph of paragraphs) {
      if (paragraph === "") {
        result.push("");
        continue;
      }
      const words = paragraph.split(" ");
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length > maxCharsPerLine && currentLine) {
          result.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        result.push(currentLine);
      }
    }

    return result;
  }

  async renderIconImage(
    iconName: string,
    width: number,
    height: number,
    backgroundColor: string = "#000000",
  ): Promise<sharp.Sharp | sharp.Sharp[]> {
    const iconPath = path.join(this.userDataPath, "icons", `${iconName}.svg`);

    try {
      const svgContent = await fs.readFile(iconPath, "utf-8");
      return sharp(Buffer.from(svgContent))
        .ensureAlpha()
        .resize(width, height, { fit: "contain", background: backgroundColor });
    } catch {
      this.logger.debug(`Icon not found: ${iconName}, using blank image`);
      return this.createBlankImage(width, height, backgroundColor);
    }
  }

  async addLabelOverlay(
    image: sharp.Sharp,
    label: string,
    position: string,
    color: string,
    width: number,
    height: number,
  ): Promise<sharp.Sharp> {
    const labelHeight = Math.max(20, Math.floor(height * 0.18));
    const fontSize = Math.max(10, Math.floor(labelHeight * 0.6));
    const escapedLabel = this.escapeXml(label);

    let top: number;
    if (position === "top") top = 0;
    else if (position === "center") top = Math.floor(height / 2 - labelHeight / 2);
    else top = height - labelHeight;

    const labelSvg = `
      <svg width="${width}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" rx="2"/>
        <text
          x="50%"
          y="50%"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          fill="${color}"
          text-anchor="middle"
          dominant-baseline="middle"
        >${escapedLabel}</text>
      </svg>
    `;

    return image.composite([
      {
        input: Buffer.from(labelSvg),
        top,
        left: 0,
      },
    ]);
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private resolveAssetPath(source: string): string | Buffer {
    if (source.startsWith("bigdeck-asset://")) {
      const assetName = decodeURIComponent(
        source.replace("bigdeck-asset://", ""),
      );
      // Absolute paths pass through unchanged (drag-dropped external files)
      if (assetName.startsWith("/")) {
        return assetName;
      }
      return path.join(this.userDataPath, "assets", assetName);
    }

    return source;
  }

  /**
   * Animation delays for a key config, sampled identically to what
   * renderKeyImageEx produces. Prefer renderKeyImageEx() where possible.
   */
  async getAnimationDelays(keyConfig: KeyConfig): Promise<number[]> {
    const layers = keyConfig.layers || [];
    const specs = DEVICE_SPECS["original"];

    // Layer-based: delays of the longest animation
    const imageLayers = layers.filter((l) => l.type === "image" && !!l.source);
    let best: number[] = [];
    for (const layer of imageLayers) {
      const anim = await this.extractAnimationFrames(
        layer.source!,
        specs.keyWidth,
        specs.keyHeight,
        layer.fit || "contain",
        layer.opacity,
      );
      if (anim && anim.delays.length > best.length) {
        best = anim.delays;
      }
    }
    if (best.length > 0) return best;

    // Legacy: animated static image
    if (keyConfig.image?.type === "static" && keyConfig.image.source) {
      const anim = await this.extractAnimationFrames(
        keyConfig.image.source,
        specs.keyWidth,
        specs.keyHeight,
        "contain",
        undefined,
      );
      if (anim) return anim.delays;
    }

    return [DEFAULT_FRAME_DELAY_MS];
  }

  async getMediaPlayers(): Promise<MediaPlayerInfo[]> {
    try {
      const { execSync } = await import("child_process");
      execSync("which playerctl", { stdio: "ignore" });
    } catch {
      return [];
    }

    return [];
  }
}
