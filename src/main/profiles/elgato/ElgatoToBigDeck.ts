// ============================================================================
// BigDeck - Elgato Profile → BigDeck Profile Converter
//
// Converts a parsed Elgato .streamDeckProfile bundle (see ElgatoProfileParser)
// into a BigDeck Profile. One BigDeck page is produced from the chosen serial
// copy's "Keypad" controller; Encoder (dials/touch) actions are reported as
// not imported.
//
// Coordinates: Elgato keys are "col,row" — BigDeck keyIndex = row * columns +
// col, with columns/rows from DEVICE_SPECS for the target deviceType.
//
// deviceType inference: the Elgato file format carries NO device model field,
// so it is inferred from the keypad's filled coordinate extent, matched
// against DEVICE_SPECS. When several models share a size the canonical
// (non-variant) name wins (xl over xl-v2, original over mk2/original-v2, plus
// over neo, mini over mini-mk2). Callers may override explicitly.
//
// Action UUID mapping (UUIDs verified against shipped DefaultProfiles):
//
//   com.elgato.streamdeck.system.hotkey    → keyboard-shortcut
//     Settings.Hotkeys[]: the first entry with VKeyCode != -1 is the combo
//     (remaining entries = macro sequences BigDeck can't express as a chord —
//     dropped with a warning). VKeyCode follows macOS virtual keycodes in all
//     real-world mac-authored profiles (the only kind Elgato ships); codes
//     outside the table are skipped with a report entry. Windows-authored
//     profiles use Windows VK codes and are NOT supported by this table yet.
//     Modifiers: KeyCtrl→ctrl, KeyShift→shift, KeyCmd→super (mac ⌘ ≈ Linux
//     super), KeyAlt→alt, else KeyOption→alt (⌥ fallback).
//   com.elgato.streamdeck.system.website   → open-url (Settings.path; "Url"
//     accepted as an older spelling)
//   com.elgato.streamdeck.system.open      → launch-app / open-url /
//     open-folder (Settings.path, quoted — heuristic below)
//   com.elgato.streamdeck.system.openapp   → launch-app (Settings.path)
//   com.elgato.streamdeck.system.multimedia→ multimedia (Settings.actionIdx,
//     table verified against the official XL default profile icons:
//     0=previous, 1=play-pause, 2=next, 3=stop, 4=mute, 5=volume-up,
//     6=volume-down)
//   com.elgato.streamdeck.system.sleep     → system-sleep
//   com.elgato.streamdeck.system.text      → macro (type pastedText; plus an
//     "enter" key step when isSendingEnter)
//   com.elgato.streamdeck.system.close     → close-app (Settings.path target)
//
//   Deliberately NOT imported (each becomes a skippedKeys report entry):
//   - system.keybrightness: Elgato's action is a ±delta step, BigDeck's
//     key-brightness is an absolute set — conversion would silently change
//     behavior.
//   - profile.openchild / profile.backtoparent: cross-.sdProfile profile
//     references — unresolvable in a single-file import.
//   - page.next / page.previous: relative page navigation; the v1 import
//     produces a single page.
//   - ANY other known-shape UUID (e.g. com.elgato.discord.mute): converted
//     to an SD-PLUGIN action ({ pluginUUID, actionUUID, settings }) so the
//     key works the moment the user installs that plugin — the SD host
//     already dispatches by UUID, and the imported image layers still show
//     the button art. pluginUUID is the longest installed-plugin prefix of
//     the UUID when the host knows one (action UUIDs may carry dots), else
//     the UUID minus its last dot-segment. Only truly malformed UUIDs (no
//     splittable plugin boundary) are dropped and reported.
//
// deviceType resolution order (convertElgatoProfile): explicit option →
// profile NAME keyword ("Discord (XL)" → xl) → filled-extent match →
// "original". The name check runs before the extent because sparse profiles
// fill only part of their grid — a Discord XL profile with 10 keys spread
// over columns 0-5 fills a 6x3 extent, which matches NO device footprint and
// used to fall through to "original" (wrong key size, scrambled keyIndex
// mapping). Coordinates are then CLAMPED onto the target grid (identity
// when the grids match), so e.g. an XL-authored key at "7,3" still lands on
// the bottom-right corner of a 5x3 device instead of overflowing it.
// ============================================================================

import fsp from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { DEVICE_SPECS } from "../../../shared/constants";
import type {
  Action,
  DeviceType,
  KeyConfig,
  KeyLayer,
  MacroStep,
  MultimediaAction,
  Profile,
} from "../../../shared/types";
import {
  parseElgatoCoordinate,
  type ElgatoAction,
  type ElgatoProfileBundle,
} from "./ElgatoProfileParser";

// ---------------------------------------------------------------------------
// macOS virtual keycode → BigDeck key name (the lowercase xdotool-style
// vocabulary EVDEV_KEY_CODES / ActionExecutor accept). Values are the
// HIToolbox kVK_* constants mac-authored profiles store in VKeyCode.
// ---------------------------------------------------------------------------

export const MAC_VK_TO_KEY: Record<number, string> = {
  // letters (kVK_ANSI_*)
  0: "a", 1: "s", 2: "d", 3: "f", 4: "h", 5: "g", 6: "z", 7: "x",
  8: "c", 9: "v", 11: "b", 12: "q", 13: "w", 14: "e", 15: "r", 16: "y",
  17: "t", 31: "o", 32: "u", 34: "i", 35: "p", 37: "l", 38: "j", 40: "k",
  45: "n", 46: "m",
  // digits (note the mac row order: 5/6 and 7/8/9 swap vs physical keycode)
  18: "1", 19: "2", 20: "3", 21: "4", 22: "6", 23: "5", 26: "7", 28: "8",
  25: "9", 29: "0",
  // punctuation
  24: "equal", 27: "minus", 30: "bracketright", 33: "bracketleft",
  41: "semicolon", 39: "apostrophe", 43: "comma", 47: "period", 44: "slash",
  42: "backslash", 50: "grave",
  // specials
  49: "space", 36: "return", 48: "tab", 53: "escape", 51: "backspace",
  117: "delete", 115: "home", 119: "end", 116: "pageup", 121: "pagedown",
  123: "left", 124: "right", 125: "down", 126: "up",
  // function keys
  122: "f1", 120: "f2", 99: "f3", 118: "f4", 96: "f5", 97: "f6", 98: "f7",
  100: "f8", 101: "f9", 109: "f10", 103: "f11", 111: "f12",
};

// ---------------------------------------------------------------------------
// system.multimedia Settings.actionIdx → BigDeck mediaCommand (icon-verified
// against the official XL default profile; 3=stop is the unshipped gap).
// ---------------------------------------------------------------------------

export const MULTIMEDIA_ACTION_IDX: Record<number, string> = {
  0: "previous",
  1: "play-pause",
  2: "next",
  3: "stop",
  4: "mute",
  5: "volume-up",
  6: "volume-down",
};

/** Canonical DeviceType picks when several models share a footprint. */
const DEVICE_TYPE_INFERENCE_ORDER: DeviceType[] = [
  "xl", "original", "mini", "plus", "pedal", "neo", "mk2", "studio",
  "original-v2", "xl-v2", "mini-mk2",
];

/**
 * Profile-name keyword → canonical DeviceType, in match-priority order.
 * Checked against tokenized names (see inferDeviceTypeFromName).
 */
const NAME_DEVICE_KEYWORDS: Array<readonly [string, DeviceType]> = [
  ["xl", "xl"],
  ["mini", "mini"],
  ["plus", "plus"],
  ["neo", "neo"],
  ["pedal", "pedal"],
  ["mk2", "mk2"],
];

export interface ElgatoSkippedKey {
  keyIndex: number;
  uuid: string;
  reason: string;
}

export interface ElgatoConversionResult {
  /** Ready for ProfileManager.createProfile (ids/dates added there). */
  profile: Omit<Profile, "id" | "createdAt" | "updatedAt">;
  importedKeys: number;
  skippedKeys: ElgatoSkippedKey[];
  warnings: string[];
}

export interface ElgatoConvertOptions {
  /** Overrides footprint-based deviceType inference when set. */
  deviceType?: DeviceType;
  /**
   * Zip file base name (no extension) — used as the profile name when the
   * Elgato file doesn't carry one.
   */
  sourceName?: string;
  /**
   * Plugin UUIDs already installed in the SD-plugin host. Unknown-UUID
   * conversions use it to find the real plugin boundary (action UUIDs may
   * carry dots) and to keep the "not installed yet" report note off keys
   * whose plugin IS installed.
   */
  installedSdPlugins?: string[];
  /**
   * Import a referenced PNG into BigDeck's asset store. Receives the absolute
   * path inside the extraction dir and a suggested file name; returns the
   * stored asset reference (bare file name, per the ASSET_UPLOAD convention),
   * or null on failure. The converter wraps it as
   * `bigdeck-asset://<encodeURIComponent(name)>` — KeyRenderer only resolves
   * that scheme (or absolute paths), so a bare name would fall through to a
   * CWD-relative open and the layer would silently render nothing.
   */
  importImage: (
    absolutePath: string,
    suggestedName: string,
  ) => Promise<string | null>;
}

// --- lenient Settings readers ----------------------------------------------

function settingsString(
  settings: Record<string, unknown> | undefined,
  ...keys: string[]
): string | undefined {
  if (!settings) return undefined;
  for (const key of keys) {
    const value = settings[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function settingsNumber(
  settings: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  const value = settings?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function settingsBool(
  settings: Record<string, unknown> | undefined,
  key: string,
): boolean | undefined {
  const value = settings?.[key];
  return typeof value === "boolean" ? value : undefined;
}

/** Elgato wraps paths in literal double quotes ("\"/Applications/…\""). */
function stripElgatoQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

// --- converters -------------------------------------------------------------

interface ElgatoHotkeyEntry {
  VKeyCode?: unknown;
  KeyCtrl?: unknown;
  KeyShift?: unknown;
  KeyCmd?: unknown;
  KeyAlt?: unknown;
  KeyOption?: unknown;
}

function isHotkeyEntry(value: unknown): value is ElgatoHotkeyEntry {
  return typeof value === "object" && value !== null;
}

/**
 * Convert system.hotkey Settings.Hotkeys → shortcut parts, or null when no
 * entry maps. `warnings` collects non-fatal notes (extra macro-sequence
 * hotkeys dropped, unmappable keycodes).
 */
export function convertHotkeySettings(
  settings: Record<string, unknown> | undefined,
  warnings: string[],
): { keys: string[]; modifiers: Array<"ctrl" | "alt" | "shift" | "super"> } | null {
  const raw = settings?.Hotkeys;
  if (!Array.isArray(raw)) return null;
  const entries = raw.filter(isHotkeyEntry);

  // VKeyCode -1 marks unused recorder slots — skip them.
  const valid = entries.filter(
    (e) => typeof e.VKeyCode === "number" && e.VKeyCode !== -1,
  );
  if (valid.length === 0) return null;

  const first = valid[0];
  const vkeyCode = first.VKeyCode as number;
  const keyName = MAC_VK_TO_KEY[vkeyCode];
  if (!keyName) {
    warnings.push(
      `hotkey VKeyCode ${vkeyCode} not in macOS keycode table — entry skipped`,
    );
    return null;
  }
  if (valid.length > 1) {
    warnings.push(
      `hotkey combo holds ${valid.length} sequential keys; only the first ("${keyName}") imported`,
    );
  }

  const modifiers: Array<"ctrl" | "alt" | "shift" | "super"> = [];
  if (first.KeyCtrl === true) modifiers.push("ctrl");
  if (first.KeyShift === true) modifiers.push("shift");
  if (first.KeyCmd === true) modifiers.push("super");
  // KeyAlt wins; KeyOption (mac ⌥) is the fallback — both mean alt on Linux.
  if (first.KeyAlt === true || first.KeyOption === true) modifiers.push("alt");

  return { keys: [keyName], modifiers };
}

/**
 * system.open / system.openapp path → the closest BigDeck action type.
 * URLs → open-url; executable-ish targets → launch-app; everything else
 * (folders, documents) → open-folder, which xdg-open can handle on Linux.
 */
export function classifyOpenPath(
  rawPath: string,
): { type: "open-url" | "launch-app" | "open-folder"; value: string } {
  const value = stripElgatoQuotes(rawPath);
  if (/^https?:\/\//i.test(value)) return { type: "open-url", value };
  if (/\.(app|exe|desktop|sh|bin|appimage)$/i.test(value)) {
    return { type: "launch-app", value };
  }
  return { type: "open-folder", value };
}

/**
 * Build the BigDeck action for one placed Elgato action, or null when the
 * UUID is unsupported (reason returned for the report). UUIDs with no
 * built-in mapping become SD-plugin actions (see splitSdPluginUuid) so
 * third-party keys work once the user installs that plugin.
 */
export function convertElgatoAction(
  elgato: ElgatoAction,
  warnings: string[],
  installedSdPlugins?: string[],
): { action: Action; reason?: undefined } | { action?: undefined; reason: string } {
  const uuid = elgato.UUID ?? "";
  const settings = elgato.Settings;
  const name = elgato.Name ?? "";

  switch (uuid) {
    case "com.elgato.streamdeck.system.hotkey": {
      const combo = convertHotkeySettings(settings, warnings);
      if (!combo) {
        return {
          reason: "hotkey has no mappable macOS VKeyCode entry",
        };
      }
      return {
        action: {
          type: "keyboard-shortcut",
          id: elgato.ActionID ?? uuidv4(),
          name: name || "Hotkey",
          keys: combo.keys,
          modifiers: combo.modifiers,
        },
      };
    }

    case "com.elgato.streamdeck.system.website": {
      const url = settingsString(settings, "path", "Url", "url");
      if (!url) return { reason: "website action has no path" };
      return {
        action: {
          type: "open-url",
          id: elgato.ActionID ?? uuidv4(),
          name: name || "Website",
          url,
        },
      };
    }

    case "com.elgato.streamdeck.system.open":
    case "com.elgato.streamdeck.system.openapp": {
      const rawPath = settingsString(settings, "path");
      if (!rawPath) return { reason: "open action has no path" };
      const classified = classifyOpenPath(rawPath);
      if (classified.type === "open-url") {
        return {
          action: {
            type: "open-url",
            id: elgato.ActionID ?? uuidv4(),
            name: name || "Open",
            url: classified.value,
          },
        };
      }
      if (classified.type === "launch-app") {
        return {
          action: {
            type: "launch-app",
            id: elgato.ActionID ?? uuidv4(),
            name: name || "Open App",
            command: classified.value,
          },
        };
      }
      return {
        action: {
          type: "open-folder",
          id: elgato.ActionID ?? uuidv4(),
          name: name || "Open Folder",
          path: classified.value,
        },
      };
    }

    case "com.elgato.streamdeck.system.multimedia": {
      const idx = settingsNumber(settings, "actionIdx");
      const mediaCommand =
        idx !== undefined ? MULTIMEDIA_ACTION_IDX[idx] : undefined;
      if (!mediaCommand) {
        return {
          reason: `multimedia actionIdx ${idx ?? "?"} outside the known table`,
        };
      }
      return {
        action: {
          type: "multimedia",
          id: elgato.ActionID ?? uuidv4(),
          name: name || "Multimedia",
          mediaCommand: mediaCommand as MultimediaAction["mediaCommand"],
        },
      };
    }

    case "com.elgato.streamdeck.system.sleep":
      return {
        action: {
          type: "system-sleep",
          id: elgato.ActionID ?? uuidv4(),
          name: name || "Sleep",
        },
      };

    case "com.elgato.streamdeck.system.text": {
      const text = settingsString(settings, "pastedText", "Text");
      if (text === undefined) {
        return { reason: "text action has no pastedText" };
      }
      const steps: MacroStep[] = [{ type: "text", value: text }];
      if (settingsBool(settings, "isSendingEnter") === true) {
        steps.push({ type: "key", value: "enter" });
      }
      return {
        action: {
          type: "macro",
          id: elgato.ActionID ?? uuidv4(),
          name: name || "Text",
          steps,
        },
      };
    }

    case "com.elgato.streamdeck.system.close": {
      const target = settingsString(settings, "path", "Name", "name");
      if (!target) return { reason: "close action has no target path" };
      return {
        action: {
          type: "close-app",
          id: elgato.ActionID ?? uuidv4(),
          name: name || "Close App",
          target: stripElgatoQuotes(target),
        },
      };
    }

    case "com.elgato.streamdeck.system.keybrightness":
      return {
        reason:
          "brightness increment/decrement unsupported (BigDeck key-brightness is an absolute set)",
      };

    case "com.elgato.streamdeck.profile.openchild":
    case "com.elgato.streamdeck.profile.backtoparent":
      return {
        reason:
          "cross-profile navigation unresolvable in a single-file import",
      };

    case "com.elgato.streamdeck.page.next":
    case "com.elgato.streamdeck.page.previous":
      return {
        reason:
          "relative page navigation unsupported (import produces a single page)",
      };

    default: {
      // No built-in mapping — treat the UUID as an SD-plugin action (see the
      // header comment): the SD host dispatches by UUID, so the key works
      // the moment the user installs that plugin.
      const pluginUUID = splitSdPluginUuid(uuid, installedSdPlugins);
      if (!pluginUUID) {
        return { reason: `unknown action UUID "${uuid}"` };
      }
      return {
        action: {
          type: "sdplugin",
          id: elgato.ActionID ?? uuidv4(),
          name: name || uuid,
          pluginUUID,
          actionUUID: uuid,
          settings,
        },
      };
    }
  }
}

// --- layers -----------------------------------------------------------------

/** Collapse the "Screen\n\n\n\nShot" spacer-newline pattern to one space. */
export function normalizeElgatoTitle(title: string): string {
  return title.replace(/\s*\n+\s*/g, " ").trim();
}

function titleVerticalPercent(alignment: string | undefined): number {
  switch (alignment) {
    case "top":
      return 18;
    case "center":
      return 50;
    case "bottom":
      return 82;
    default:
      return 50;
  }
}

// --- device inference ---------------------------------------------------------

/**
 * Infer the BigDeck deviceType from the filled keypad extent. Returns the
 * canonical type for the footprint, or null when no DEVICE_SPECS entry
 * matches (caller decides the fallback).
 */
export function inferDeviceType(
  maxCol: number,
  maxRow: number,
): DeviceType | null {
  for (const type of DEVICE_TYPE_INFERENCE_ORDER) {
    const spec = DEVICE_SPECS[type];
    if (spec.columns === maxCol && spec.rows === maxRow) return type;
  }
  return null;
}

/**
 * Infer the BigDeck deviceType from the profile NAME: a device keyword
 * (xl, mini, plus, neo, pedal, mk2) beats footprint guessing, because a
 * sparse profile fills only part of its grid and its filled extent matches
 * no device (a Discord XL profile's 10 keys spread wide fill a 6x3 extent).
 *
 * Names are tokenized on non-alphanumerics AND camelCase transitions, with
 * dots stripped first, so "Discord (XL)", "StreamDeckXL_macDefault" and
 * "Stream Deck MK.2" all expose their keyword. When SEVERAL keywords match
 * (the combined "StreamDeckPlusXL_macDefault" default profile), the source
 * footprint breaks the tie; ties beyond that fall back to keyword priority.
 * Returns null when no keyword is present (caller falls back to extent
 * inference).
 */
export function inferDeviceTypeFromName(
  name: string,
  filledCols = 0,
  filledRows = 0,
): DeviceType | null {
  if (!name) return null;
  const tokens = name
    .replace(/\./g, "") // "MK.2" → "MK2"
    .split(/[^A-Za-z0-9]+/)
    .flatMap((part) => part.split(/(?<=[a-z])(?=[A-Z])/))
    .map((part) => part.toLowerCase());
  const matched = NAME_DEVICE_KEYWORDS.filter(([keyword]) =>
    tokens.includes(keyword),
  ).map(([, type]) => type);
  if (matched.length === 0) return null;
  if (matched.length === 1) return matched[0];
  const extentMatch = matched.find((type) => {
    const spec = DEVICE_SPECS[type];
    return spec.columns === filledCols && spec.rows === filledRows;
  });
  return extentMatch ?? matched[0];
}

// --- SD-plugin action mapping ---------------------------------------------------

/**
 * Split an unknown Elgato action UUID into its SD-plugin UUID. An installed
 * plugin that prefixes the UUID wins (the longest match — action UUIDs may
 * carry dots, e.g. com.elgato.discord.pushto.talk); with no install info the
 * fallback is the UUID minus its last dot-segment. Returns null for
 * malformed UUIDs with no splittable plugin boundary (caller skips them).
 */
export function splitSdPluginUuid(
  uuid: string,
  installedSdPlugins?: string[],
): string | null {
  let best: string | null = null;
  for (const plugin of installedSdPlugins ?? []) {
    if (
      typeof plugin === "string" &&
      plugin.length > 0 &&
      uuid.startsWith(`${plugin}.`) &&
      (best === null || plugin.length > best.length)
    ) {
      best = plugin;
    }
  }
  if (best) return best;
  const dot = uuid.lastIndexOf(".");
  // Need a non-empty plugin part AND a non-empty action part.
  if (dot <= 0 || dot === uuid.length - 1) return null;
  return uuid.slice(0, dot);
}

// --- main entry ---------------------------------------------------------------

/**
 * Convert a parsed bundle into a BigDeck profile draft. Never throws for
 * per-key problems — unsupported keys land in skippedKeys instead.
 *
 * @throws when the bundle has no usable Keypad controller at all.
 */
export async function convertElgatoProfile(
  bundle: ElgatoProfileBundle,
  options: ElgatoConvertOptions,
): Promise<ElgatoConversionResult> {
  const skippedKeys: ElgatoSkippedKey[] = [];
  const warnings = [...bundle.warnings];

  const keypad = (bundle.deviceManifest.Controllers ?? []).find(
    (c) => c.Type === "Keypad",
  );
  const encoderControllers = (bundle.deviceManifest.Controllers ?? []).filter(
    (c) => c.Type === "Encoder",
  );
  const encoderActionCount = encoderControllers.reduce(
    (n, c) => n + Object.keys(c.Actions ?? {}).length,
    0,
  );
  if (encoderActionCount > 0) {
    warnings.push(
      `${encoderActionCount} encoder/dial action(s) not imported (dials unsupported in Elgato import v1)`,
    );
  }
  if (!keypad || Object.keys(keypad.Actions ?? {}).length === 0) {
    throw new Error("profile has no Keypad actions to import");
  }

  // Filled source extent (max col/row counts) — feeds inference and the
  // name-keyword tie-break.
  let maxCol = 0;
  let maxRow = 0;
  for (const coord of Object.keys(keypad.Actions ?? {})) {
    const parsed = parseElgatoCoordinate(coord);
    if (!parsed) {
      warnings.push(`malformed coordinate "${coord}" — action skipped`);
      continue;
    }
    maxCol = Math.max(maxCol, parsed.col + 1);
    maxRow = Math.max(maxRow, parsed.row + 1);
  }

  // deviceType resolution: explicit option → profile-name keyword → filled
  // extent → "original" (see the header comment for why the name check
  // outranks the extent).
  const deviceType: DeviceType =
    options.deviceType ??
    inferDeviceTypeFromName(bundle.name || options.sourceName || "", maxCol, maxRow) ??
    inferDeviceType(maxCol, maxRow) ??
    "original";
  const specs = DEVICE_SPECS[deviceType];

  // Placed actions, page order top-to-bottom / left-to-right. Source
  // coordinates are CLAMPED onto the target grid: identity when the grids
  // match (a sparse XL profile imported for an XL), proportional landing
  // otherwise (an XL key at "7,3" ends on the bottom-right of a 5x3 device)
  // instead of overflowing into phantom keyIndexes beyond the hardware.
  const placed: Array<{
    keyIndex: number;
    col: number;
    row: number;
    elgato: ElgatoAction;
  }> = [];
  for (const [coord, elgato] of Object.entries(keypad.Actions ?? {})) {
    const parsed = parseElgatoCoordinate(coord);
    if (!parsed) {
      // Warning already emitted in the extent loop.
      continue;
    }
    const col = Math.min(Math.max(parsed.col, 0), specs.columns - 1);
    const row = Math.min(Math.max(parsed.row, 0), specs.rows - 1);
    placed.push({
      keyIndex: row * specs.columns + col,
      col,
      row,
      elgato,
    });
  }
  placed.sort(
    (a, b) => a.keyIndex - b.keyIndex || a.row - b.row || a.col - b.col,
  );
  // Clamping can collapse several source slots onto one target key (a wide
  // XL row imported for a 5-column device): the first slot wins, later ones
  // are reported as skips so the collision is never silent.
  const claimed = new Set<number>();
  const placedSlots: typeof placed = [];
  for (const slot of placed) {
    if (claimed.has(slot.keyIndex)) {
      skippedKeys.push({
        keyIndex: slot.keyIndex,
        uuid: slot.elgato.UUID ?? "(missing)",
        reason: `rescaled onto an occupied key (target grid ${specs.columns}x${specs.rows})`,
      });
      continue;
    }
    claimed.add(slot.keyIndex);
    placedSlots.push(slot);
  }

  const keys: KeyConfig[] = [];
  for (const slot of placedSlots) {
    const key: KeyConfig = {
      id: slot.elgato.ActionID ?? uuidv4(),
      keyIndex: slot.keyIndex,
    };

    // 1. Action conversion (unsupported → report entry, no action; unknown
    //    UUID → SD-plugin action with an informational note when the plugin
    //    isn't installed yet).
    const result = convertElgatoAction(
      slot.elgato,
      warnings,
      options.installedSdPlugins,
    );
    if (result.reason !== undefined) {
      skippedKeys.push({
        keyIndex: slot.keyIndex,
        uuid: slot.elgato.UUID ?? "(missing)",
        reason: result.reason,
      });
    } else {
      key.action = result.action;
      if (
        result.action.type === "sdplugin" &&
        !(options.installedSdPlugins ?? []).includes(result.action.pluginUUID)
      ) {
        warnings.push(
          `key ${slot.keyIndex} (${slot.elgato.UUID}): imported as SD plugin action ` +
            `(plugin '${result.action.pluginUUID}' not installed yet)`,
        );
      }
    }

    // 2. Appearance: active state's image → image layer, title → text layer.
    const states = slot.elgato.States ?? [];
    const stateIndex = Math.min(
      Math.max(slot.elgato.State ?? 0, 0),
      Math.max(states.length - 1, 0),
    );
    const state = states.length > 0 ? states[stateIndex] : undefined;
    if (states.length > 1) {
      warnings.push(
        `key ${slot.keyIndex} (${slot.elgato.UUID}): ${states.length} states; only the active one imported`,
      );
    }

    const layers: KeyLayer[] = [];
    if (state?.Image) {
      // Paths are relative to the SERIAL copy dir ("Images/XXX.png"); some
      // files also carry an sdProfile-root Images/ dir — accept both. Resolve
      // defensively: a crafted path must not escape the extraction.
      const safeCandidates = [
        path.resolve(bundle.serialDir, state.Image),
        path.resolve(bundle.sdProfileDir, state.Image),
      ].filter((p) => p.startsWith(bundle.sdProfileDir + path.sep));

      // Prefer a candidate that exists on disk; else hand importImage the
      // first safe candidate so a missing file surfaces as an import warning.
      let resolvedPath: string | null = null;
      for (const candidate of safeCandidates) {
        try {
          if ((await fsp.stat(candidate)).isFile()) {
            resolvedPath = candidate;
            break;
          }
        } catch {
          // try the next base
        }
      }
      resolvedPath = resolvedPath ?? safeCandidates[0] ?? null;

      if (!resolvedPath) {
        skippedKeys.push({
          keyIndex: slot.keyIndex,
          uuid: slot.elgato.UUID ?? "(missing)",
          reason: `unsafe image path "${state.Image}"`,
        });
      } else {
        const suggestedName = `elgato-${path.basename(state.Image)}`;
        const stored = await options.importImage(resolvedPath, suggestedName);
        if (stored) {
          layers.push({
            id: uuidv4(),
            type: "image",
            visible: true,
            opacity: 1,
            order: 0,
            // Managed-asset URL form: resolveAssetPath joins the decoded
            // name onto <userData>/assets, where importImage copied it.
            // A bare filename would resolve CWD-relative and fail.
            source: `bigdeck-asset://${encodeURIComponent(stored)}`,
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            fit: "contain",
          });
        } else {
          warnings.push(
            `key ${slot.keyIndex}: image "${state.Image}" could not be imported`,
          );
        }
      }
    }
    // Elgato titles become the key's LABEL (not a text layer) — titles ARE
    // labels semantically, and the Label controls in the appearance editor
    // (text/eye/position/color) then manage them natively.
    if (state?.Title && state.ShowTitle !== false) {
      key.label = normalizeElgatoTitle(state.Title);
      key.labelColor = state.TitleColor ?? "#ffffff";
      // Alignment was a vertical percent (18/50/82) — snap to the nearest
      // label position.
      const y = titleVerticalPercent(state.TitleAlignment);
      key.labelPosition = y < 40 ? "top" : y > 60 ? "bottom" : "center";
    }
    if (layers.length > 0) key.layers = layers;

    keys.push(key);
  }

  // Dense key list so empty slots still render in the grid (matches
  // ProfileManager.createDefaultProfile).
  for (let i = 0; i < specs.keyCount; i++) {
    if (!keys.some((k) => k.keyIndex === i)) {
      keys.push({ id: uuidv4(), keyIndex: i });
    }
  }
  keys.sort((a, b) => a.keyIndex - b.keyIndex);

  const baseName =
    bundle.name || options.sourceName || "Elgato Profile";
  const profile: Omit<Profile, "id" | "createdAt" | "updatedAt"> = {
    name: `${baseName} (Elgato)`,
    deviceType,
    pages: [
      {
        id: uuidv4(),
        name: "Page 1",
        keys,
      },
    ],
    activePage: 0,
  };

  return {
    profile,
    importedKeys: keys.filter((k) => k.action !== undefined).length,
    skippedKeys,
    warnings,
  };
}
