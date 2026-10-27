// ============================================================================
// BigDeck - Elgato .sdPlugin Locale Files (<lang>.json)
//
// Bundled SD plugins ship per-language translation files NEXT TO
// manifest.json (`en.json`, `de.json`, ...). The official app loads the one
// matching the application language (falling back to `en.json`) and uses it
// to display the plugin's and its actions' localized names in the action
// catalog.
//
// Schema (recovered from the bundled Stream Deck 7.x plugins, e.g.
// com.elgato.streamdeck.system.hotkey.sdPlugin/en.json):
//
//   {
//     "Name": "Activate a Key Command",     // localized PLUGIN name
//     "Description": "Activate a key command",
//
//     "com.elgato.streamdeck.system.hotkey": {   // ACTION UUID — TOP LEVEL
//       "Name": "Hotkey",                        //   (NOT nested under an
//       "Tooltip": "Activate a key command"      //    "Actions" key)
//     }
//   }
//
// Action entries may carry additional nested payload (e.g. the Dials plugin
// puts an "Encoder" object with trigger descriptions under the action entry);
// BigDeck only consumes Name/Tooltip and ignores everything else.
//
// Loading is deliberately tolerant — matching the host's overall posture
// toward plugin-packaged data: a missing file is normal (the manifest's
// English names win), a malformed one is skipped with a warning, and no
// failure ever escapes loadSdLocale().
// ============================================================================

import fs from "fs";
import path from "path";

/** Localized strings for one action, keyed by its manifest UUID. */
export interface SDLocaleActionEntry {
  Name?: string;
  Tooltip?: string;
}

/** Parsed `<lang>.json` contents. */
export interface SDLocale {
  /** Localized plugin name (falls back to manifest.Name in the host). */
  Name?: string;
  /** Localized plugin description. */
  Description?: string;
  /** Action entries keyed by action UUID. */
  actions: Record<string, SDLocaleActionEntry>;
}

export interface SDLocaleResolution {
  locale: SDLocale | null;
  /** The language file that was actually loaded ("de", "en", ...), or null. */
  language: string | null;
  /** Absolute path of the loaded file, or null. */
  file: string | null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Normalize an app language tag to the file-stem the official app uses:
 * "en-US" → "en", "zh_CN" → "zh". Unparseable/empty input falls back to "en"
 * (the SDK's universal fallback language).
 */
export function normalizeSdLanguage(raw: unknown): string {
  const lower = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const base = lower.split(/[-_.]/, 1)[0];
  return /^[a-z]{2,3}$/.test(base) ? base : "en";
}

/** Parse a raw locale payload; tolerant of junk (returns only what we use). */
export function parseSdLocale(raw: unknown): SDLocale {
  const locale: SDLocale = { actions: {} };
  if (!isPlainObject(raw)) return locale;

  if (nonEmptyString(raw.Name)) locale.Name = raw.Name;
  if (nonEmptyString(raw.Description)) locale.Description = raw.Description;

  // Every other top-level key is an action UUID ("Actions" is NOT part of
  // the observed schema — action entries sit at the top level).
  for (const [key, value] of Object.entries(raw)) {
    if (key === "Name" || key === "Description" || !isPlainObject(value)) continue;
    const entry: SDLocaleActionEntry = {};
    if (nonEmptyString(value.Name)) entry.Name = value.Name;
    if (nonEmptyString(value.Tooltip)) entry.Tooltip = value.Tooltip;
    locale.actions[key] = entry;
  }
  return locale;
}

/**
 * Minimal logger slice the loader needs. Declared with method syntax so the
 * real Logger (winston's overloaded warn) is structurally assignable.
 */
export interface SDLocaleLogger {
  warn(...args: unknown[]): void;
}

/**
 * Load the locale file matching `language` from a plugin directory, falling
 * back to `en.json` (the official app's fallback). Returns a null resolution
 * when neither exists — callers keep manifest names.
 *
 * Synchronous on purpose: called once per plugin at discovery, files are
 * tiny, and the host's settings layer is already sync-read (SDJsonStore).
 */
export function loadSdLocale(
  pluginDir: string,
  language: string,
  logger?: SDLocaleLogger,
): SDLocaleResolution {
  const lang = normalizeSdLanguage(language);
  const candidates = lang === "en" ? ["en"] : [lang, "en"];

  for (const candidate of candidates) {
    const file = path.join(pluginDir, `${candidate}.json`);
    let raw: string;
    try {
      raw = fs.readFileSync(file, "utf-8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT" && logger) {
        logger.warn(`[sd] locale file ${file} is unreadable; skipping`, err);
      }
      continue;
    }
    try {
      return { locale: parseSdLocale(JSON.parse(raw)), language: candidate, file };
    } catch (err) {
      if (logger) {
        logger.warn(`[sd] locale file ${file} is malformed JSON; skipping`, err);
      }
      continue;
    }
  }
  return { locale: null, language: null, file: null };
}
