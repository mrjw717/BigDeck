// ============================================================================
// BigDeck - Shared Types
// ============================================================================

// Device Types
export type DeviceType =
  | "original"
  | "original-v2"
  | "mini"
  | "mini-mk2"
  | "xl"
  | "xl-v2"
  | "mk2"
  | "pedal"
  | "plus"
  | "neo"
  | "studio";

export interface DeviceInfo {
  id: string;
  type: DeviceType;
  serialNumber: string;
  firmwareVersion: string;
  rows: number;
  columns: number;
  keyCount: number;
  keyWidth: number;
  keyHeight: number;
  connected: boolean;
}

export interface DeviceState {
  devices: DeviceInfo[];
  activeDeviceId: string | null;
}

// Action Types
export type ActionType =
  | "keyboard-shortcut"
  | "launch-app"
  | "multimedia"
  | "open-url"
  | "open-folder"
  | "run-script"
  | "macro"
  | "switch-profile"
  | "switch-page"
  | "system-sleep"
  | "close-app"
  | "key-brightness"
  | "toggle-folder"
  | "obs-action"
  | "system-command"
  | "plugin"
  | "sdplugin"
  | "soundboard"
  | "soundboard.stop"
  | "timer"
  | "clock"
  | "hotkeyswitch"
  | "page.next"
  | "page.previous";

export interface BaseAction {
  type: ActionType;
  id: string;
  name: string;
  icon?: string;
  backgroundColor?: string;
}

export interface KeyboardShortcutAction extends BaseAction {
  type: "keyboard-shortcut";
  keys: string[];
  modifiers: ("ctrl" | "alt" | "shift" | "super")[];
}

export interface LaunchAppAction extends BaseAction {
  type: "launch-app";
  command: string;
  args?: string[];
  workingDirectory?: string;
}

export interface MultimediaAction extends BaseAction {
  type: "multimedia";
  mediaCommand:
    | "play-pause"
    | "next"
    | "previous"
    | "stop"
    | "volume-up"
    | "volume-down"
    | "mute"
    | "mute-mic"
    | "mute-output"
    | "ptt-mic";
  target?: "system" | "global" | string;
}

export interface MediaPlayerInfo {
  id: string;
  name: string;
  icon: string;
  status: "playing" | "paused" | "stopped";
  canPlay: boolean;
  canPause: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  canStop: boolean;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
  };
}

export interface OpenUrlAction extends BaseAction {
  type: "open-url";
  url: string;
}

export interface OpenFolderAction extends BaseAction {
  type: "open-folder";
  path: string;
}

export interface RunScriptAction extends BaseAction {
  type: "run-script";
  scriptType: "shell" | "python" | "node";
  /** Inline script body (mutually exclusive with scriptFile at execution). */
  script: string;
  /**
   * Path to a script file on disk (~ is expanded). When set, the interpreter
   * runs THIS file instead of the inline `script` body — e.g. a repo of
   * tested bash/python/node tools triggered by deck keys.
   */
  scriptFile?: string;
  timeout?: number;
}

export interface MacroStep {
  type: "key" | "delay" | "text";
  value: string;
  duration?: number;
}

export interface MacroAction extends BaseAction {
  type: "macro";
  steps: MacroStep[];
  repeat?: number;
}

export interface SwitchProfileAction extends BaseAction {
  type: "switch-profile";
  profileId: string;
}

export interface SwitchPageAction extends BaseAction {
  type: "switch-page";
  pageIndex: number;
}

/**
 * Play an audio file on press (Elgato Soundboard —
 * com.elgato.streamdeck.soundboard.playaudio). Backends are probed in
 * order: paplay → pw-play → ffplay → cvlc; the first installed one carries
 * playback. Re-pressing the same sample restarts it (Elgato behavior);
 * `soundboard.stop` kills every playing sample.
 */
export interface SoundboardAction extends BaseAction {
  type: "soundboard";
  /** Path to the audio file (~ expanded). */
  samplePath: string;
  /** Playback volume 0-100; omitted/undefined = backend default (100%). */
  volume?: number;
}

/**
 * Stop all Soundboard playback started by `soundboard` actions
 * (com.elgato.streamdeck.soundboard.stopaudioplay). No configuration.
 */
export interface SoundboardStopAction extends BaseAction {
  type: "soundboard.stop";
}

/**
 * Countdown timer rendered LIVE on its key as MM:SS via ActionTickService
 * (Elgato com.elgato.streamdeck.system.timer). Press starts the countdown;
 * pressing again stops (default) or restarts it per `pressAgain`. At zero
 * the key returns to its static appearance and the optional
 * `onCompleteAction` fires (reuse of the action pipeline).
 */
export interface TimerAction extends BaseAction {
  type: "timer";
  /** Countdown minutes (0-...). Combined with `seconds`; total must be > 0. */
  minutes: number;
  /** Countdown seconds (0-59). */
  seconds: number;
  /**
   * What another press does while the timer runs. "stop" (default) ends the
   * countdown and restores the key; "restart" begins the full duration again.
   */
  pressAgain?: "stop" | "restart";
  /** Optional action executed once when the countdown hits zero. */
  onCompleteAction?: Action;
}

/**
 * Live digital clock on the key, re-rendered through ActionTickService
 * (Elgato com.elgato.streamdeck.system.digitaltime). Minute clocks tick on
 * the minute bucket; `showSeconds` upgrades the key to a 1s tick. The key
 * goes live when its page is applied (index.ts syncs clock placements) and
 * pressing the key re-registers/refreshes it.
 */
export interface ClockAction extends BaseAction {
  type: "clock";
  /** 24-hour display (default true); false renders 12h with AM/PM suffix. */
  use24h?: boolean;
  /** Show ":SS" seconds — switches the key to a 1-second tick. */
  showSeconds?: boolean;
}

/**
 * Toggle between two hotkey combos (Elgato com.elgato.streamdeck.system.
 * hotkeyswitch): first press enters the ON state and sends the ON combo,
 * the next press returns to OFF and sends the OFF combo. State is tracked
 * per key IN MEMORY and RESETS ON PROFILE SWITCH (and app restart) — there
 * is no persisted on/off image state; the key's static appearance is the
 * user's business (style both states via layers if needed).
 */
export interface HotkeySwitchAction extends BaseAction {
  type: "hotkeyswitch";
  /** Combo sent when toggling ON (same shape as keyboard-shortcut). */
  onKeys: string[];
  onModifiers: ("ctrl" | "alt" | "shift" | "super")[];
  /** Combo sent when toggling OFF. */
  offKeys: string[];
  offModifiers: ("ctrl" | "alt" | "shift" | "super")[];
}

/**
 * Relative page navigation (Elgato page.next / page.previous): moves the
 * active page by ±1 with wrap-around rotation (last page's "next" opens
 * the first). Applied through the same path as `switch-page`.
 */
export interface PageNextAction extends BaseAction {
  type: "page.next";
}

export interface PagePreviousAction extends BaseAction {
  type: "page.previous";
}

/**
 * Suspend the machine via `systemctl suspend`. No configuration — mirrors
 * Elgato's Sleep action (com.elgato.streamdeck.system.sleep).
 */
export interface SystemSleepAction extends BaseAction {
  type: "system-sleep";
}

/**
 * Close all instances of an app, gracefully. `target` is matched against
 * window titles (wmctrl, X11) and process names (pkill SIGTERM fallback) —
 * mirrors Elgato's Close action (com.elgato.streamdeck.system.close).
 */
export interface CloseAppAction extends BaseAction {
  type: "close-app";
  target: string;
}

/**
 * Set Stream Deck key backlight brightness (0-100), mirroring Elgato's
 * Brightness action (com.elgato.streamdeck.system.keybrightness). Executed
 * through the onKeyBrightness callback — DeviceManager owns the hardware.
 */
export interface KeyBrightnessAction extends BaseAction {
  type: "key-brightness";
  brightness: number;
}

export interface PluginAction extends BaseAction {
  type: "plugin";
  pluginId: string;
  pluginAction: string;
  pluginConfig?: Record<string, unknown>;
}

/**
 * Where an executed action came from when the caller knows it (hardware key
 * press). Lets the SD plugin host resolve/mint the right action-instance
 * context; flows without device context (network API) omit it.
 * `deviceType` is optional extra context (the key's pixel geometry for
 * on-key rendering); the press wiring in the app entry point supplies it.
 */
export interface ActionOrigin {
  deviceId: string;
  keyIndex: number;
  deviceType?: DeviceType;
}

/**
 * Dispatch into an Elgato .sdPlugin action instance. See
 * src/main/plugins/sd/SDPluginHost.ts — the plugin receives a keyDown on the
 * resolved context (per docs/SDPLUGIN-COMPAT.md).
 */
export interface SdPluginAction extends BaseAction {
  type: "sdplugin";
  pluginUUID: string;
  actionUUID: string;
  settings?: Record<string, unknown>;
}

export type Action =
  | KeyboardShortcutAction
  | LaunchAppAction
  | MultimediaAction
  | OpenUrlAction
  | OpenFolderAction
  | RunScriptAction
  | MacroAction
  | SwitchProfileAction
  | SwitchPageAction
  | SystemSleepAction
  | CloseAppAction
  | KeyBrightnessAction
  | PluginAction
  | SdPluginAction
  | SoundboardAction
  | SoundboardStopAction
  | TimerAction
  | ClockAction
  | HotkeySwitchAction
  | PageNextAction
  | PagePreviousAction;

// Layer-based key appearance
export type LayerType = "background" | "text" | "icon" | "image";

export interface KeyLayer {
  id: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  order: number; // Layer ordering (0 = bottom, higher = top)

  // Background layer properties
  backgroundColor?: string;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundGradientDirection?: number;
  /**
   * Chroma-key knockout (background layers): every pixel whose RGB is within
   * `transparentColorTolerance` (per channel) of this hex color renders at
   * alpha 0 — lets artwork sit on a keyed-out background instead of an
   * opaque rectangle.
   */
  transparentColor?: string;
  transparentColorTolerance?: number;

  // Text layer properties
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";

  // Icon/Image layer properties
  source?: string;
  fit?: "contain" | "cover" | "fill";

  // Position (percentage 0-100, centered by default)
  x?: number;
  y?: number;

  // Size (percentage 0-100, auto by default)
  width?: number;
  height?: number;
}

// Key Configuration
export interface KeyImage {
  type: "static" | "animated" | "text" | "icon";
  source: string;
  text?: string;
  textColor?: string;
  fontSize?: number;
  backgroundColor?: string;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundGradientDirection?: number;
  textAlign?: "left" | "center" | "right";
  textTransform?: "none" | "uppercase";
  iconSize?: number;
  pressedBackgroundColor?: string;
  pressedBackgroundGradientStart?: string;
  pressedBackgroundGradientEnd?: string;
  pressedBackgroundGradientDirection?: number;
  syncPressedState?: boolean; // true = pressed uses idle appearance, false = separate appearances
}

export interface KeyConfig {
  id: string;
  keyIndex: number;
  action?: Action;

  // New layer-based appearance system (ordered bottom to top)
  layers?: KeyLayer[];
  pressedLayers?: KeyLayer[];
  syncPressedState?: boolean;

  // Legacy KeyImage support (for backward compatibility)
  image?: KeyImage;

  label?: string;
  labelPosition?: "top" | "center" | "bottom";
  labelColor?: string;
  pressed?: boolean;

  // Legacy properties (for backward compatibility)
  backgroundColor?: string;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundGradientDirection?: number;
  pressedBackgroundColor?: string;
  pressedBackgroundGradientStart?: string;
  pressedBackgroundGradientEnd?: string;
  pressedBackgroundGradientDirection?: number;
}

// Profile Types
export interface ProfilePage {
  id: string;
  name: string;
  keys: KeyConfig[];
}

export interface Profile {
  id: string;
  name: string;
  deviceType: DeviceType;
  isDefault?: boolean;
  pages: ProfilePage[];
  activePage: number;
  autoSwitchRules?: AutoSwitchRule[];
  createdAt: string;
  updatedAt: string;
}

export interface AutoSwitchRule {
  id: string;
  type: "window-class" | "window-title" | "process-name";
  pattern: string;
  isRegex?: boolean;
}

// Settings
export interface AppSettings {
  theme: "light" | "dark" | "system";
  startMinimized: boolean;
  minimizeToTray: boolean;
  autoStart: boolean;
  brightness: number;
  networkControl: {
    enabled: boolean;
    port: number;
    authToken?: string;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    maxFiles: number;
  };
}

// IPC Channel Types
export type IPCChannels = {
  // Device channels
  "device:list": () => DeviceInfo[];
  "device:connect": (deviceId: string) => boolean;
  "device:disconnect": (deviceId: string) => void;
  "device:set-brightness": (deviceId: string, brightness: number) => void;
  "device:set-key-image": (
    deviceId: string,
    keyIndex: number,
    imageBuffer: Buffer,
  ) => void;
  "device:clear-key": (deviceId: string, keyIndex: number) => void;
  "device:clear-all-keys": (deviceId: string) => void;

  // Profile channels
  "profile:list": () => Profile[];
  "profile:get": (profileId: string) => Profile | null;
  "profile:create": (
    profile: Omit<Profile, "id" | "createdAt" | "updatedAt">,
  ) => Profile;
  "profile:update": (profile: Profile) => Profile;
  "profile:delete": (profileId: string) => void;
  "profile:activate": (profileId: string) => void;
  "profile:set-default": (profileId: string) => Profile;
  "profile:export": (profileId: string) => string;
  "profile:import": (profileJson: string) => Profile;

  // Action channels
  "action:execute": (action: Action) => void;
  "action:macro-record-start": () => void;
  "action:macro-record-stop": () => MacroStep[];

  // Settings channels
  "settings:get": () => AppSettings;
  "settings:update": (settings: Partial<AppSettings>) => AppSettings;

  // Plugin channels
  "plugin:list": () => PluginInfo[];
  "plugin:enable": (pluginId: string) => void;
  "plugin:disable": (pluginId: string) => void;
};

// Events from main to renderer
export type IPCEvents = {
  "device:connected": DeviceInfo;
  "device:disconnected": string;
  "device:key-down": { deviceId: string; keyIndex: number };
  "device:key-up": { deviceId: string; keyIndex: number };
  "device:dial-rotate": { deviceId: string; dialIndex: number; amount: number };
  "device:dial-down": { deviceId: string; dialIndex: number };
  "device:dial-up": { deviceId: string; dialIndex: number };
  "device:touch-tap": {
    deviceId: string;
    dialIndex: number;
    x: number;
    y: number;
  };
  "device:touch-swipe": {
    deviceId: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  };
  "profile:changed": Profile;
  "profile:page-changed": { profileId: string; pageIndex: number };
  error: { message: string; code: string };
};

// Plugin Types
export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  actions: PluginActionDefinition[];
}

export interface PluginActionDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  configSchema?: Record<string, unknown>;
}

// Network API Types
export interface NetworkAPIStatus {
  running: boolean;
  port: number;
  connections: number;
}

// ============================================================================
// InfoBar layout gallery (Settings — "SD+ / Neo Layouts" card). Shapes
// returned by the layouts.* IPC handlers over LayoutStore/LayoutRenderer.
// ============================================================================

/** One imported .sdLayoutEx package, summarized for the gallery. */
export interface LayoutSummary {
  /** Package id: the directory basename minus `.sdLayoutEx`. */
  id: string;
  /** Theme ids declared by the manifest, in declaration order. */
  themeIds: string[];
  /** Number of template elements (data slots) in the manifest. */
  elementCount: number;
}

/** Result of a gallery import (a `.sdLayoutEx` package directory). */
export interface LayoutImportReport {
  ok: boolean;
  /** Imported package id on success, null on failure. */
  id: string | null;
  /** Summary of the freshly imported package (success only). */
  themeIds: string[];
  elementCount: number;
  /** Validation errors when ok is false. */
  errors: string[];
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// InfoBar Layout Types (Elgato .sdLayoutEx manifests)
//
// Reverse-engineered from the layouts bundled with Stream Deck 7.x
// (Resources/InfobarLayouts/{DigitalTime,Pagination}/*.sdLayoutEx) — see
// src/main/layouts/LayoutSchema.ts for the full survey table. These types are
// consumed by both main (parser/renderer/store) and (later) the renderer
// process, so they live here.
// ============================================================================

/** A theme font token: {font} entries observed across all bundled layouts. */
export interface LayoutExFontSpec {
  family: string;
  size: number;
  weight: number;
  italic: boolean;
}

/**
 * A theme color value: either plain `#RRGGBB` or an Elgato gradient string
 * like `h$0:#204CFE,1:#CE1F93` (horizontal) / `d1$0:#A,1:#B` (diagonal),
 * stops formatted `offset:#hex`, comma-separated, multi-stop allowed.
 */
export type LayoutExColorSpec = string;

/** Per-theme color/font/image token tables referenced via `{{token}}` in items. */
export interface LayoutExTheme {
  id: string;
  primaryColor: string;
  secondaryColor: string;
  colors: Record<string, LayoutExColorSpec>;
  fonts: Record<string, LayoutExFontSpec>;
  /** Token → layout-relative image path (e.g. backgroundImage → images/night_background.png). */
  images?: Record<string, string>;
}

/** All element `type` values observed across every bundled layout. */
export type LayoutExElementType =
  | "hours"
  | "minutes"
  | "colon"
  | "am/pm"
  | "day"
  | "date"
  | "custom_date"
  | "location"
  | "carousel_page"
  | "show_on_am/pm"
  | "show_on_clock_type";

interface LayoutExElementBase {
  key: string;
  type: LayoutExElementType;
}

export interface LayoutExHoursElement extends LayoutExElementBase {
  type: "hours";
  /** Zero-pad single-digit values ("9" → "09"). Inferred: only minutes… */
  show_zero?: boolean;
}
export interface LayoutExMinutesElement extends LayoutExElementBase {
  type: "minutes";
  show_zero?: boolean;
}
export interface LayoutExColonElement extends LayoutExElementBase {
  type: "colon";
  /** Blinking colon flag — only `false` observed in bundled layouts. */
  animated?: boolean;
}
export interface LayoutExAmPmElement extends LayoutExElementBase {
  type: "am/pm";
  /** Uppercase the supplied value (only `true` observed). */
  capitalize?: boolean;
}
export interface LayoutExDayElement extends LayoutExElementBase {
  type: "day";
  /** Observed: dateType "Text", dateFormat "Long". */
  dateType?: string;
  dateFormat?: string;
}
export interface LayoutExDateElement extends LayoutExElementBase {
  type: "date";
  /** Observed: "Short". */
  dateFormat?: string;
}
export interface LayoutExCustomDateElement extends LayoutExElementBase {
  type: "custom_date";
  /** Observed: "Month_Day" | "Weekday_Month_Day" | "Weekday_Month_Day_Short". */
  dateFormat?: string;
}
export interface LayoutExLocationElement extends LayoutExElementBase {
  type: "location";
}
export interface LayoutExCarouselPageElement extends LayoutExElementBase {
  type: "carousel_page";
  /** Which page attribute this slot shows: only Icon | Name | Number observed. */
  display?: "Icon" | "Name" | "Number";
  /** Only "Unique" observed. */
  wrap?: string;
  /** Page offset relative to the current page (-1, 0, 1, 2, 3 observed). */
  offset?: number;
  /** [number, number] pair (0..1, 0..3) — purpose unconfirmed; preserved as-is. */
  extend?: [number, number];
}
export interface LayoutExShowOnAmPmElement extends LayoutExElementBase {
  type: "show_on_am/pm";
  /** Visibility gate: show only in the given clock period. */
  periode?: "AM" | "PM";
}
export interface LayoutExShowOnClockTypeElement extends LayoutExElementBase {
  type: "show_on_clock_type";
  /** Visibility gate: show only in the given clock mode. */
  format?: "Hour12" | "Hour24";
}

export type LayoutExElement =
  | LayoutExHoursElement
  | LayoutExMinutesElement
  | LayoutExColonElement
  | LayoutExAmPmElement
  | LayoutExDayElement
  | LayoutExDateElement
  | LayoutExCustomDateElement
  | LayoutExLocationElement
  | LayoutExCarouselPageElement
  | LayoutExShowOnAmPmElement
  | LayoutExShowOnClockTypeElement;

/** [x, y, width, height] in the 232×50 logical layout canvas. */
export type LayoutExRect = [number, number, number, number];

interface LayoutExItemBase {
  key: string;
  type: "pixmap" | "text";
  rect: LayoutExRect;
  /** Paint order; items are drawn ascending (observed 0..8). */
  zOrder?: number;
  /** Rounded-corner radius in layout units (observed 3..25). */
  border_radius?: number;
}

/** Solid/gradient/image rectangle (backgrounds, chips, icon slots). */
export interface LayoutExPixmapItem extends LayoutExItemBase {
  type: "pixmap";
  /** Fill for the chip/rect itself (color token or literal spec). */
  background?: string;
  /** Icon glyph fill inside `padding` (carousel page icons). */
  fill_c?: string;
  /** `{{imageToken}}` → theme.images token for a PNG to draw. */
  value?: string;
  /** [l, t, r, b] inset applied to the icon content (observed symmetric). */
  padding?: [number, number, number, number];
}

/** Text run (clock digits, colon, AM/PM, page names/numbers). */
export interface LayoutExTextItem extends LayoutExItemBase {
  type: "text";
  /** Literal text, placeholder ("0", ":"), or replaced by element data. */
  value?: string;
  /** `{{fontToken}}` → theme font. */
  font?: string;
  /** Text fill (color token or literal spec). */
  color?: string;
  /** Optional fill behind the text (color token or literal spec). */
  background?: string;
  alignment?: "left" | "center" | "right";
  /** Only "clip" observed; item SVG bounds clip naturally. */
  "text-overflow"?: string;
  outline_w?: number;
  outline_c?: string;
  /** Draw stroke only (digital_time_01 digits). */
  outline_only?: boolean;
}

export type LayoutExTemplateItem = LayoutExPixmapItem | LayoutExTextItem;

export interface LayoutExTemplate {
  id: string;
  items: LayoutExTemplateItem[];
}

/** A parsed, validated .sdLayoutEx manifest. */
export interface LayoutExManifest {
  themes: LayoutExTheme[];
  elements: LayoutExElement[];
  template: LayoutExTemplate;
}

/** House-style parse result: every problem collected, not fail-fast. */
export interface LayoutExParseResult {
  ok: boolean;
  manifest: LayoutExManifest | null;
  errors: string[];
}
