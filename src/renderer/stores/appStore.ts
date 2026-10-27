import { create } from 'zustand';
import type { AppSettings } from '../../shared/types';

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
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
        onMaximizedChanged: (callback: (maximized: boolean) => void) => () => void;
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
