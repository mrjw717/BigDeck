import { create } from "zustand";
import type {
  Profile,
  KeyConfig,
  Action,
  ProfilePage,
  DeviceType,
} from "../../shared/types";
import { DEVICE_SPECS } from "../../shared/constants";

interface ProfileState {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  createProfile: (name: string, deviceType: string) => Promise<Profile | null>;
  updateProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  activateProfile: (profileId: string) => Promise<void>;
  setActivePage: (pageIndex: number) => void;
  updateKeyConfig: (
    keyIndex: number,
    config: Partial<KeyConfig>,
  ) => Promise<void>;
  setKeyAction: (keyIndex: number, action: Action | undefined) => Promise<void>;
  addPage: (name?: string) => Promise<void>;
  removePage: (pageIndex: number) => Promise<void>;
  renamePage: (pageIndex: number, name: string) => Promise<void>;
  duplicatePage: (pageIndex: number) => Promise<void>;
  reorderPages: (fromIndex: number, toIndex: number) => Promise<void>;
  addBlankKeysToPage: (page: ProfilePage) => ProfilePage;
  importProfile: (json: string) => Promise<void>;
  exportProfile: (profileId: string) => Promise<string | null>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfile: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const profiles = (await window.bigdeck?.profile.list()) || [];

      // Find active profile or use first one
      const activeProfile =
        profiles.find((p: Profile) => p.isDefault) || profiles[0] || null;

      set({
        profiles,
        activeProfile,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: `Failed to initialize profiles: ${error}`,
        isLoading: false,
      });
    }
  },

  createProfile: async (name, deviceType) => {
    try {
      const specs =
        DEVICE_SPECS[deviceType as DeviceType] || DEVICE_SPECS["original"];
      const newProfile = await window.bigdeck?.profile.create({
        name,
        deviceType: deviceType as any,
        pages: [
          {
            id: crypto.randomUUID(),
            name: "Page 1",
            keys: Array.from({ length: specs.keyCount }, (_, i) => ({
              id: crypto.randomUUID(),
              keyIndex: i,
            })),
          },
        ],
        activePage: 0,
      });

      if (newProfile) {
        set((state) => ({
          profiles: [...state.profiles, newProfile],
        }));
        return newProfile;
      }
      return null;
    } catch (error) {
      set({ error: `Failed to create profile: ${error}` });
      return null;
    }
  },

  updateProfile: async (profile) => {
    try {
      const updated = await window.bigdeck?.profile.update(profile);
      if (updated) {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === updated.id ? updated : p,
          ),
        }));
      }
    } catch (error) {
      set({ error: `Failed to update profile: ${error}` });
    }
  },

  deleteProfile: async (profileId) => {
    try {
      await window.bigdeck?.profile.delete(profileId);
      set((state) => {
        const profiles = state.profiles.filter((p) => p.id !== profileId);
        return {
          profiles,
          activeProfile:
            state.activeProfile?.id === profileId
              ? profiles[0] || null
              : state.activeProfile,
        };
      });
    } catch (error) {
      set({ error: `Failed to delete profile: ${error}` });
    }
  },

  activateProfile: async (profileId) => {
    try {
      await window.bigdeck?.profile.activate(profileId);
      const { profiles } = get();
      const profile = profiles.find((p) => p.id === profileId);
      if (profile) {
        set({ activeProfile: profile });
      }
    } catch (error) {
      set({ error: `Failed to activate profile: ${error}` });
    }
  },

  setActivePage: (pageIndex) => {
    set((state) => {
      if (!state.activeProfile) return state;
      return {
        activeProfile: {
          ...state.activeProfile,
          activePage: pageIndex,
        },
      };
    });
  },

  updateKeyConfig: async (keyIndex, config) => {
    const { activeProfile, updateProfile } = get();
    if (!activeProfile) return;

    const previousProfile = activeProfile;

    const page = activeProfile.pages[activeProfile.activePage];
    if (!page) return;

    const updatedKeys = page.keys.map((key) =>
      key.keyIndex === keyIndex ? { ...key, ...config } : key,
    );

    if (!page.keys.find((k) => k.keyIndex === keyIndex)) {
      updatedKeys.push({
        id: crypto.randomUUID(),
        keyIndex,
        ...config,
      } as KeyConfig);
    }

    const updatedProfile = {
      ...activeProfile,
      pages: activeProfile.pages.map((p, i) =>
        i === activeProfile.activePage ? { ...p, keys: updatedKeys } : p,
      ),
    };

    // Optimistic local update; main persists (debounced) and re-renders hardware.
    set({ activeProfile: updatedProfile });

    try {
      await updateProfile(updatedProfile);
    } catch (error) {
      set({ activeProfile: previousProfile });
      console.error("Failed to save key config:", error);
    }
  },

  setKeyAction: async (keyIndex, action) => {
    await get().updateKeyConfig(keyIndex, { action });
  },

  addBlankKeysToPage: (page) => {
    const keyCount = page.keys.length || 0;
    if (keyCount > 0) {
      return page;
    }

    const { activeProfile } = get();
    const deviceType = activeProfile?.deviceType || "original";
    const specs = DEVICE_SPECS[deviceType] || DEVICE_SPECS["original"];
    const defaultKeyCount = specs.keyCount;
    return {
      ...page,
      keys: Array.from({ length: defaultKeyCount }, (_, i) => ({
        id: crypto.randomUUID(),
        keyIndex: i,
      })),
    };
  },

  addPage: async (name) => {
    const { activeProfile, updateProfile } = get();
    if (!activeProfile) return;

    const specs = DEVICE_SPECS[activeProfile.deviceType];
    const keyCount = specs.keyCount;

    const newPage = {
      id: crypto.randomUUID(),
      name: name?.trim() || `Page ${activeProfile.pages.length + 1}`,
      keys: Array.from({ length: keyCount }, (_, i) => ({
        id: crypto.randomUUID(),
        keyIndex: i,
      })),
    };

    await updateProfile({
      ...activeProfile,
      pages: [...activeProfile.pages, newPage],
    });
  },

  removePage: async (pageIndex) => {
    const { activeProfile, updateProfile } = get();
    if (!activeProfile || activeProfile.pages.length <= 1) return;

    const pages = activeProfile.pages.filter((_, i) => i !== pageIndex);
    const activePage = Math.min(activeProfile.activePage, pages.length - 1);

    await updateProfile({
      ...activeProfile,
      pages,
      activePage,
    });
  },

  renamePage: async (pageIndex, name) => {
    const { activeProfile, updateProfile } = get();
    if (!activeProfile) return;

    const pages = activeProfile.pages.map((page, idx) =>
      idx === pageIndex ? { ...page, name: name.trim() || page.name } : page,
    );

    await updateProfile({
      ...activeProfile,
      pages,
    });
  },

  duplicatePage: async (pageIndex) => {
    const { activeProfile, updateProfile } = get();
    if (!activeProfile) return;

    const page = activeProfile.pages[pageIndex];
    if (!page) return;

    const clonedPage: ProfilePage = {
      ...page,
      id: crypto.randomUUID(),
      name: `${page.name} Copy`,
      keys: page.keys.map((key) => ({
        ...key,
        id: crypto.randomUUID(),
        action: key.action
          ? { ...key.action, id: crypto.randomUUID() }
          : undefined,
      })),
    };

    const pages = [
      ...activeProfile.pages.slice(0, pageIndex + 1),
      clonedPage,
      ...activeProfile.pages.slice(pageIndex + 1),
    ];

    await updateProfile({
      ...activeProfile,
      pages,
      activePage: pageIndex + 1,
    });
  },

  reorderPages: async (fromIndex, toIndex) => {
    const { activeProfile, updateProfile } = get();
    if (!activeProfile) return;

    const pages = [...activeProfile.pages];
    const [moved] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, moved);

    const activePage =
      activeProfile.activePage === fromIndex
        ? toIndex
        : activeProfile.activePage === toIndex
          ? fromIndex
          : activeProfile.activePage;

    await updateProfile({
      ...activeProfile,
      pages,
      activePage,
    });
  },

  importProfile: async (json) => {
    try {
      const imported = await window.bigdeck?.profile.import(json);
      if (imported) {
        set((state) => ({
          profiles: [...state.profiles, imported],
        }));
      }
    } catch (error) {
      set({ error: `Failed to import profile: ${error}` });
    }
  },

  exportProfile: async (profileId) => {
    try {
      return (await window.bigdeck?.profile.export(profileId)) || null;
    } catch (error) {
      set({ error: `Failed to export profile: ${error}` });
      return null;
    }
  },
}));
