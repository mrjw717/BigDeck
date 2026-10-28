// ============================================================================
// BigDeck - Preload Script
// Exposes safe APIs to the renderer process via contextBridge
// ============================================================================

import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import type {
  DeviceInfo,
  Profile,
  Action,
  AppSettings,
  PluginInfo,
  KeyConfig,
  AutoSwitchRule,
  DesktopApp,
  CliTool,
} from "../shared/types";
import type { IconPackSummary, IconEntry, IconFile } from "../main/assets/IconPack";
import type { ElgatoImportReport } from "../main/profiles/elgato/ElgatoProfileImporter";
import type { SDPluginSummary } from "../main/plugins/sd/SDPluginHost";
import type { LayoutSummary, LayoutImportReport } from "../shared/types";
import type { KeyboardInjectionStatus } from "../main/actions/ActionExecutor";

// Type-safe API exposed to renderer
const api = {
  // Device APIs
  device: {
    list: (): Promise<DeviceInfo[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEVICE_LIST),
    connect: (deviceId: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEVICE_CONNECT, deviceId),
    disconnect: (deviceId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEVICE_DISCONNECT, deviceId),
    setBrightness: (deviceId: string, brightness: number): Promise<void> =>
      ipcRenderer.invoke(
        IPC_CHANNELS.DEVICE_SET_BRIGHTNESS,
        deviceId,
        brightness,
      ),
    setKeyImage: (
      deviceId: string,
      keyIndex: number,
      imageOrFrames: Buffer | Buffer[],
      forceUpdate: boolean = false,
      keyConfig?: KeyConfig,
    ): Promise<void> =>
      ipcRenderer.invoke(
        IPC_CHANNELS.DEVICE_SET_KEY_IMAGE,
        deviceId,
        keyIndex,
        imageOrFrames,
        forceUpdate,
        keyConfig,
      ),
    clearKey: (deviceId: string, keyIndex: number): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEVICE_CLEAR_KEY, deviceId, keyIndex),
    clearAllKeys: (deviceId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEVICE_CLEAR_ALL_KEYS, deviceId),

    // Event listeners
    onConnected: (callback: (device: DeviceInfo) => void) => {
      const handler = (_: Electron.IpcRendererEvent, device: DeviceInfo) =>
        callback(device);
      ipcRenderer.on(IPC_CHANNELS.DEVICE_CONNECTED, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.DEVICE_CONNECTED, handler);
    },
    onDisconnected: (callback: (deviceId: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, deviceId: string) =>
        callback(deviceId);
      ipcRenderer.on(IPC_CHANNELS.DEVICE_DISCONNECTED, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.DEVICE_DISCONNECTED, handler);
    },
    onKeyDown: (
      callback: (data: { deviceId: string; keyIndex: number }) => void,
    ) => {
      const handler = (
        _: Electron.IpcRendererEvent,
        data: { deviceId: string; keyIndex: number },
      ) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DEVICE_KEY_DOWN, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.DEVICE_KEY_DOWN, handler);
    },
    onKeyUp: (
      callback: (data: { deviceId: string; keyIndex: number }) => void,
    ) => {
      const handler = (
        _: Electron.IpcRendererEvent,
        data: { deviceId: string; keyIndex: number },
      ) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DEVICE_KEY_UP, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.DEVICE_KEY_UP, handler);
    },
  },

  // Profile APIs
  profile: {
    list: (): Promise<Profile[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_LIST),
    get: (profileId: string): Promise<Profile | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_GET, profileId),
    create: (
      profile: Omit<Profile, "id" | "createdAt" | "updatedAt">,
    ): Promise<Profile> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_CREATE, profile),
    update: (profile: Profile): Promise<Profile> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_UPDATE, profile),
    delete: (profileId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_DELETE, profileId),
    activate: (profileId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_ACTIVATE, profileId),
    export: (profileId: string): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_EXPORT, profileId),
    import: (profileJson: string): Promise<Profile> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_IMPORT, profileJson),
    setDefault: (profileId: string): Promise<Profile> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_SET_DEFAULT, profileId),
    addAutoSwitchRule: (
      profileId: string,
      rule: Omit<AutoSwitchRule, "id">,
    ): Promise<Profile> =>
      ipcRenderer.invoke(
        IPC_CHANNELS.PROFILE_ADD_AUTO_SWITCH_RULE,
        profileId,
        rule,
      ),
    removeAutoSwitchRule: (
      profileId: string,
      ruleId: string,
    ): Promise<Profile> =>
      ipcRenderer.invoke(
        IPC_CHANNELS.PROFILE_REMOVE_AUTO_SWITCH_RULE,
        profileId,
        ruleId,
      ),
    importElgato: (filePath: string): Promise<ElgatoImportReport> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_IMPORT_ELGATO, filePath),

    // Event listeners
    onChanged: (callback: (profile: Profile) => void) => {
      const handler = (_: Electron.IpcRendererEvent, profile: Profile) =>
        callback(profile);
      ipcRenderer.on(IPC_CHANNELS.PROFILE_CHANGED, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.PROFILE_CHANGED, handler);
    },
    onPageChanged: (
      callback: (data: { profileId: string; pageIndex: number }) => void,
    ) => {
      const handler = (
        _: Electron.IpcRendererEvent,
        data: { profileId: string; pageIndex: number },
      ) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.PROFILE_PAGE_CHANGED, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.PROFILE_PAGE_CHANGED, handler);
    },
  },

  // Action APIs
  action: {
    execute: (action: Action): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTION_EXECUTE, action),
    renderKeyImage: (
      keyConfig: KeyConfig,
      deviceType: string,
    ): Promise<Buffer | Buffer[]> =>
      ipcRenderer.invoke(
        IPC_CHANNELS.ACTION_RENDER_KEY_IMAGE,
        keyConfig,
        deviceType,
      ),
    getAnimationDelays: (keyConfig: KeyConfig): Promise<number[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTION_ANIMATION_DELAYS, keyConfig),
    startMacroRecording: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.MACRO_RECORD_START),
    stopMacroRecording: (): Promise<{ type: string; value: string }[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.MACRO_RECORD_STOP),
  },

  // Media APIs
  media: {
    listPlayers: (): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.MEDIA_PLAYERS_LIST),
  },

  // Shortcut recorder APIs
  shortcut: {
    /** Ask main to ignore app-menu shortcuts while recording (or restore). */
    setRecordMode: (active: boolean): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SHORTCUT_RECORD_MODE, active),
  },

  // Asset APIs
  asset: {
    upload: (filePath: string): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.ASSET_UPLOAD, filePath),
    list: (): Promise<string[]> => ipcRenderer.invoke(IPC_CHANNELS.ASSET_LIST),
    delete: (assetName: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.ASSET_DELETE, assetName),
    fetchFavicon: (url: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ASSET_FETCH_FAVICON, url),
    fetchAppIcon: (appPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ASSET_FETCH_APP_ICON, appPath),
    readAsDataURL: (sourcePath: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.ASSET_READ_AS_DATA_URL, sourcePath),
  },

  // Dialog APIs
  dialog: {
    openFile: (options: any): Promise<string[] | undefined> =>
      ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, options),
    openDirectory: (options: any): Promise<string[] | undefined> =>
      ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, options),
  },

  // Settings APIs
  settings: {
    get: (): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (settings: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),
  },

  // Plugin APIs
  plugin: {
    list: (): Promise<PluginInfo[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_LIST),
    enable: (pluginId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_ENABLE, pluginId),
    disable: (pluginId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_DISABLE, pluginId),
  },

  // Icon pack APIs (Elgato .sdIconPack libraries)
  assets: {
    listIconPacks: (): Promise<IconPackSummary[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.ASSETS_LIST_ICON_PACKS),
    listIcons: (packId: string): Promise<IconEntry[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.ASSETS_LIST_ICONS, packId),
    getIcon: (packId: string, iconId: string): Promise<IconFile | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.ASSETS_GET_ICON, packId, iconId),
  },

  // App picker (auto-switch binding)
  apps: {
    listDesktopApps: (): Promise<DesktopApp[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.APPS_LIST_DESKTOP_APPS),
    listCliTools: (): Promise<CliTool[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.APPS_LIST_CLI_TOOLS),
  },

  // Window controls (frameless custom titlebar)
  window: {
    minimize: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    isMaximized: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
    onMaximizedChanged: (callback: (maximized: boolean) => void) => {
      const handler = (_: Electron.IpcRendererEvent, maximized: boolean) =>
        callback(maximized);
      ipcRenderer.on(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGED, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGED, handler);
    },
  },

  // Elgato .sdPlugin host (localized plugin/action summaries + management)
  sd: {
    listPlugins: (): Promise<SDPluginSummary[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.SD_LIST_PLUGINS),
    installFromFile: (filePath: string): Promise<SDPluginSummary> =>
      ipcRenderer.invoke(IPC_CHANNELS.SD_INSTALL_FROM_FILE, filePath),
    setPluginEnabled: (uuid: string, enabled: boolean): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SD_SET_PLUGIN_ENABLED, uuid, enabled),
  },

  // Elgato .sdLayoutEx InfoBar layouts (Settings gallery)
  layouts: {
    list: (): Promise<LayoutSummary[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.LAYOUTS_LIST),
    preview: (id: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.LAYOUTS_PREVIEW, id),
    import: (sourceDir: string): Promise<LayoutImportReport> =>
      ipcRenderer.invoke(IPC_CHANNELS.LAYOUTS_IMPORT, sourceDir),
  },

  // Keyboard injection diagnostics (Linux)
  keybind: {
    status: (): Promise<KeyboardInjectionStatus> =>
      ipcRenderer.invoke(IPC_CHANNELS.KEYBIND_STATUS),
    test: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.KEYBIND_TEST),
  },

  // Error handler
  onError: (callback: (error: { message: string; code: string }) => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      error: { message: string; code: string },
    ) => callback(error);
    ipcRenderer.on(IPC_CHANNELS.ERROR, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.ERROR, handler);
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld("bigdeck", api);

// Type declaration for the renderer
export type BigDeckAPI = typeof api;
