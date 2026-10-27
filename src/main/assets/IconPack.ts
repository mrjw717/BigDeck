// ============================================================================
// BigDeck - Elgato .sdIconPack Icon Library Manager
//
// Decodes and serves Elgato Stream Deck icon packs (docs/ICON-PACKS.md).
// An `.sdIconPack` is a DIRECTORY (despite the file-ish extension):
//
//   com.elgato.defaulticonswhite.sdIconPack/
//     manifest.json   — { Name, Version, Description, Author, URL, Icon,
//                         License, pinned, canhide }
//     icons.json      — [ { path, name, tags[] }, ... ]  (path relative to
//                       the pack's icons/ directory)
//     icons/*.svg     — the actual icons, one standalone SVG per entry
//                       (144x144 viewBox, self-contained paths — no external
//                       refs, no icon font, no conversion needed)
//     icon.svg        — pack thumbnail
//     license.txt
//
// Because every icon is an individual SVG file, the format is directly
// usable: no font/codepoint mapping is involved. The manager:
// - lists packs from <userData>/iconpacks/ (mirrors the sdplugins dir
//   pattern: packs are IMPORTED there — the source of packs is the KeyCreator
//   app bundle or a user-selected folder);
// - imports packs via installFromFile()/importAllFrom() (plain recursive
//   copies — packs are small, ~0.7-3.5 MB each);
// - serves icons either as raw SVG markup (inline/recolor in the renderer)
//   or as a ready-to-use data: URL.
//
// All parsing is deliberately lenient: a broken pack must never take the
// manager down; it is skipped with a warning instead. Every path resolved
// from pack-provided data is checked to stay inside the pack directory
// (traversal guard) before it touches the filesystem.
// ============================================================================

import fsp from "fs/promises";
import type { Dirent } from "fs";
import path from "path";
import type { Logger } from "../utils/Logger";

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

/** Validated subset of a pack's manifest.json. */
export interface IconPackManifest {
  Name: string;
  Version?: string;
  Description?: string;
  Author?: string;
  URL?: string;
  /** Pack thumbnail, relative to the pack root (e.g. "icon.svg"). */
  Icon?: string;
  License?: string;
  pinned: boolean;
  canHide: boolean;
}

/** One installed icon pack. */
export interface IconPackSummary {
  /** Pack directory name, e.g. "com.elgato.defaulticonswhite.sdIconPack". */
  id: string;
  name: string;
  version: string | null;
  description: string | null;
  author: string | null;
  /** Absolute path to the pack thumbnail image, when present. */
  iconPath: string | null;
  /** Number of entries in icons.json (may exceed the files actually on disk). */
  iconCount: number;
  pinned: boolean;
  canHide: boolean;
}

/** One icon inside a pack. */
export interface IconEntry {
  /**
   * Icon id: the icons.json `path` (relative to the pack's icons/ dir),
   * e.g. "IconAdd-White.svg". Stable and unique within a pack.
   */
  id: string;
  /** Human-readable name (falls back to the path when absent). */
  name: string;
  /** Search tags from icons.json; empty when absent. */
  tags: string[];
}

/** An icon resolved to usable bytes. */
export interface IconFile {
  packId: string;
  iconId: string;
  /** Absolute path on disk (main-process use). */
  file: string;
  /** Raw SVG markup for .svg icons, else null (inline/recolor in renderer). */
  svg: string | null;
  /** Ready-to-use data: URL for <img src>, or null for unknown extensions. */
  dataUrl: string | null;
}

export interface IconPackImportResult {
  imported: string[];
  skipped: string[];
  failed: Array<{ name: string; error: string }>;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const IMAGE_MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseManifest(raw: unknown, fallbackName: string): IconPackManifest {
  const obj = isPlainObject(raw) ? raw : {};
  const truthy = (v: unknown): boolean => v === true || v === "true";
  return {
    Name: typeof obj.Name === "string" && obj.Name.length > 0 ? obj.Name : fallbackName,
    Version: typeof obj.Version === "string" ? obj.Version : undefined,
    Description: typeof obj.Description === "string" ? obj.Description : undefined,
    Author: typeof obj.Author === "string" ? obj.Author : undefined,
    URL: typeof obj.URL === "string" ? obj.URL : undefined,
    Icon: typeof obj.Icon === "string" ? obj.Icon : undefined,
    License: typeof obj.License === "string" ? obj.License : undefined,
    pinned: truthy(obj.pinned),
    canHide: truthy(obj.canhide),
  };
}

/**
 * Parse icons.json — an array of `{ path, name?, tags? }`. Entries without a
 * string `path` are dropped; tags are coerced to a string list. Returns null
 * when the payload is not an array (caller treats the pack as empty).
 */
function parseIconIndex(raw: unknown): IconEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const entries: IconEntry[] = [];
  for (const item of raw) {
    if (!isPlainObject(item) || typeof item.path !== "string" || item.path.length === 0) {
      continue;
    }
    const tags = Array.isArray(item.tags)
      ? item.tags.filter((t): t is string => typeof t === "string")
      : [];
    entries.push({
      id: item.path,
      name: typeof item.name === "string" && item.name.length > 0 ? item.name : item.path,
      tags,
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// The manager
// ---------------------------------------------------------------------------

export class IconPackManager {
  private readonly logger: Logger;
  /** Where packs live: <userData>/iconpacks (mirrors the sdplugins pattern). */
  readonly packsDir: string;

  constructor(opts: { logger: Logger; packsDir: string }) {
    this.logger = opts.logger;
    this.packsDir = opts.packsDir;
  }

  /** Create the packs directory (safe to call repeatedly). */
  async ensureDir(): Promise<void> {
    await fsp.mkdir(this.packsDir, { recursive: true });
  }

  /**
   * List installed packs. Packs without a readable manifest.json are skipped
   * with a warning (e.g. KeyCreator's empty com.elgato.custom.sdIconPack).
   */
  async listIconPacks(): Promise<IconPackSummary[]> {
    let dirents: Dirent[];
    try {
      dirents = await fsp.readdir(this.packsDir, { withFileTypes: true });
    } catch {
      return [];
    }

    const packs: IconPackSummary[] = [];
    for (const dirent of dirents) {
      if (!dirent.isDirectory() || !dirent.name.endsWith(".sdIconPack")) continue;
      const pack = await this.loadPack(dirent.name);
      if (pack) packs.push(pack);
    }
    packs.sort((a, b) => a.id.localeCompare(b.id));
    return packs;
  }

  /** Load + validate one installed pack; null when broken/missing. */
  private async loadPack(packId: string): Promise<IconPackSummary | null> {
    const packDir = this.packDir(packId);
    try {
      const manifest = parseManifest(
        JSON.parse(await fsp.readFile(path.join(packDir, "manifest.json"), "utf-8")),
        packId,
      );
      const icons = await this.readIconIndex(packDir);
      return {
        id: packId,
        name: manifest.Name,
        version: manifest.Version ?? null,
        description: manifest.Description ?? null,
        author: manifest.Author ?? null,
        iconPath: manifest.Icon ? path.join(packDir, manifest.Icon) : null,
        iconCount: icons ? icons.length : 0,
        pinned: manifest.pinned,
        canHide: manifest.canHide,
      };
    } catch (err) {
      this.logger.warn(`[assets] skipping icon pack ${packId}: unreadable manifest.json`, err);
      return null;
    }
  }

  private packDir(packId: string): string {
    return path.join(this.packsDir, packId);
  }

  /**
   * Read + parse a pack's icons.json. Returns null when absent/malformed —
   * a pack without an index still installs but exposes no icons.
   */
  private async readIconIndex(packDir: string): Promise<IconEntry[] | null> {
    try {
      const raw = JSON.parse(await fsp.readFile(path.join(packDir, "icons.json"), "utf-8"));
      return parseIconIndex(raw);
    } catch {
      return null;
    }
  }

  /**
   * List a pack's icons. Unknown pack ids (no directory) return [] — the
   * renderer treats that as "pack gone" rather than an error.
   */
  async listIcons(packId: string): Promise<IconEntry[]> {
    if (!this.isValidPackId(packId)) return [];
    const icons = await this.readIconIndex(this.packDir(packId));
    return icons ?? [];
  }

  /**
   * Resolve one icon to its file + SVG text + data URL. Returns null when the
   * pack/icon is unknown or the file is missing — never throws.
   */
  async getIconSvgOrFile(packId: string, iconId: string): Promise<IconFile | null> {
    if (!this.isValidPackId(packId)) return null;
    const packDir = this.packDir(packId);
    const iconsDir = path.join(packDir, "icons");

    // Traversal guard: the icon id comes from pack data / renderer input, so
    // the resolved path must stay inside the pack's icons/ directory.
    const file = path.resolve(iconsDir, iconId);
    if (file !== iconsDir && !file.startsWith(iconsDir + path.sep)) {
      this.logger.warn(`[assets] refusing icon id outside pack dir: ${packId}/${iconId}`);
      return null;
    }

    let data: Buffer;
    try {
      data = await fsp.readFile(file);
    } catch {
      return null;
    }

    const ext = path.extname(file).toLowerCase();
    const mime = IMAGE_MIME[ext] ?? null;
    return {
      packId,
      iconId,
      file,
      svg: ext === ".svg" ? data.toString("utf-8") : null,
      dataUrl: mime ? `data:${mime};base64,${data.toString("base64")}` : null,
    };
  }

  /** Only bare directory names — no separators, no dot-dot, no leading dots. */
  private isValidPackId(packId: string): boolean {
    return (
      typeof packId === "string" &&
      packId.length > 0 &&
      !packId.includes("/") &&
      !packId.includes("\\") &&
      !packId.includes(path.sep) &&
      !packId.startsWith(".")
    );
  }

  /**
   * Import (copy) one `.sdIconPack` directory into packsDir. An already
   * installed pack with the same directory name is replaced in place.
   */
  async installFromFile(sourcePackDir: string): Promise<IconPackSummary> {
    const name = path.basename(sourcePackDir);
    if (!name.endsWith(".sdIconPack")) {
      throw new Error(`not an .sdIconPack directory: ${name}`);
    }
    await this.ensureDir();

    const dest = this.packDir(name);
    await fsp.rm(dest, { recursive: true, force: true });
    await fsp.cp(sourcePackDir, dest, { recursive: true });

    const pack = await this.loadPack(name);
    if (!pack) {
      throw new Error(`imported pack has no readable manifest.json: ${name}`);
    }
    this.logger.info(`[assets] imported icon pack ${name} (${pack.iconCount} icons)`);
    return pack;
  }

  /**
   * Import every `*.sdIconPack` directory found in `sourceDir` (e.g. the
   * KeyCreator static/ folder or the app's bundled seed dir). Already
   * installed packs with the same name are SKIPPED, not overwritten — the
   * user's installed copy wins. Never throws: a missing/unreadable source
   * dir simply imports nothing.
   */
  async importAllFrom(sourceDir: string): Promise<IconPackImportResult> {
    const result: IconPackImportResult = { imported: [], skipped: [], failed: [] };
    let dirents: Dirent[];
    try {
      dirents = await fsp.readdir(sourceDir, { withFileTypes: true });
    } catch {
      return result;
    }

    await this.ensureDir();
    for (const dirent of dirents) {
      if (!dirent.isDirectory() || !dirent.name.endsWith(".sdIconPack")) continue;
      const dest = this.packDir(dirent.name);
      const installed = await fsp.stat(dest).then(() => true).catch(() => false);
      if (installed) {
        result.skipped.push(dirent.name);
        continue;
      }
      try {
        await fsp.cp(path.join(sourceDir, dirent.name), dest, { recursive: true });
        if (!(await this.loadPack(dirent.name))) {
          // Installed but broken — remove so a fixed copy can be imported later.
          await fsp.rm(dest, { recursive: true, force: true });
          result.failed.push({ name: dirent.name, error: "no readable manifest.json" });
          continue;
        }
        result.imported.push(dirent.name);
      } catch (err) {
        result.failed.push({ name: dirent.name, error: String(err) });
      }
    }
    if (result.imported.length > 0) {
      this.logger.info(
        `[assets] imported ${result.imported.length} icon pack(s) from ${sourceDir}`,
      );
    }
    return result;
  }
}
