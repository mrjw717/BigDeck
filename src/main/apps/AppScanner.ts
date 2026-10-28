// ============================================================================
// AppScanner — freedesktop app + CLI tool inventory for auto-switch binding
//
// Backend of the Settings "App Focus Switching" app picker: users bind
// PROFILES to APPS, never to hand-typed paths. Two independent sources:
//
// 1. listDesktopApps() parses .desktop entries (freedesktop Desktop Entry
//    spec) from the standard applications directories: /usr/share/applications
//    and $XDG_DATA_HOME/applications (defaulting to ~/.local/share/applications).
//    A minimal hand-rolled INI reader (zero dependencies) extracts the
//    [Desktop Entry] section's Name/Icon/Exec/StartupWMClass keys. Entries
//    with NoDisplay=true or Hidden=true are skipped — they are launchers the
//    desktop deliberately hides. Later directories override earlier ones
//    (XDG precedence: user-local entries win over system-wide with the same
//    desktopFileId). Only top-level .desktop files are read; nested
//    subdirectories (legacy kde4/ trees) are out of scope.
//
//    Auto-switch binding targets the WINDOW CLASS: StartupWMClass when the
//    entry declares it. When missing, the binding falls back to the
//    desktopFileId minus its .desktop suffix, lowercased — a GUESS. It works
//    for the common case where an app's WM_CLASS equals its binary/desktop
//    id (most Electron/terminal apps), but apps whose WM_CLASS diverges from
//    their desktop file id (some Qt/GTK apps, e.g. "Navigator" for Firefox)
//    will not match until the entry ships a StartupWMClass. The rules UI
//    shows the effective pattern so the guess is never silent.
//
// 2. listCliTools() walks $PATH and returns executable regular files by
//    name — the "CLI command" tab's suggestions (CLI focus binds a
//    window-title rule, e.g. a terminal whose title contains "codex").
//    Directories are skipped, results are deduped (first dir on PATH wins)
//    and capped.
//
// All I/O is injectable (AppScannerDeps) — the repo's seam-injection style —
// so tests drive real .desktop fixture content without touching /usr.
// ============================================================================

import fs from "fs";
import os from "os";
import path from "path";

/** One parsed .desktop launcher, summarized for the app picker. */
export interface DesktopApp {
  /** File name incl. extension, e.g. "org.mozilla.firefox.desktop". */
  desktopFileId: string;
  /** Display name (the Name= key); falls back to the id without extension. */
  name: string;
  /** Icon= value — an icon-theme name or an absolute path, passed through. */
  icon?: string;
  /** Exec= line with %f-style field codes left intact. */
  exec?: string;
  /** StartupWMClass= — the window-class matcher target, when declared. */
  startupWMClass?: string;
}

/** One executable found on PATH. */
export interface CliTool {
  name: string;
  path: string;
}

export interface AppScannerDeps {
  /**
   * Directories to scan for .desktop files, LOWEST precedence first (later
   * dirs override same-desktopFileId entries).
   */
  appsDirs: () => string[];
  /** Colon-separated PATH for the CLI scan. */
  pathEnv: () => string;
  /** Read a text file; rejects when missing/unreadable. */
  readTextFile: (filePath: string) => Promise<string>;
  /** List a directory's entries (names only); rejects when missing. */
  listDir: (dir: string) => Promise<string[]>;
  /** True when the path is an executable regular FILE (directories fail). */
  isExecutableFile: (filePath: string) => boolean;
}

/** Reasonable upper bound for the CLI scan (PATH can hold thousands). */
export const DEFAULT_CLI_RESULT_CAP = 500;

/**
 * Minimal INI reader for .desktop content: returns the key→value table of
 * the [Desktop Entry] section, or null when the file has no usable one
 * (section absent, or it yielded no keys — junk files are skipped, not
 * turned into nameless picker entries). Hand-rolled on purpose (no deps):
 *   - `[Section]` headers switch sections; only "Desktop Entry" is captured
 *     ([Desktop Action foo] and friends are ignored).
 *   - `Key=Value` lines split on the FIRST '=' (values may contain '=').
 *   - Blank lines and `#` comments are skipped; keys/values are trimmed.
 *   - Locale variants (`Name[de]=…`) are NOT plain keys and are ignored —
 *     the unprefixed Name wins per the spec.
 *   - Values are kept verbatim (Exec keeps its %f-style field codes).
 */
export function parseDesktopEntry(content: string): Record<string, string> | null {
  const entry: Record<string, string> = {};
  let inDesktopEntry = false;
  let sawSection = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const section = /^\[(.+)\]$/.exec(line);
    if (section) {
      inDesktopEntry = section[1] === "Desktop Entry";
      sawSection = true;
      continue;
    }

    if (!inDesktopEntry) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue; // not a Key=Value line — ignore, don't fail

    const key = line.slice(0, eq).trim();
    if (!key || key.includes("[")) continue; // skip locale variants
    entry[key] = line.slice(eq + 1).trim();
  }

  if (!sawSection || Object.keys(entry).length === 0) return null;
  return entry;
}

function truthy(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "true";
}

/** Production deps: real fs + the process environment. */
function defaultDeps(): AppScannerDeps {
  const xdgDataHome =
    process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
  return {
    // System dir first, user-local second — the user's copy of the same
    // desktopFileId wins (XDG precedence).
    appsDirs: () => [
      "/usr/share/applications",
      path.join(xdgDataHome, "applications"),
    ],
    pathEnv: () => process.env.PATH ?? "",
    readTextFile: (filePath) => fs.promises.readFile(filePath, "utf-8"),
    listDir: (dir) => fs.promises.readdir(dir),
    isExecutableFile: (filePath) => {
      try {
        fs.accessSync(filePath, fs.constants.X_OK);
        return fs.statSync(filePath).isFile();
      } catch {
        return false;
      }
    },
  };
}

export class AppScanner {
  private readonly deps: AppScannerDeps;

  constructor(deps?: Partial<AppScannerDeps>) {
    this.deps = { ...defaultDeps(), ...deps };
  }

  /**
   * Every visible .desktop launcher from the applications dirs, sorted by
   * Name. Missing directories are skipped (fresh minimal installs may not
   * have a user-local dir); unreadable individual files are skipped, not
   * fatal — one broken .desktop must not empty the picker.
   */
  async listDesktopApps(): Promise<DesktopApp[]> {
    const byId = new Map<string, DesktopApp>();

    for (const dir of this.deps.appsDirs()) {
      let fileNames: string[];
      try {
        fileNames = await this.deps.listDir(dir);
      } catch {
        continue; // directory absent/unreadable — nothing to contribute
      }

      for (const fileName of fileNames) {
        if (!fileName.toLowerCase().endsWith(".desktop")) continue;

        let content: string;
        try {
          content = await this.deps.readTextFile(path.join(dir, fileName));
        } catch {
          continue;
        }

        const entry = parseDesktopEntry(content);
        if (!entry) continue;
        if (truthy(entry.NoDisplay) || truthy(entry.Hidden)) continue;

        byId.set(fileName, {
          desktopFileId: fileName,
          name: entry.Name || fileName.replace(/\.desktop$/i, ""),
          icon: entry.Icon,
          exec: entry.Exec,
          startupWMClass: entry.StartupWMClass,
        });
      }
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Executables on PATH, deduped by name (first dir on PATH wins), sorted by
   * name, capped at DEFAULT_CLI_RESULT_CAP. Directories and non-executable
   * entries are skipped; missing PATH dirs are skipped.
   */
  async listCliTools(): Promise<CliTool[]> {
    const byName = new Map<string, CliTool>();
    const dirs = this.deps
      .pathEnv()
      .split(":")
      .filter((dir) => dir !== "");

    scan: for (const dir of dirs) {
      let names: string[];
      try {
        names = await this.deps.listDir(dir);
      } catch {
        continue;
      }

      for (const name of names) {
        if (byName.has(name)) continue;
        const fullPath = path.join(dir, name);
        if (!this.deps.isExecutableFile(fullPath)) continue;
        byName.set(name, { name, path: fullPath });
        if (byName.size >= DEFAULT_CLI_RESULT_CAP) break scan;
      }
    }

    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
}
