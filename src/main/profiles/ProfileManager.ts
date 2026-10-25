// ============================================================================
// BigDeck - Profile Manager
// Handles profile CRUD, persistence, and switching
// ============================================================================

import { EventEmitter } from 'events';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import type { Profile, ProfilePage, KeyConfig, DeviceType, AutoSwitchRule } from '../../shared/types';
import { DEVICE_SPECS } from '../../shared/constants';
import type { Logger } from '../utils/Logger';

interface ProfileStore {
  profiles: Profile[];
  activeProfileId: string | null;
}

export class ProfileManager extends EventEmitter {
  private store: Store<ProfileStore>;
  private logger: Logger;
  private activeProfileId: string | null = null;
  /** In-memory authoritative profile list; disk writes are debounced. */
  private profiles: Profile[];
  private persistTimer: NodeJS.Timeout | null = null;
  /** Trailing debounce for profile persistence (slider drags, typing). */
  private readonly PERSIST_DEBOUNCE_MS = 500;

  constructor(logger: Logger) {
    super();
    this.logger = logger;

    this.store = new Store<ProfileStore>({
      name: 'profiles',
      defaults: {
        profiles: [],
        activeProfileId: null,
      },
    });

    this.profiles = this.store.get('profiles', []);
    this.activeProfileId = this.store.get('activeProfileId');
    this.logger.debug('Profile manager initialized');
  }

  /**
   * Schedule a trailing-edge disk write. Rapid successive mutations coalesce
   * into a single write, so typing/slider drags don't hammer the disk.
   */
  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.store.set('profiles', this.profiles);
    }, this.PERSIST_DEBOUNCE_MS);
  }

  /**
   * Write any pending profile changes to disk immediately (call on quit).
   */
  flush(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.store.set('profiles', this.profiles);
  }

  /**
   * Get all profiles
   */
  getProfiles(): Profile[] {
    return this.profiles;
  }

  /**
   * Get profiles for a specific device type
   */
  getProfilesForDevice(deviceType: DeviceType): Profile[] {
    return this.getProfiles().filter(p => p.deviceType === deviceType);
  }

  /**
   * Get a specific profile
   */
  getProfile(profileId: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === profileId) || null;
  }

  /**
   * Get the currently active profile
   */
  getActiveProfile(): Profile | null {
    if (!this.activeProfileId) return null;
    return this.getProfile(this.activeProfileId);
  }

  /**
   * Resolve the KeyConfig a hardware key press maps to: the key with this
   * index on the ACTIVE profile's ACTIVE page. Returns null when there is no
   * active profile, the activePage index is out of range (e.g. a stale value
   * persisted by an older build), or the key has no entry on that page.
   * Callers log the difference so dispatch drops are diagnosable instead of
   * silent — this lookup is the single source of truth for hardware presses.
   */
  getActiveKeyConfig(
    keyIndex: number,
  ): { keyConfig: KeyConfig; deviceType: DeviceType } | null {
    const profile = this.getActiveProfile();
    if (!profile) return null;
    const page = profile.pages[profile.activePage];
    const keyConfig = page?.keys.find((k) => k.keyIndex === keyIndex);
    return keyConfig
      ? { keyConfig, deviceType: profile.deviceType }
      : null;
  }

  /**
   * Create a new profile
   */
  createProfile(profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Profile {
    const now = new Date().toISOString();

    const profile: Profile = {
      ...profileData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    this.profiles.push(profile);
    this.schedulePersist();

    this.logger.info(`Profile created: ${profile.name} (${profile.id})`);
    return profile;
  }

  /**
   * Create a default profile for a device type
   */
  createDefaultProfile(deviceType: DeviceType, keyCount: number): Profile {
    const pages: ProfilePage[] = [{
      id: uuidv4(),
      name: 'Page 1',
      keys: Array.from({ length: keyCount }, (_, i): KeyConfig => ({
        id: uuidv4(),
        keyIndex: i,
      })),
    }];

    return this.createProfile({
      name: 'Default Profile',
      deviceType,
      isDefault: true,
      pages,
      activePage: 0,
    });
  }

  /**
   * Update an existing profile
   */
  updateProfile(updatedProfile: Profile): Profile {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === updatedProfile.id);

    if (index === -1) {
      throw new Error(`Profile not found: ${updatedProfile.id}`);
    }

    updatedProfile.updatedAt = new Date().toISOString();
    profiles[index] = updatedProfile;
    this.schedulePersist();

    this.emit('profile:updated', updatedProfile);
    this.logger.info(`Profile updated: ${updatedProfile.name}`);

    return updatedProfile;
  }

  /**
   * Delete a profile
   */
  deleteProfile(profileId: string): void {
    const profile = this.profiles.find(p => p.id === profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    this.profiles = this.profiles.filter(p => p.id !== profileId);
    this.schedulePersist();

    if (this.activeProfileId === profileId) {
      this.activeProfileId = this.profiles[0]?.id || null;
      this.store.set('activeProfileId', this.activeProfileId);
    }

    this.emit('profile:deleted', profileId);
    this.logger.info(`Profile deleted: ${profile.name}`);
  }

  /**
   * Activate a profile
   */
  activateProfile(profileId: string): Profile {
    const profile = this.getProfile(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    this.activeProfileId = profileId;
    this.store.set('activeProfileId', profileId);

    this.emit('profile:activated', profile);
    this.logger.info(`Profile activated: ${profile.name}`);

    return profile;
  }

  /**
   * Set the active page for a profile
   */
  setActivePage(profileId: string, pageIndex: number): Profile {
    const profile = this.getProfile(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    if (pageIndex < 0 || pageIndex >= profile.pages.length) {
      throw new Error(`Invalid page index: ${pageIndex}`);
    }

    profile.activePage = pageIndex;
    this.updateProfile(profile);

    this.emit('profile:page-changed', { profileId, pageIndex });
    return profile;
  }

  /**
   * Add a page to a profile
   */
  addPage(profileId: string, pageName: string): Profile {
    const profile = this.getProfile(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const specs = DEVICE_SPECS[profile.deviceType];
    const keyCount = specs?.keyCount || 15;

    const newPage: ProfilePage = {
      id: uuidv4(),
      name: pageName,
      keys: Array.from({ length: keyCount }, (_, i): KeyConfig => ({
        id: uuidv4(),
        keyIndex: i,
      })),
    };

    profile.pages.push(newPage);
    return this.updateProfile(profile);
  }

  /**
   * Remove a page from a profile
   */
  removePage(profileId: string, pageIndex: number): Profile {
    const profile = this.getProfile(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    if (profile.pages.length <= 1) {
      throw new Error('Cannot remove the last page');
    }

    profile.pages.splice(pageIndex, 1);

    if (profile.activePage >= profile.pages.length) {
      profile.activePage = profile.pages.length - 1;
    }

    return this.updateProfile(profile);
  }

  /**
   * Update a key configuration
   */
  updateKeyConfig(profileId: string, pageIndex: number, keyConfig: KeyConfig): Profile {
    const profile = this.getProfile(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const page = profile.pages[pageIndex];
    if (!page) {
      throw new Error(`Page not found: ${pageIndex}`);
    }

    const keyIndex = page.keys.findIndex(k => k.keyIndex === keyConfig.keyIndex);
    if (keyIndex === -1) {
      page.keys.push(keyConfig);
    } else {
      page.keys[keyIndex] = keyConfig;
    }

    return this.updateProfile(profile);
  }

  /**
   * Export a profile as JSON
   */
  exportProfile(profileId: string): string {
    const profile = this.getProfile(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import a profile from JSON
   */
  importProfile(profileJson: string): Profile {
    try {
      const imported = JSON.parse(profileJson) as Profile;

      // Generate new IDs to avoid conflicts
      imported.id = uuidv4();
      imported.name = `${imported.name} (Imported)`;
      imported.createdAt = new Date().toISOString();
      imported.updatedAt = new Date().toISOString();

      for (const page of imported.pages) {
        page.id = uuidv4();
        for (const key of page.keys) {
          key.id = uuidv4();
        }
      }

      this.profiles.push(imported);
      this.schedulePersist();

      this.logger.info(`Profile imported: ${imported.name}`);
      return imported;
    } catch (error) {
      throw new Error(`Invalid profile JSON: ${error}`);
    }
  }

  /**
   * Add an auto-switch rule to a profile
   */
  addAutoSwitchRule(profileId: string, rule: Omit<AutoSwitchRule, 'id'>): Profile {
    const profile = this.getProfile(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    if (!profile.autoSwitchRules) {
      profile.autoSwitchRules = [];
    }

    profile.autoSwitchRules.push({
      ...rule,
      id: uuidv4(),
    });

    return this.updateProfile(profile);
  }

  /**
   * Remove an auto-switch rule
   */
  removeAutoSwitchRule(profileId: string, ruleId: string): Profile {
    const profile = this.getProfile(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    if (profile.autoSwitchRules) {
      profile.autoSwitchRules = profile.autoSwitchRules.filter(r => r.id !== ruleId);
    }

    return this.updateProfile(profile);
  }

  /**
   * Find a profile matching auto-switch rules
   */
  findProfileByAutoSwitch(windowClass: string, windowTitle: string, processName: string): Profile | null {
    const profiles = this.getProfiles();

    for (const profile of profiles) {
      if (!profile.autoSwitchRules) continue;

      for (const rule of profile.autoSwitchRules) {
        let value: string;
        switch (rule.type) {
          case 'window-class':
            value = windowClass;
            break;
          case 'window-title':
            value = windowTitle;
            break;
          case 'process-name':
            value = processName;
            break;
        }

        const matches = rule.isRegex
          ? new RegExp(rule.pattern).test(value)
          : value.toLowerCase().includes(rule.pattern.toLowerCase());

        if (matches) {
          return profile;
        }
      }
    }

    return null;
  }
}
