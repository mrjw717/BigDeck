// ============================================================================
// BigDeck - Constants
// ============================================================================

import { DeviceType } from "./types";

// Device specifications
export const DEVICE_SPECS: Record<
  DeviceType,
  {
    rows: number;
    columns: number;
    keyWidth: number;
    keyHeight: number;
    keyCount: number;
    name: string;
    imageFormat: "jpeg" | "raw";
  }
> = {
  original: {
    rows: 3,
    columns: 5,
    keyWidth: 72,
    keyHeight: 72,
    keyCount: 15,
    name: "Stream Deck",
    imageFormat: "raw",
  },
  "original-v2": {
    rows: 3,
    columns: 5,
    keyWidth: 72,
    keyHeight: 72,
    keyCount: 15,
    name: "Stream Deck V2",
    imageFormat: "raw",
  },
  mini: {
    rows: 2,
    columns: 3,
    keyWidth: 80,
    keyHeight: 80,
    keyCount: 6,
    name: "Stream Deck Mini",
    imageFormat: "raw",
  },
  "mini-mk2": {
    rows: 2,
    columns: 3,
    keyWidth: 80,
    keyHeight: 80,
    keyCount: 6,
    name: "Stream Deck Mini MK.2",
    imageFormat: "raw",
  },
  xl: {
    rows: 4,
    columns: 8,
    keyWidth: 96,
    keyHeight: 96,
    keyCount: 32,
    name: "Stream Deck XL",
    imageFormat: "jpeg",
  },
  "xl-v2": {
    rows: 4,
    columns: 8,
    keyWidth: 96,
    keyHeight: 96,
    keyCount: 32,
    name: "Stream Deck XL V2",
    imageFormat: "jpeg",
  },
  mk2: {
    rows: 3,
    columns: 5,
    keyWidth: 72,
    keyHeight: 72,
    keyCount: 15,
    name: "Stream Deck MK.2",
    imageFormat: "raw",
  },
  pedal: {
    rows: 1,
    columns: 3,
    keyWidth: 0,
    keyHeight: 0,
    keyCount: 3,
    name: "Stream Deck Pedal",
    imageFormat: "raw", // Pedals generally don't have screens, but if they did...
  },
  plus: {
    rows: 2,
    columns: 4,
    keyWidth: 120,
    keyHeight: 120,
    keyCount: 8,
    name: "Stream Deck +",
    imageFormat: "raw",
  },
  neo: {
    rows: 2,
    columns: 4,
    keyWidth: 96,
    keyHeight: 96,
    keyCount: 8,
    name: "Stream Deck Neo",
    // Note: Neo uses LCD display - "raw" format works but could be optimized to "jpeg"
    imageFormat: "raw",
  },
  studio: {
    rows: 2,
    columns: 16,
    keyWidth: 80,
    keyHeight: 120,
    keyCount: 32,
    name: "Stream Deck Studio",
    // Note: Studio uses LCD display - verify format for optimal performance
    imageFormat: "raw",
  },
};

// USB Vendor/Product IDs for Elgato devices
export const ELGATO_VENDOR_ID = 0x0fd9;

export const ELGATO_PRODUCT_IDS: Record<number, DeviceType> = {
  0x0060: "original",
  0x006d: "original-v2",
  0x0063: "mini",
  0x0090: "mini-mk2",
  0x006c: "xl",
  0x008f: "xl-v2",
  0x0080: "mk2",
  0x0086: "pedal",
  0x0084: "plus",
  0x009a: "neo",
  0x00aa: "studio",
};

// IPC Channel names
export const IPC_CHANNELS = {
  // Device
  DEVICE_LIST: "device:list",
  DEVICE_CONNECT: "device:connect",
  DEVICE_DISCONNECT: "device:disconnect",
  DEVICE_SET_BRIGHTNESS: "device:set-brightness",
  DEVICE_SET_KEY_IMAGE: "device:set-key-image",
  DEVICE_CLEAR_KEY: "device:clear-key",
  DEVICE_CLEAR_ALL_KEYS: "device:clear-all-keys",
  DEVICE_CONNECTED: "device:connected",
  DEVICE_DISCONNECTED: "device:disconnected",
  DEVICE_KEY_DOWN: "device:key-down",
  DEVICE_KEY_UP: "device:key-up",
  DEVICE_DIAL_ROTATE: "device:dial-rotate",
  DEVICE_DIAL_DOWN: "device:dial-down",
  DEVICE_DIAL_UP: "device:dial-up",
  DEVICE_TOUCH_TAP: "device:touch-tap",
  DEVICE_TOUCH_SWIPE: "device:touch-swipe",
  DEVICE_HARDWARE_ERROR: "device:hardware-error",

  // Profile
  PROFILE_LIST: "profile:list",
  PROFILE_GET: "profile:get",
  PROFILE_CREATE: "profile:create",
  PROFILE_UPDATE: "profile:update",
  PROFILE_DELETE: "profile:delete",
  PROFILE_ACTIVATE: "profile:activate",
  PROFILE_EXPORT: "profile:export",
  PROFILE_IMPORT: "profile:import",
  PROFILE_SET_DEFAULT: "profile.setDefault",
  PROFILE_ADD_AUTO_SWITCH_RULE: "profile.addAutoSwitchRule",
  PROFILE_REMOVE_AUTO_SWITCH_RULE: "profile.removeAutoSwitchRule",
  PROFILE_IMPORT_ELGATO: "profile.importElgato",
  PROFILE_CHANGED: "profile:changed",
  PROFILE_PAGE_CHANGED: "profile:page-changed",

  // Action
  ACTION_EXECUTE: "action:execute",
  ACTION_RENDER_KEY_IMAGE: "action:render-key-image",
  ACTION_ANIMATION_DELAYS: "action:animation-delays",
  MACRO_RECORD_START: "action:macro-record-start",
  MACRO_RECORD_STOP: "action:macro-record-stop",
  MEDIA_PLAYERS_LIST: "media:players-list",

  // Shortcut recorder
  SHORTCUT_RECORD_MODE: "shortcut:record-mode",

  // App picker (Settings "App Focus Switching" card): freedesktop .desktop
  // inventory + PATH executables for binding profiles to APPS (never paths).
  APPS_LIST_DESKTOP_APPS: "apps.listDesktopApps",
  APPS_LIST_CLI_TOOLS: "apps.listCliTools",

  // Window controls (frameless custom titlebar; renderer → main invoke).
  // `WINDOW_MAXIMIZED_CHANGED` is the main → renderer push that keeps the
  // maximize/restore button icon in sync (double-click titlebar, super+up, ...).
  WINDOW_MINIMIZE: "window.minimize",
  WINDOW_MAXIMIZE: "window.maximize",
  WINDOW_CLOSE: "window.close",
  WINDOW_IS_MAXIMIZED: "window.isMaximized",
  WINDOW_MAXIMIZED_CHANGED: "window:maximized-changed",

  // Asset
  ASSET_UPLOAD: "asset:upload",
  ASSET_LIST: "asset:list",
  ASSET_DELETE: "asset:delete",
  ASSET_FETCH_FAVICON: "asset:fetch-favicon",
  ASSET_FETCH_APP_ICON: "asset:fetch-app-icon",
  ASSET_READ_AS_DATA_URL: "asset:read-as-data-url",

  // Dialog
  DIALOG_OPEN_FILE: "dialog:open-file",
  DIALOG_OPEN_DIRECTORY: "dialog:open-directory",

  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_UPDATE: "settings:update",

  // Icon packs (Elgato .sdIconPack libraries) — new "assets" namespace
  ASSETS_LIST_ICON_PACKS: "assets.listIconPacks",
  ASSETS_LIST_ICONS: "assets.listIcons",
  ASSETS_GET_ICON: "assets.getIcon",

  // Elgato .sdPlugin host — localized plugin/action summaries for the
  // renderer action catalog (KeyEditor picker + ActionLibrary).
  SD_LIST_PLUGINS: "sd.listPlugins",

  // Elgato .sdPlugin host management (Plugins view): install a
  // .streamDeckPlugin/.zip distributable via the host, and toggle a plugin's
  // enabled state (persists in the host's state dir; spawns/kills now).
  SD_INSTALL_FROM_FILE: "sd.installFromFile",
  SD_SET_PLUGIN_ENABLED: "sd.setPluginEnabled",

  // Elgato .sdLayoutEx InfoBar layouts (Settings gallery): list imported
  // layout packages, render a preview PNG data-URL, import a package dir.
  LAYOUTS_LIST: "layouts.list",
  LAYOUTS_PREVIEW: "layouts.preview",
  LAYOUTS_IMPORT: "layouts.import",

  // Keyboard injection diagnostics (Linux backends)
  KEYBIND_STATUS: "keybind.status",
  KEYBIND_TEST: "keybind.test",

  // General
  ERROR: "error",
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  theme: "dark" as const,
  startMinimized: false,
  minimizeToTray: true,
  autoStart: false,
  brightness: 100,
  networkControl: {
    enabled: false,
    port: 8080,
  },
  logging: {
    level: "debug" as const,
    maxFiles: 5,
  },
};

// App paths
export const APP_NAME = "BigDeck";
export const CONFIG_DIR_NAME = "bigdeck";
export const PROFILES_DIR_NAME = "profiles";
export const PLUGINS_DIR_NAME = "plugins";
export const LOGS_DIR_NAME = "logs";
export const IMAGES_DIR_NAME = "images";

// Network defaults
export const DEFAULT_HTTP_PORT = 8080;
export const DEFAULT_WS_PORT = 8081;

// Animation settings
export const GIF_MAX_FRAME_RATE = 30;
export const GIF_DEFAULT_FRAME_RATE = 15;

// Multimedia key codes (for xdotool)
export const MEDIA_KEYS = {
  "play-pause": "XF86AudioPlay",
  next: "XF86AudioNext",
  previous: "XF86AudioPrev",
  stop: "XF86AudioStop",
  "volume-up": "XF86AudioRaiseVolume",
  "volume-down": "XF86AudioLowerVolume",
  mute: "XF86AudioMute",
} as const;
