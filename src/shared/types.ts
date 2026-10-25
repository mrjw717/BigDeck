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
  | "toggle-folder"
  | "obs-action"
  | "system-command"
  | "plugin";

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
    | "mute";
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
  script: string;
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

export interface PluginAction extends BaseAction {
  type: "plugin";
  pluginId: string;
  pluginAction: string;
  pluginConfig?: Record<string, unknown>;
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
  | PluginAction;

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

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
