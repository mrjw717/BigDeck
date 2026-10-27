// ============================================================================
// BigDeck - Elgato .streamDeckProfile Parser
//
// Unzips an official Elgato Stream Deck profile file (.streamDeckProfile = a
// ZIP of one `<UUID>.sdProfile/` directory) and extracts the manifest BigDeck
// imports from. Layout (verified against Stream Deck 7.6 defaults and a real
// user-exported XL profile):
//
//   <root>.streamDeckProfile (ZIP)
//   └─ <UUID>.sdProfile/
//      ├─ manifest.json              ← file-level manifest: profile Name,
//      │                               Pages{Current,Default,Pages[]}, Version
//      ├─ Images/                    ← (optional, file-level images)
//      └─ Profiles/
//         └─ <DEVICE-SERIAL>/
//            ├─ manifest.json        ← per-device copy: Controllers[] with the
//            │                         "col,row"-keyed Actions dict
//            └─ Images/              ← PNGs referenced by States[].Image
//
// A single .sdProfile can contain SEVERAL Profiles/<SERIAL>/ copies — the app
// syncs one profile across every device that uses it, and each copy drifts
// (device layouts differ, older copies lag). Import therefore picks one
// deterministic "best" copy:
//   1. a serial with at least one non-empty Encoder controller (dials —
//      Plus-family layout), else
//   2. the serial with the most Keypad actions,
//   ties broken by lexicographically-first serial name.
//
// Parsing is structural and dependency-free (untrusted input): every field is
// type-checked before use and validation problems are COLLECTED, not
// fail-fast, so import errors name every broken action.
// ============================================================================

import fsp from "fs/promises";
import os from "os";
import path from "path";
import extractZip from "extract-zip";

/** One visual state of a placed action (Elgato states are toggle states). */
export interface ElgatoActionState {
  Image?: string;
  Title?: string;
  ShowTitle?: boolean;
  TitleColor?: string;
  TitleAlignment?: string;
  FontSize?: number;
}

/** One placed action instance inside a controller's Actions dict. */
export interface ElgatoAction {
  /** Instance UUID (stable per key slot across syncs) — reused as key id. */
  ActionID?: string;
  Name?: string;
  /** Action TYPE, e.g. "com.elgato.streamdeck.system.hotkey". */
  UUID?: string;
  Settings?: Record<string, unknown>;
  /** Index into States[] of the currently-active state. */
  State?: number;
  States?: ElgatoActionState[];
}

/** One controller block ("Keypad" | "Encoder" | {Invalid}). */
export interface ElgatoController {
  Type?: string;
  /** Keyed "col,row" (that order — verified against every shipped default). */
  Actions?: Record<string, ElgatoAction>;
}

/** Profiles/<SERIAL>/manifest.json — the per-device profile copy. */
export interface ElgatoDeviceManifest {
  Name?: string;
  Icon?: string;
  Controllers?: ElgatoController[];
}

/** Top-level <UUID>.sdProfile/manifest.json — file-level metadata. */
export interface ElgatoFileManifest {
  Name?: string;
  Version?: string;
  Pages?: { Current?: string; Default?: string; Pages?: string[] };
}

/**
 * A parsed .streamDeckProfile bundle. `tempDir` holds the extraction — the
 * caller owns its lifecycle and MUST call cleanupElgatoBundle() when done
 * (image copying reads PNGs from it).
 */
export interface ElgatoProfileBundle {
  /** Extraction root (a fresh mkdtemp dir). */
  tempDir: string;
  /** The extracted <UUID>.sdProfile directory. */
  sdProfileDir: string;
  /** Serial of the chosen per-device copy. */
  serial: string;
  /**
   * The chosen copy's directory (<sdProfileDir>/Profiles/<serial>/).
   * States[].Image paths are relative to THIS dir ("Images/X.png").
   */
  serialDir: string;
  /** Profile name: file manifest Name, else device manifest Name, else "". */
  name: string;
  deviceManifest: ElgatoDeviceManifest;
  fileManifest: ElgatoFileManifest;
  /** Non-fatal observations collected while parsing. */
  warnings: string[];
}

/** Thrown when the file is not a usable .streamDeckProfile. */
export class ElgatoProfileParseError extends Error {
  /** Every validation problem found (collected, not fail-fast). */
  readonly errors: string[];

  constructor(errors: string[]) {
    super(`Invalid .streamDeckProfile: ${errors.join("; ")}`);
    this.name = "ElgatoProfileParseError";
    this.errors = errors;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Lenient field readers — validation collects problems instead of throwing. */
function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseActions(raw: unknown): Record<string, ElgatoAction> {
  if (!isPlainObject(raw)) return {};
  const actions: Record<string, ElgatoAction> = {};
  for (const [coord, value] of Object.entries(raw)) {
    if (!isPlainObject(value)) continue;
    actions[coord] = {
      ActionID: asString(value.ActionID),
      Name: asString(value.Name),
      UUID: asString(value.UUID),
      Settings: isPlainObject(value.Settings) ? value.Settings : undefined,
      State: asNumber(value.State),
      States: Array.isArray(value.States)
        ? value.States.filter(isPlainObject).map((s) => ({
            Image: asString(s.Image),
            Title: asString(s.Title),
            ShowTitle: s.ShowTitle === true,
            TitleColor: asString(s.TitleColor),
            TitleAlignment: asString(s.TitleAlignment),
            FontSize: asNumber(s.FontSize),
          }))
        : [],
    };
  }
  return actions;
}

function parseDeviceManifest(raw: unknown): ElgatoDeviceManifest {
  if (!isPlainObject(raw)) return {};
  const controllers = Array.isArray(raw.Controllers)
    ? raw.Controllers.filter(isPlainObject).map((c) => ({
        Type: asString(c.Type),
        Actions: parseActions(c.Actions),
      }))
    : [];
  return {
    Name: asString(raw.Name),
    Icon: asString(raw.Icon),
    Controllers: controllers,
  };
}

function parseFileManifest(raw: unknown): ElgatoFileManifest {
  if (!isPlainObject(raw)) return {};
  const pages = isPlainObject(raw.Pages) ? raw.Pages : {};
  return {
    Name: asString(raw.Name),
    Version: asString(raw.Version),
    Pages: {
      Current: asString(pages.Current),
      Default: asString(pages.Default),
      Pages: Array.isArray(pages.Pages)
        ? pages.Pages.filter((p): p is string => typeof p === "string")
        : [],
    },
  };
}

/** Parse a "col,row" coordinate. Returns null for malformed keys. */
export function parseElgatoCoordinate(
  coord: string,
): { col: number; row: number } | null {
  const parts = coord.split(",");
  if (parts.length !== 2) return null;
  const col = Number(parts[0]);
  const row = Number(parts[1]);
  if (!Number.isInteger(col) || !Number.isInteger(row)) return null;
  if (col < 0 || row < 0) return null;
  return { col, row };
}

function countKeypadActions(manifest: ElgatoDeviceManifest): number {
  return (manifest.Controllers ?? [])
    .filter((c) => c.Type === "Keypad")
    .reduce((n, c) => n + Object.keys(c.Actions ?? {}).length, 0);
}

function countEncoderActions(manifest: ElgatoDeviceManifest): number {
  return (manifest.Controllers ?? [])
    .filter((c) => c.Type === "Encoder")
    .reduce((n, c) => n + Object.keys(c.Actions ?? {}).length, 0);
}

/**
 * Read a JSON file if it exists. Returns null when missing; throws (collected
 * by the caller) when present but unparsable.
 */
async function readJsonIfExists(
  filePath: string,
): Promise<unknown | null> {
  try {
    return JSON.parse(await fsp.readFile(filePath, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Unzip and parse a .streamDeckProfile file. The caller must eventually call
 * cleanupElgatoBundle() to remove the extraction directory.
 *
 * @throws ElgatoProfileParseError when the file is not a usable profile.
 */
export async function parseElgatoProfile(
  zipPath: string,
): Promise<ElgatoProfileBundle> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "bigdeck-elgato-"));
  try {
    await extractZip(zipPath, { dir: tempDir });
  } catch (error) {
    await fsp.rm(tempDir, { recursive: true, force: true });
    throw new ElgatoProfileParseError([
      `not a readable ZIP archive: ${(error as Error).message}`,
    ]);
  }

  // Locate exactly one *.sdProfile directory at the extraction root. Official
  // files zip the directory itself; tolerate a nested single sdProfile too.
  const entries = await fsp.readdir(tempDir, { withFileTypes: true });
  let sdProfileDirs = entries
    .filter((e) => e.isDirectory() && e.name.endsWith(".sdProfile"))
    .map((e) => e.name)
    .sort();
  if (sdProfileDirs.length === 0) {
    for (const e of entries.filter((e) => e.isDirectory())) {
      const nested = await fsp.readdir(path.join(tempDir, e.name), {
        withFileTypes: true,
      });
      const hit = nested.find(
        (n) => n.isDirectory() && n.name.endsWith(".sdProfile"),
      );
      if (hit) {
        sdProfileDirs = [path.join(e.name, hit.name)];
        break;
      }
    }
  }
  if (sdProfileDirs.length === 0) {
    await fsp.rm(tempDir, { recursive: true, force: true });
    throw new ElgatoProfileParseError([
      "no *.sdProfile directory found in the archive root",
    ]);
  }
  if (sdProfileDirs.length > 1) {
    warnings.push(
      `archive contains ${sdProfileDirs.length} .sdProfile directories; using "${sdProfileDirs[0]}"`,
    );
  }
  const sdProfileDir = path.join(tempDir, sdProfileDirs[0]);

  // File-level manifest (Name, Pages) — optional in the wild.
  let fileManifest: ElgatoFileManifest = {};
  try {
    const raw = await readJsonIfExists(path.join(sdProfileDir, "manifest.json"));
    if (raw !== null) fileManifest = parseFileManifest(raw);
  } catch (error) {
    warnings.push(
      `file-level manifest.json unparsable, continuing: ${(error as Error).message}`,
    );
  }

  // Per-device copies: Profiles/<SERIAL>/manifest.json.
  const profilesDir = path.join(sdProfileDir, "Profiles");
  let serials: string[] = [];
  try {
    serials = (await fsp.readdir(profilesDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    // handled below by the empty-serials error
  }
  if (serials.length === 0) {
    await fsp.rm(tempDir, { recursive: true, force: true });
    throw new ElgatoProfileParseError([
      "no Profiles/<serial>/ directories found in the archive",
    ]);
  }

  const candidates: Array<{
    serial: string;
    manifest: ElgatoDeviceManifest;
    keypad: number;
    encoder: number;
  }> = [];
  for (const serial of serials) {
    try {
      const raw = await readJsonIfExists(
        path.join(profilesDir, serial, "manifest.json"),
      );
      if (raw === null) {
        errors.push(`Profiles/${serial}/manifest.json missing`);
        continue;
      }
      const manifest = parseDeviceManifest(raw);
      candidates.push({
        serial,
        manifest,
        keypad: countKeypadActions(manifest),
        encoder: countEncoderActions(manifest),
      });
    } catch (error) {
      errors.push(
        `Profiles/${serial}/manifest.json unparsable: ${(error as Error).message}`,
      );
    }
  }
  if (candidates.length === 0) {
    await fsp.rm(tempDir, { recursive: true, force: true });
    throw new ElgatoProfileParseError(
      errors.length > 0 ? errors : ["no device manifests found"],
    );
  }

  // Best copy: any serial with real Encoder (dials) content wins (Plus-family
  // layout); otherwise the fullest Keypad. Ties → lexicographic serial name.
  candidates.sort(
    (a, b) =>
      Number(b.encoder > 0) - Number(a.encoder > 0) ||
      b.keypad - a.keypad ||
      a.serial.localeCompare(b.serial),
  );
  const best = candidates[0];
  for (const c of candidates.slice(1)) {
    warnings.push(
      `skipped device copy Profiles/${c.serial}/ (${c.keypad} keypad actions)`,
    );
  }
  if (errors.length > 0) {
    // Broken sibling serials are non-fatal as long as one parsed.
    warnings.push(...errors);
  }

  const name =
    fileManifest.Name ?? best.manifest.Name ?? "";

  return {
    tempDir,
    sdProfileDir,
    serial: best.serial,
    serialDir: path.join(profilesDir, best.serial),
    name,
    deviceManifest: best.manifest,
    fileManifest,
    warnings,
  };
}

/** Remove a bundle's extraction directory (idempotent). */
export async function cleanupElgatoBundle(
  bundle: ElgatoProfileBundle,
): Promise<void> {
  await fsp.rm(bundle.tempDir, { recursive: true, force: true });
}
