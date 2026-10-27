// ============================================================================
// BigDeck - Elgato .sdLayoutEx InfoBar Layout Store
//
// Owns the user's installed InfoBar layout packages under
// `<userData>/layouts/<name>.sdLayoutEx/`, following the SDPluginHost plugin
// discovery pattern: scan the directory for `*.sdLayoutEx` folders, validate
// each manifest.json with the LayoutSchema parser (collected errors logged,
// invalid packages skipped but left on disk), and serve list/get lookups.
//
// Import copies a source `.sdLayoutEx` directory (with its manifest, images/
// and fonts/) into the store, replacing an existing package of the same name
// in place — the same reinstall semantics as SDPluginHost.installFromFile.
//
// BigDeck ships no layouts of its own (Elgato's bundled layouts are its
// copyrighted assets; users import them from their own installation).
// Live SD+/Neo LCD rendering wiring (device dial/LCD writes) is NEXT-phase
// work that will consume LayoutStore + LayoutRenderer together.
// ============================================================================

import fs from "fs/promises";
import path from "path";
import { parseLayoutExDetailed } from "./LayoutSchema";
import type { LayoutExManifest } from "../../shared/types";
import type { Logger } from "../utils/Logger";

export interface LayoutStoreOptions {
  logger: Logger;
  /** Layout package root; LayoutStore.defaultLayoutsDir(userData) by default. */
  layoutsDir: string;
}

export interface LayoutEntry {
  /** Package id: the directory basename minus `.sdLayoutEx`. */
  id: string;
  /** Absolute path of the installed package directory. */
  dir: string;
  manifest: LayoutExManifest;
  /** Theme ids declared by the manifest, in declaration order. */
  themeIds: string[];
}

const SUFFIX = ".sdLayoutEx";
const MANIFEST_NAME = "manifest.json";

export class LayoutStore {
  private readonly logger: Logger;
  private readonly layoutsDir: string;
  private readonly layouts = new Map<string, LayoutEntry>();

  constructor(opts: LayoutStoreOptions) {
    this.logger = opts.logger;
    this.layoutsDir = opts.layoutsDir;
  }

  /** `<userData>/layouts` — the store location the app wiring passes in. */
  static defaultLayoutsDir(userDataPath: string): string {
    return path.join(userDataPath, "layouts");
  }

  getLayoutsDir(): string {
    return this.layoutsDir;
  }

  // -- discovery -------------------------------------------------------------

  /**
   * Scan the layouts directory and (re)load every *.sdLayoutEx manifest.
   * Returns the number of valid layouts loaded. Safe to call repeatedly;
   * each scan rebuilds the in-memory map from disk.
   */
  async discover(): Promise<number> {
    this.layouts.clear();
    await fs.mkdir(this.layoutsDir, { recursive: true });

    let entries;
    try {
      entries = await fs.readdir(this.layoutsDir, { withFileTypes: true });
    } catch (err) {
      this.logger.warn(`[layouts] cannot read ${this.layoutsDir}: ${err}`);
      return 0;
    }

    let discovered = 0;
    for (const dirent of entries) {
      if (!dirent.isDirectory() || !dirent.name.endsWith(SUFFIX)) continue;
      const dir = path.join(this.layoutsDir, dirent.name);
      const entry = await this.loadEntry(dirent.name.slice(0, -SUFFIX.length), dir);
      if (entry) {
        this.layouts.set(entry.id, entry);
        discovered += 1;
      }
    }
    return discovered;
  }

  private async loadEntry(id: string, dir: string): Promise<LayoutEntry | null> {
    try {
      const raw = JSON.parse(await fs.readFile(path.join(dir, MANIFEST_NAME), "utf-8"));
      const result = parseLayoutExDetailed(raw);
      if (!result.ok || !result.manifest) {
        this.logger.warn(
          `[layouts] ${id}: invalid manifest (${result.errors.length} problems): ${result.errors.join("; ")}`,
        );
        return null;
      }
      return {
        id,
        dir,
        manifest: result.manifest,
        themeIds: result.manifest.themes.map((t) => t.id),
      };
    } catch (err) {
      this.logger.warn(`[layouts] ${id}: cannot load manifest: ${err}`);
      return null;
    }
  }

  // -- list / get --------------------------------------------------------------

  list(): LayoutEntry[] {
    return [...this.layouts.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  get(id: string): LayoutEntry | null {
    return this.layouts.get(id) ?? null;
  }

  // -- import --------------------------------------------------------------------

  /**
   * Import (copy) a `.sdLayoutEx` directory into the store, replacing any
   * existing package of the same name. The source manifest is validated
   * BEFORE anything is copied — invalid packages are rejected with the
   * collected error list. Returns the freshly loaded entry.
   */
  async importFrom(sourceDir: string): Promise<{ entry: LayoutEntry } | { errors: string[] }> {
    // Validate first — never copy an invalid package into the store.
    let raw: unknown;
    try {
      raw = JSON.parse(await fs.readFile(path.join(sourceDir, MANIFEST_NAME), "utf-8"));
    } catch (err) {
      return { errors: [`manifest.json: unreadable (${err})`] };
    }
    const result = parseLayoutExDetailed(raw);
    if (!result.ok || !result.manifest) {
      return { errors: result.errors };
    }

    const base = path.basename(sourceDir) || "layout";
    const name = base.endsWith(SUFFIX) ? base : `${base}${SUFFIX}`;
    const dest = path.join(this.layoutsDir, name);

    await fs.mkdir(this.layoutsDir, { recursive: true });
    await fs.cp(sourceDir, dest, { recursive: true });

    const id = name.slice(0, -SUFFIX.length);
    const entry = await this.loadEntry(id, dest);
    if (!entry) {
      // Unreachable in practice (validated above) — kept for filesystem races.
      return { errors: ["manifest.json: validation failed after copy"] };
    }
    this.layouts.set(id, entry);
    this.logger.info(`[layouts] imported ${id} (${entry.themeIds.length} themes)`);
    return { entry };
  }
}
