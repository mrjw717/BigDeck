// ============================================================================
// BigDeck - Elgato .sdPlugin Manifest Parser
//
// Parses and validates Stream Deck plugin `manifest.json` files (SDK v2
// schema) per docs/SDPLUGIN-COMPAT.md, and resolves the CodePath BigDeck
// should launch on the current platform.
//
// BigDeck runs on Linux, but most published plugins declare only mac and/or
// windows OS entries. Policy (from the compat spec):
// - An explicit `CodePath` wins over platform-specific entries — it is the
//   author's cross-platform declaration.
// - Otherwise fall back to `CodePathMac`: a large share of mac codepaths are
//   Node/Python/shell scripts that run unchanged on Linux.
// - A plugin whose OS[] has no `linux` entry is flagged `unverified`: we
//   still attempt to run it ("attempt to run anyway"), and the UI (later
//   phase) surfaces a per-plugin "platform unverified" badge.
// - `PrivateAPI: true` marks built-in Elgato plugins that must never be
//   spawned from disk; the plugin loader refuses them (parse still succeeds
//   so the UI can show why a bundled plugin was skipped).
//
// Parsing is deliberately structural and dependency-free: the manifest comes
// from untrusted packages, so every field is type-checked before use and all
// problems are collected (not fail-fast) to give useful install errors.
// ============================================================================

import path from "path";

/** Controller kinds an action can be placed on. */
export type SDController = "Keypad" | "Encoder";

export interface SDManifestOS {
  Platform: "mac" | "windows" | "linux";
  MinimumVersion?: string;
}

export interface SDManifestActionState {
  Image?: string;
  MultiTouchLayout?: string;
}

export interface SDManifestAction {
  UUID: string;
  Name: string;
  Icon?: string;
  PropertyInspectorPath?: string;
  Controllers?: SDController[];
  States?: SDManifestActionState[];
  Tooltip?: string;
  /** Encoder styling (StackColor etc.) — passed through unvalidated. */
  Encoder?: Record<string, unknown>;
}

/** Validated subset of the SDK v2 manifest that BigDeck honors. */
export interface SDManifest {
  Name: string;
  UUID: string;
  Version: string;
  Author?: string;
  Description?: string;
  URL?: string;
  Icon?: string;
  Actions: SDManifestAction[];
  CodePath?: string;
  CodePathMac?: string;
  CodePathWin?: string;
  PropertyInspectorPath?: string;
  SDKVersion?: number | string;
  Software?: { MinimumVersion?: string };
  OS?: SDManifestOS[];
  /** Built-in Elgato plugin — must never be spawned from disk. */
  PrivateAPI?: boolean;
}

export interface SDManifestParseResult {
  ok: boolean;
  manifest: SDManifest | null;
  /** All validation problems found (collected, not fail-fast). */
  errors: string[];
}

export type SDCodePathSource = "CodePath" | "CodePathMac" | "CodePathWin" | null;

export interface SDCodePathResolution {
  /** Absolute path to launch, or null when no usable entry exists. */
  codePath: string | null;
  /** Which manifest key the path came from (null when none). */
  source: SDCodePathSource;
  /** "verified" only when OS[] explicitly lists linux; else "unverified". */
  platformStatus: "verified" | "unverified";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Parse and validate a raw manifest.json payload. Collects every validation
 * problem into `errors`; `ok` is true only when none were found. Unknown
 * extra fields are preserved by the caller if needed — we only validate what
 * BigDeck consumes.
 */
export function parseSDManifest(raw: unknown): SDManifestParseResult {
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return {
      ok: false,
      manifest: null,
      errors: ["manifest.json: expected a JSON object"],
    };
  }

  // ---- Required identity fields -------------------------------------------
  if (!nonEmptyString(raw.UUID)) errors.push("UUID: missing or empty");
  if (!nonEmptyString(raw.Name)) errors.push("Name: missing or empty");
  if (!nonEmptyString(raw.Version) && typeof raw.Version !== "number") {
    errors.push("Version: missing or empty");
  }

  // ---- Actions[] -----------------------------------------------------------
  const actions: SDManifestAction[] = [];
  if (raw.Actions !== undefined) {
    if (!Array.isArray(raw.Actions)) {
      errors.push("Actions: expected an array");
    } else {
      raw.Actions.forEach((entry, i) => {
        if (!isPlainObject(entry)) {
          errors.push(`Actions[${i}]: expected an object`);
          return;
        }
        if (!nonEmptyString(entry.UUID)) {
          errors.push(`Actions[${i}].UUID: missing or empty`);
          return;
        }
        if (!nonEmptyString(entry.Name)) {
          errors.push(`Actions[${i}].Name: missing or empty`);
          return;
        }

        const action: SDManifestAction = {
          UUID: entry.UUID,
          Name: entry.Name,
        };
        if (nonEmptyString(entry.Icon)) action.Icon = entry.Icon;
        if (nonEmptyString(entry.PropertyInspectorPath)) {
          action.PropertyInspectorPath = entry.PropertyInspectorPath;
        }
        if (nonEmptyString(entry.Tooltip)) action.Tooltip = entry.Tooltip;

        if (entry.Controllers !== undefined) {
          if (!Array.isArray(entry.Controllers)) {
            errors.push(`Actions[${i}].Controllers: expected an array`);
          } else {
            const controllers: SDController[] = [];
            for (const c of entry.Controllers) {
              if (c === "Keypad" || c === "Encoder") controllers.push(c);
              else errors.push(`Actions[${i}].Controllers: unknown value "${String(c)}"`);
            }
            if (controllers.length > 0) action.Controllers = controllers;
          }
        }

        if (entry.States !== undefined) {
          if (!Array.isArray(entry.States)) {
            errors.push(`Actions[${i}].States: expected an array`);
          } else {
            const states: SDManifestActionState[] = [];
            for (const s of entry.States) {
              if (!isPlainObject(s)) {
                errors.push(`Actions[${i}].States: expected objects`);
                continue;
              }
              const state: SDManifestActionState = {};
              if (nonEmptyString(s.Image)) state.Image = s.Image;
              if (nonEmptyString(s.MultiTouchLayout)) {
                state.MultiTouchLayout = s.MultiTouchLayout;
              }
              states.push(state);
            }
            action.States = states;
          }
        }

        if (isPlainObject(entry.Encoder)) {
          action.Encoder = entry.Encoder;
        }

        actions.push(action);
      });
    }
  }

  // ---- Optional passthrough fields (validated lightly) ---------------------
  const manifest: SDManifest = {
    Name: nonEmptyString(raw.Name) ? raw.Name : "",
    UUID: nonEmptyString(raw.UUID) ? raw.UUID : "",
    Version: String(raw.Version ?? ""),
    Actions: actions,
  };

  if (nonEmptyString(raw.Author)) manifest.Author = raw.Author;
  if (nonEmptyString(raw.Description)) manifest.Description = raw.Description;
  if (nonEmptyString(raw.URL)) manifest.URL = raw.URL;
  if (nonEmptyString(raw.Icon)) manifest.Icon = raw.Icon;
  if (nonEmptyString(raw.CodePath)) manifest.CodePath = raw.CodePath;
  if (nonEmptyString(raw.CodePathMac)) manifest.CodePathMac = raw.CodePathMac;
  if (nonEmptyString(raw.CodePathWin)) manifest.CodePathWin = raw.CodePathWin;
  if (nonEmptyString(raw.PropertyInspectorPath)) {
    manifest.PropertyInspectorPath = raw.PropertyInspectorPath;
  }
  if (typeof raw.SDKVersion === "number" || nonEmptyString(raw.SDKVersion)) {
    manifest.SDKVersion = raw.SDKVersion as number | string;
  }
  if (isPlainObject(raw.Software)) {
    const software: { MinimumVersion?: string } = {};
    if (nonEmptyString(raw.Software.MinimumVersion)) {
      software.MinimumVersion = raw.Software.MinimumVersion;
    }
    manifest.Software = software;
  }
  if (raw.OS !== undefined) {
    if (!Array.isArray(raw.OS)) {
      errors.push("OS: expected an array");
    } else {
      const osList: SDManifestOS[] = [];
      for (const entry of raw.OS) {
        if (
          isPlainObject(entry) &&
          (entry.Platform === "mac" || entry.Platform === "windows" || entry.Platform === "linux")
        ) {
          const os: SDManifestOS = { Platform: entry.Platform };
          if (nonEmptyString(entry.MinimumVersion)) {
            os.MinimumVersion = entry.MinimumVersion;
          }
          osList.push(os);
        } else {
          errors.push(`OS: invalid entry ${JSON.stringify(entry)}`);
        }
      }
      manifest.OS = osList;
    }
  }
  if (typeof raw.PrivateAPI === "boolean") manifest.PrivateAPI = raw.PrivateAPI;

  return { ok: errors.length === 0, manifest: errors.length === 0 ? manifest : null, errors };
}

/**
 * Resolve which code entry point to launch on this platform.
 *
 * Candidates in priority order: explicit `CodePath`, then the
 * platform-specific entry (`CodePathMac` on linux/darwin — see the header
 * comment for why mac is the sensible fallback on linux). A candidate is
 * skipped when the injected `fileExists` predicate rejects it, so the loader
 * can avoid selecting entries whose files are missing from the package.
 * `fileExists` is injected (defaults to "accept") to keep this pure/testable.
 */
export function resolveCodePath(
  manifest: SDManifest,
  opts: {
    pluginDir: string;
    platform?: NodeJS.Platform;
    fileExists?: (absolutePath: string) => boolean;
  },
): SDCodePathResolution {
  const platform = opts.platform ?? process.platform;
  const fileExists = opts.fileExists ?? (() => true);

  const platformStatus: "verified" | "unverified" =
    manifest.OS?.some((e) => e.Platform === "linux") === true ? "verified" : "unverified";

  const platformKey: SDCodePathSource =
    platform === "win32" ? "CodePathWin" : "CodePathMac";

  const candidates: Array<{ key: SDCodePathSource; value?: string }> = [
    { key: "CodePath", value: manifest.CodePath },
    { key: platformKey, value: manifest[platformKey] },
  ];

  for (const candidate of candidates) {
    if (!nonEmptyString(candidate.value)) continue;
    const absolute = path.isAbsolute(candidate.value)
      ? candidate.value
      : path.join(opts.pluginDir, candidate.value);
    if (fileExists(absolute)) {
      return { codePath: absolute, source: candidate.key, platformStatus };
    }
  }

  return { codePath: null, source: null, platformStatus };
}
