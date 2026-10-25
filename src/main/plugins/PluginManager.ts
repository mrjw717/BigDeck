// ============================================================================
// BigDeck - Plugin Manager
// Handles loading, enabling, and executing plugin actions
// ============================================================================

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import { CONFIG_DIR_NAME, PLUGINS_DIR_NAME } from '../../shared/constants';
import type { PluginInfo, PluginActionDefinition, Action } from '../../shared/types';
import type { Logger } from '../utils/Logger';

export interface Plugin {
  info: PluginInfo;
  instance?: PluginInstance;
}

export interface PluginInstance {
  initialize?: () => Promise<void>;
  cleanup?: () => Promise<void>;
  executeAction: (actionId: string, config?: Record<string, unknown>) => Promise<void>;
  getActions: () => PluginActionDefinition[];
}

export interface PluginModule {
  default: {
    info: Omit<PluginInfo, 'enabled'>;
    create: (api: PluginAPI) => PluginInstance;
  };
}

export interface PluginAPI {
  log: {
    debug: (msg: string) => void;
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
  exec: (command: string) => Promise<string>;
  notify: (title: string, body: string) => void;
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private logger: Logger;
  private pluginsDir: string;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    
    const userDataPath = app?.getPath?.('userData') || process.env.HOME || '/tmp';
    this.pluginsDir = path.join(userDataPath, CONFIG_DIR_NAME, PLUGINS_DIR_NAME);
  }

  /**
   * Load all plugins from plugins directory
   */
  async loadPlugins(): Promise<void> {
    this.logger.info('Loading plugins...');

    // Ensure plugins directory exists
    await fs.mkdir(this.pluginsDir, { recursive: true });

    // Load built-in plugins
    await this.loadBuiltinPlugins();

    // Load user plugins
    await this.loadUserPlugins();

    this.logger.info(`Loaded ${this.plugins.size} plugins`);
  }

  /**
   * Load built-in plugins
   */
  private async loadBuiltinPlugins(): Promise<void> {
    const builtinPlugins: PluginInfo[] = [
      {
        id: 'obs-websocket',
        name: 'OBS WebSocket',
        version: '1.0.0',
        author: 'BigDeck',
        description: 'Control OBS Studio via WebSocket',
        enabled: false,
        actions: [
          { id: 'start-streaming', name: 'Start Streaming', description: 'Start OBS streaming' },
          { id: 'stop-streaming', name: 'Stop Streaming', description: 'Stop OBS streaming' },
          { id: 'start-recording', name: 'Start Recording', description: 'Start OBS recording' },
          { id: 'stop-recording', name: 'Stop Recording', description: 'Stop OBS recording' },
          { id: 'switch-scene', name: 'Switch Scene', description: 'Switch to a specific scene' },
          { id: 'toggle-source', name: 'Toggle Source', description: 'Toggle source visibility' },
        ],
      },
      {
        id: 'spotify',
        name: 'Spotify',
        version: '1.0.0',
        author: 'BigDeck',
        description: 'Control Spotify playback',
        enabled: false,
        actions: [
          { id: 'play-pause', name: 'Play/Pause', description: 'Toggle playback' },
          { id: 'next-track', name: 'Next Track', description: 'Skip to next track' },
          { id: 'previous-track', name: 'Previous Track', description: 'Go to previous track' },
          { id: 'shuffle', name: 'Toggle Shuffle', description: 'Toggle shuffle mode' },
          { id: 'save-track', name: 'Save Track', description: 'Save current track to library' },
        ],
      },
      {
        id: 'system-monitor',
        name: 'System Monitor',
        version: '1.0.0',
        author: 'BigDeck',
        description: 'Display system information on keys',
        enabled: false,
        actions: [
          { id: 'cpu-usage', name: 'CPU Usage', description: 'Show CPU usage percentage' },
          { id: 'memory-usage', name: 'Memory Usage', description: 'Show memory usage' },
          { id: 'disk-usage', name: 'Disk Usage', description: 'Show disk usage' },
          { id: 'network-speed', name: 'Network Speed', description: 'Show network throughput' },
        ],
      },
      {
        id: 'counter',
        name: 'Counter',
        version: '1.0.0',
        author: 'BigDeck',
        description: 'Simple counter for tracking numbers',
        enabled: true,
        actions: [
          { id: 'increment', name: 'Increment', description: 'Add to counter' },
          { id: 'decrement', name: 'Decrement', description: 'Subtract from counter' },
          { id: 'reset', name: 'Reset', description: 'Reset counter to zero' },
        ],
      },
    ];

    for (const pluginInfo of builtinPlugins) {
      this.plugins.set(pluginInfo.id, { info: pluginInfo });
    }
  }

  /**
   * Load user-installed plugins
   */
  private async loadUserPlugins(): Promise<void> {
    try {
      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadPluginFromDirectory(path.join(this.pluginsDir, entry.name));
        }
      }
    } catch (error) {
      this.logger.warn('Error loading user plugins', error);
    }
  }

  /**
   * Load a plugin from a directory
   */
  private async loadPluginFromDirectory(pluginPath: string): Promise<void> {
    try {
      const manifestPath = path.join(pluginPath, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      const pluginInfo: PluginInfo = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        author: manifest.author,
        description: manifest.description,
        enabled: false,
        actions: manifest.actions || [],
      };

      this.plugins.set(pluginInfo.id, { info: pluginInfo });
      this.logger.info(`Loaded plugin: ${pluginInfo.name} v${pluginInfo.version}`);
    } catch (error) {
      this.logger.warn(`Failed to load plugin from ${pluginPath}`, error);
    }
  }

  /**
   * Get all plugins
   */
  getPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(p => p.info);
  }

  /**
   * Get a specific plugin
   */
  getPlugin(pluginId: string): PluginInfo | null {
    return this.plugins.get(pluginId)?.info || null;
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    plugin.info.enabled = true;

    // Initialize plugin instance if needed
    if (plugin.instance?.initialize) {
      await plugin.instance.initialize();
    }

    this.emit('plugin:enabled', pluginId);
    this.logger.info(`Plugin enabled: ${plugin.info.name}`);
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Cleanup plugin instance if needed
    if (plugin.instance?.cleanup) {
      await plugin.instance.cleanup();
    }

    plugin.info.enabled = false;
    this.emit('plugin:disabled', pluginId);
    this.logger.info(`Plugin disabled: ${plugin.info.name}`);
  }

  /**
   * Execute a plugin action
   */
  async executePluginAction(
    pluginId: string,
    actionId: string,
    config?: Record<string, unknown>
  ): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (!plugin.info.enabled) {
      throw new Error(`Plugin is disabled: ${pluginId}`);
    }

    if (plugin.instance) {
      await plugin.instance.executeAction(actionId, config);
    } else {
      // Execute built-in plugin action
      await this.executeBuiltinAction(pluginId, actionId, config);
    }

    this.logger.debug(`Plugin action executed: ${pluginId}/${actionId}`);
  }

  /**
   * Execute built-in plugin actions
   */
  private async executeBuiltinAction(
    pluginId: string,
    actionId: string,
    config?: Record<string, unknown>
  ): Promise<void> {
    switch (pluginId) {
      case 'counter':
        await this.executeCounterAction(actionId, config);
        break;
      default:
        this.logger.warn(`No handler for built-in plugin: ${pluginId}`);
    }
  }

  /**
   * Counter plugin implementation
   */
  private counterValues: Map<string, number> = new Map();

  private async executeCounterAction(
    actionId: string,
    config?: Record<string, unknown>
  ): Promise<void> {
    const counterId = (config?.counterId as string) || 'default';
    const current = this.counterValues.get(counterId) || 0;

    switch (actionId) {
      case 'increment':
        this.counterValues.set(counterId, current + 1);
        break;
      case 'decrement':
        this.counterValues.set(counterId, Math.max(0, current - 1));
        break;
      case 'reset':
        this.counterValues.set(counterId, 0);
        break;
    }

    this.emit('counter:changed', { counterId, value: this.counterValues.get(counterId) });
  }

  /**
   * Create plugin API for user plugins
   */
  private createPluginAPI(pluginId: string): PluginAPI {
    const { exec: execCallback } = require('child_process');
    const { Notification } = require('electron');

    return {
      log: {
        debug: (msg: string) => this.logger.debug(`[${pluginId}] ${msg}`),
        info: (msg: string) => this.logger.info(`[${pluginId}] ${msg}`),
        warn: (msg: string) => this.logger.warn(`[${pluginId}] ${msg}`),
        error: (msg: string) => this.logger.error(`[${pluginId}] ${msg}`),
      },
      exec: (command: string) =>
        new Promise((resolve, reject) => {
          execCallback(command, (error: Error | null, stdout: string) => {
            if (error) reject(error);
            else resolve(stdout);
          });
        }),
      notify: (title: string, body: string) => {
        new Notification({ title, body }).show();
      },
    };
  }

  /**
   * Cleanup all plugins
   */
  async cleanup(): Promise<void> {
    for (const [id, plugin] of this.plugins) {
      if (plugin.instance?.cleanup) {
        try {
          await plugin.instance.cleanup();
        } catch (error) {
          this.logger.warn(`Error cleaning up plugin ${id}`, error);
        }
      }
    }
  }
}
