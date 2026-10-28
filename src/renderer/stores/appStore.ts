import { create } from 'zustand';
import type {
  AppSettings,
  LayoutSummary,
  LayoutImportReport,
  DesktopApp,
  CliTool,
} from '../../shared/types';
import type { IconPackSummary, IconEntry, IconFile } from '../../main/assets/IconPack';
import type { SDPluginSummary } from '../../main/plugins/sd/SDPluginHost';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  initialize: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  settings: null,
  isLoading: true,
  error: null,

  setTheme: (theme) => {
    set({ theme });
    // Persist theme setting
    window.bigdeck?.settings.update({ theme });
  },

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const settings = await window.bigdeck?.settings.get();
      if (settings) {
        set({ 
          settings, 
          theme: settings.theme,
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        error: `Failed to initialize: ${error}`, 
        isLoading: false 
      });
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const updated = await window.bigdeck?.settings.update(newSettings);
      if (updated) {
        set({ settings: updated });
        if (newSettings.theme) {
          set({ theme: newSettings.theme });
        }
      }
    } catch (error) {
      set({ error: `Failed to update settings: ${error}` });
    }
  },

  setError: (error) => set({ error }),
}));

// Type declaration for window.bigdeck
declare global {
  interface Window {
    bigdeck?: {
      device: {
        list: () => Promise<any[]>;
        connect: (deviceId: string) => Promise<boolean>;
        disconnect: (deviceId: string) => Promise<void>;
        setBrightness: (deviceId: string, brightness: number) => Promise<void>;
        setKeyImage: (deviceId: string, keyIndex: number, imageBuffer: Buffer) => Promise<void>;
        clearKey: (deviceId: string, keyIndex: number) => Promise<void>;
        clearAllKeys: (deviceId: string) => Promise<void>;
        onConnected: (callback: (device: any) => void) => () => void;
        onDisconnected: (callback: (deviceId: string) => void) => () => void;
        onKeyDown: (callback: (data: { deviceId: string; keyIndex: number }) => void) => () => void;
        onKeyUp: (callback: (data: { deviceId: string; keyIndex: number }) => void) => () => void;
      };
      profile: {
        list: () => Promise<any[]>;
        get: (profileId: string) => Promise<any | null>;
        create: (profile: any) => Promise<any>;
        update: (profile: any) => Promise<any>;
        delete: (profileId: string) => Promise<void>;
        activate: (profileId: string) => Promise<void>;
        export: (profileId: string) => Promise<string>;
        import: (profileJson: string) => Promise<any>;
        setDefault: (profileId: string) => Promise<any>;
        importElgato: (filePath: string) => Promise<any>;
        addAutoSwitchRule: (
          profileId: string,
          rule: { type: string; pattern: string; isRegex?: boolean },
        ) => Promise<any>;
        removeAutoSwitchRule: (
          profileId: string,
          ruleId: string,
        ) => Promise<any>;
        onChanged: (callback: (profile: any) => void) => () => void;
        onPageChanged: (callback: (data: { profileId: string; pageIndex: number }) => void) => () => void;
      };
      action: {
        execute: (action: any) => Promise<void>;
        startMacroRecording: () => Promise<void>;
        stopMacroRecording: () => Promise<{ type: string; value: string }[]>;
      };
      shortcut: {
        /** Ignore/restore application-menu shortcuts while recording. */
        setRecordMode: (active: boolean) => Promise<void>;
      };
      apps: {
        listDesktopApps: () => Promise<DesktopApp[]>;
        listCliTools: () => Promise<CliTool[]>;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
        onMaximizedChanged: (callback: (maximized: boolean) => void) => () => void;
      };
      dialog: {
        openFile: (options: any) => Promise<string[] | undefined>;
        openDirectory: (options: any) => Promise<string[] | undefined>;
      };
      assets: {
        listIconPacks: () => Promise<IconPackSummary[]>;
        listIcons: (packId: string) => Promise<IconEntry[]>;
        getIcon: (packId: string, iconId: string) => Promise<IconFile | null>;
      };
      sd: {
        listPlugins: () => Promise<SDPluginSummary[]>;
        installFromFile: (filePath: string) => Promise<SDPluginSummary>;
        setPluginEnabled: (uuid: string, enabled: boolean) => Promise<void>;
      };
      layouts: {
        list: () => Promise<LayoutSummary[]>;
        preview: (id: string) => Promise<string | null>;
        import: (sourceDir: string) => Promise<LayoutImportReport>;
      };
      keybind: {
        status: () => Promise<any>;
        test: () => Promise<boolean>;
      };
      settings: {
        get: () => Promise<any>;
        update: (settings: any) => Promise<any>;
      };
      plugin: {
        list: () => Promise<any[]>;
        enable: (pluginId: string) => Promise<void>;
        disable: (pluginId: string) => Promise<void>;
      };
      onError: (callback: (error: { message: string; code: string }) => void) => () => void;
    };
  }
}
