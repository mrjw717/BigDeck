// ============================================================================
// BigDeck - Settings Manager
// Handles persistent application settings
// ============================================================================

import Store from 'electron-store';
import { DEFAULT_SETTINGS } from '../../shared/constants';
import type { AppSettings } from '../../shared/types';
import type { Logger } from './Logger';

export class SettingsManager {
  private store: Store<AppSettings>;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    
    this.store = new Store<AppSettings>({
      name: 'settings',
      defaults: DEFAULT_SETTINGS,
      schema: {
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'system'],
        },
        startMinimized: {
          type: 'boolean',
        },
        minimizeToTray: {
          type: 'boolean',
        },
        autoStart: {
          type: 'boolean',
        },
        brightness: {
          type: 'number',
          minimum: 0,
          maximum: 100,
        },
        networkControl: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            port: { type: 'number' },
            authToken: { type: 'string' },
          },
        },
        logging: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
            maxFiles: { type: 'number' },
          },
        },
      },
    });

    this.logger.debug('Settings manager initialized');
  }

  /**
   * Get all settings
   */
  getSettings(): AppSettings {
    return this.store.store;
  }

  /**
   * Get a specific setting
   */
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key);
  }

  /**
   * Update settings (partial update)
   */
  updateSettings(settings: Partial<AppSettings>): AppSettings {
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        this.store.set(key as keyof AppSettings, value);
      }
    }
    
    this.logger.info('Settings updated', settings);
    return this.store.store;
  }

  /**
   * Set a specific setting
   */
  setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.store.set(key, value);
    this.logger.debug(`Setting updated: ${key}`);
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): AppSettings {
    this.store.clear();
    this.logger.info('Settings reset to defaults');
    return this.store.store;
  }

  /**
   * Get the path to the settings file
   */
  getSettingsPath(): string {
    return this.store.path;
  }
}
