import { create } from 'zustand';
import type { DeviceInfo } from '../../shared/types';

interface DeviceState {
  devices: DeviceInfo[];
  activeDevice: DeviceInfo | null;
  pressedKeys: Set<number>;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setActiveDevice: (deviceId: string) => void;
  setBrightness: (brightness: number) => Promise<void>;
  subscribeToEvents: () => () => void;
  addDevice: (device: DeviceInfo) => void;
  removeDevice: (deviceId: string) => void;
  setKeyPressed: (keyIndex: number, pressed: boolean) => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  activeDevice: null,
  pressedKeys: new Set(),
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const devices = await window.bigdeck?.device.list() || [];
      
      set({ 
        devices,
        activeDevice: devices[0] || null,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: `Failed to initialize devices: ${error}`,
        isLoading: false 
      });
    }
  },

  setActiveDevice: (deviceId) => {
    const { devices } = get();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      set({ activeDevice: device });
    }
  },

  setBrightness: async (brightness) => {
    const { activeDevice } = get();
    if (activeDevice) {
      await window.bigdeck?.device.setBrightness(activeDevice.id, brightness);
    }
  },

  subscribeToEvents: () => {
    const unsubConnected = window.bigdeck?.device.onConnected((device) => {
      get().addDevice(device);
    });

    const unsubDisconnected = window.bigdeck?.device.onDisconnected((deviceId) => {
      get().removeDevice(deviceId);
    });

    const unsubKeyDown = window.bigdeck?.device.onKeyDown(({ keyIndex }) => {
      get().setKeyPressed(keyIndex, true);
    });

    const unsubKeyUp = window.bigdeck?.device.onKeyUp(({ keyIndex }) => {
      get().setKeyPressed(keyIndex, false);
    });

    return () => {
      unsubConnected?.();
      unsubDisconnected?.();
      unsubKeyDown?.();
      unsubKeyUp?.();
    };
  },

  addDevice: (device) => {
    set((state) => {
      const exists = state.devices.some(d => d.id === device.id);
      if (exists) return state;
      
      const devices = [...state.devices, device];
      return {
        devices,
        activeDevice: state.activeDevice || device,
      };
    });
  },

  removeDevice: (deviceId) => {
    set((state) => {
      const devices = state.devices.filter(d => d.id !== deviceId);
      return {
        devices,
        activeDevice: state.activeDevice?.id === deviceId 
          ? devices[0] || null 
          : state.activeDevice,
      };
    });
  },

  setKeyPressed: (keyIndex, pressed) => {
    set((state) => {
      const pressedKeys = new Set(state.pressedKeys);
      if (pressed) {
        pressedKeys.add(keyIndex);
      } else {
        pressedKeys.delete(keyIndex);
      }
      return { pressedKeys };
    });
  },
}));
