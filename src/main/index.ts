// ============================================================================
// BigDeck - Main Process Entry Point
// ============================================================================

import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  dialog,
  protocol,
  net,
} from "electron";
import path from "path";
import { pathToFileURL } from "url";
import fs from "fs/promises";
import { DeviceManager } from "./device/DeviceManager";
import { ProfileManager } from "./profiles/ProfileManager";
import { ActionEngine } from "./actions/ActionEngine";
import { PluginManager } from "./plugins/PluginManager";
import { NetworkServer } from "./network/NetworkServer";
import { SettingsManager } from "./utils/SettingsManager";
import { Logger } from "./utils/Logger";
import { IconFetcher } from "./utils/IconFetcher";
import {
  IPC_CHANNELS,
  DEFAULT_SETTINGS,
  DEVICE_SPECS,
} from "../shared/constants";
import type { Action, AppSettings, Profile, KeyConfig } from "../shared/types";

// Globals
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let deviceManager: DeviceManager;
let profileManager: ProfileManager;
let actionEngine: ActionEngine;
let pluginManager: PluginManager;
let networkServer: NetworkServer;
let settingsManager: SettingsManager;
let logger: Logger;

// Is development mode
const isDev = process.env.NODE_ENV === "development";

// Track if app is quitting (for minimize to tray feature)
let isQuitting = false;

// Cache of pre-rendered key images: keyId -> { idle: Buffer|Buffer[], pressed: Buffer|Buffer[] }
// Populated at startup and on key config changes. Makes key down/up responses instant.
const keyImageCache = new Map<string, { idle: Buffer | Buffer[]; pressed: Buffer | Buffer[] }>();

// Single Instance Lock
protocol.registerSchemesAsPrivileged([
  {
    scheme: "bigdeck-asset",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
      // Required so Chromium streams media (animated GIF/WebP, video) from
      // this scheme instead of buffering the whole response first.
      stream: true,
    },
  },
]);

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  async function createWindow(): Promise<void> {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      title: "BigDeck",
      icon: path.join(app.getAppPath(), "assets/icons/bigdeck-icon.png"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(app.getAppPath(), "dist/preload/preload.js"),
      },
      frame: true,
      show: false,
      backgroundColor: "#0f0f0f",
    });

    // Load the app
    if (isDev) {
      await mainWindow.loadURL("http://localhost:5173");
      mainWindow.webContents.openDevTools();
    } else {
      // Correct path for production load
      await mainWindow.loadFile(
        path.join(app.getAppPath(), "dist/renderer/index.html"),
      );
    }

    mainWindow.once("ready-to-show", () => {
      const settings = settingsManager.getSettings();
      if (!settings.startMinimized) {
        mainWindow?.show();
      } else {
        logger.info("App started minimized to tray");
      }
    });

    mainWindow.on("close", (event) => {
      const settings = settingsManager.getSettings();
      if (settings.minimizeToTray && !isQuitting) {
        event.preventDefault();
        mainWindow?.hide();
      }
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  function createTray(): void {
    // Fix icon path for both dev and production
    const iconPath = path.join(app.getAppPath(), "assets/icons/icon-32x32.png");
    const icon = nativeImage.createFromPath(iconPath);

    if (icon.isEmpty()) {
      logger.error(`Failed to load tray icon from: ${iconPath}`);
    }

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show BigDeck",
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("BigDeck - Streamdeck Controller");
    tray.setContextMenu(contextMenu);

    tray.on("double-click", () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
  }

  function setupIPC(): void {
    // Device IPC handlers
    ipcMain.handle(IPC_CHANNELS.DEVICE_LIST, () => {
      return deviceManager.getDevices();
    });

    ipcMain.handle(IPC_CHANNELS.DEVICE_CONNECT, async (_, deviceId: string) => {
      return deviceManager.connectDevice(deviceId);
    });

    ipcMain.handle(
      IPC_CHANNELS.DEVICE_DISCONNECT,
      async (_, deviceId: string) => {
        return deviceManager.disconnectDevice(deviceId);
      },
    );

    ipcMain.handle(
      IPC_CHANNELS.DEVICE_SET_BRIGHTNESS,
      async (_, deviceId: string, brightness: number) => {
        return deviceManager.setBrightness(deviceId, brightness);
      },
    );

    ipcMain.handle(
      IPC_CHANNELS.DEVICE_SET_KEY_IMAGE,
      async (
        _,
        deviceId: string,
        keyIndex: number,
        imageOrFrames: Buffer | Buffer[],
        forceUpdate: boolean = false,
        keyConfig?: KeyConfig,
      ) => {
        let delays: number[] | undefined;
        if (Array.isArray(imageOrFrames) && keyConfig) {
          try {
            delays = await actionEngine.getAnimationDelays(keyConfig);
          } catch {}
        }
        await deviceManager.setKeyImage(deviceId, keyIndex, imageOrFrames, forceUpdate, delays);

        // Update cache with idle state; pressed will be lazily rendered on first press
        if (keyConfig) {
          const keyId = `${deviceId}:${keyIndex}`;
          keyImageCache.set(keyId, { idle: imageOrFrames, pressed: imageOrFrames });
        }
      },
    );

    ipcMain.handle(
      IPC_CHANNELS.DEVICE_CLEAR_KEY,
      async (_, deviceId: string, keyIndex: number) => {
        return deviceManager.clearKey(deviceId, keyIndex);
      },
    );

    ipcMain.handle(
      IPC_CHANNELS.DEVICE_CLEAR_ALL_KEYS,
      async (_, deviceId: string) => {
        return deviceManager.clearAllKeys(deviceId);
      },
    );

    // Profile IPC handlers
    ipcMain.handle(IPC_CHANNELS.PROFILE_LIST, () => {
      return profileManager.getProfiles();
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_GET, (_, profileId: string) => {
      return profileManager.getProfile(profileId);
    });

    ipcMain.handle(
      IPC_CHANNELS.PROFILE_CREATE,
      (_, profile: Omit<Profile, "id" | "createdAt" | "updatedAt">) => {
        return profileManager.createProfile(profile);
      },
    );

    ipcMain.handle(IPC_CHANNELS.PROFILE_UPDATE, (_, profile: Profile) => {
      return profileManager.updateProfile(profile);
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_DELETE, (_, profileId: string) => {
      return profileManager.deleteProfile(profileId);
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_ACTIVATE, (_, profileId: string) => {
      return profileManager.activateProfile(profileId);
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_EXPORT, (_, profileId: string) => {
      return profileManager.exportProfile(profileId);
    });

    ipcMain.handle(IPC_CHANNELS.PROFILE_IMPORT, (_, profileJson: string) => {
      return profileManager.importProfile(profileJson);
    });

    // Action IPC handlers
    ipcMain.handle(IPC_CHANNELS.ACTION_EXECUTE, async (_, action: Action) => {
      return actionEngine.executeAction(action);
    });

    ipcMain.handle(
      IPC_CHANNELS.ACTION_RENDER_KEY_IMAGE,
      async (_, keyConfig: KeyConfig, deviceType: string) => {
        return actionEngine.renderKeyImage(keyConfig, deviceType as any);
      },
    );

    ipcMain.handle(
      IPC_CHANNELS.ACTION_ANIMATION_DELAYS,
      async (_, keyConfig: KeyConfig) => {
        return actionEngine.getAnimationDelays(keyConfig);
      },
    );

    ipcMain.handle(IPC_CHANNELS.MACRO_RECORD_START, () => {
      return actionEngine.startMacroRecording();
    });

    ipcMain.handle(IPC_CHANNELS.MACRO_RECORD_STOP, () => {
      return actionEngine.stopMacroRecording();
    });

    ipcMain.handle(IPC_CHANNELS.MEDIA_PLAYERS_LIST, async () => {
      return actionEngine.getMediaPlayers();
    });

    // Settings IPC handlers
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
      return settingsManager.getSettings();
    });

    ipcMain.handle(
      IPC_CHANNELS.SETTINGS_UPDATE,
      (_, settings: Partial<AppSettings>) => {
        return settingsManager.updateSettings(settings);
      },
    );

    // Plugin IPC handlers
    ipcMain.handle(IPC_CHANNELS.PLUGIN_LIST, () => {
      return pluginManager.getPlugins();
    });

    ipcMain.handle(IPC_CHANNELS.PLUGIN_ENABLE, (_, pluginId: string) => {
      return pluginManager.enablePlugin(pluginId);
    });

    ipcMain.handle(IPC_CHANNELS.PLUGIN_DISABLE, (_, pluginId: string) => {
      return pluginManager.disablePlugin(pluginId);
    });

    // Asset IPC handlers
    ipcMain.handle(IPC_CHANNELS.ASSET_UPLOAD, async (_, filePath: string) => {
      const userDataPath = app.getPath("userData");
      const assetsDir = path.join(userDataPath, "assets");

      // Ensure assets directory exists
      await fs.mkdir(assetsDir, { recursive: true });

      const fileName = path.basename(filePath);
      const destPath = path.join(assetsDir, fileName);

      await fs.copyFile(filePath, destPath);
      return fileName;
    });

    ipcMain.handle(IPC_CHANNELS.ASSET_LIST, async () => {
      const userDataPath = app.getPath("userData");
      const assetsDir = path.join(userDataPath, "assets");

      try {
        const files = await fs.readdir(assetsDir);
        return files.filter((f) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f));
      } catch {
        return [];
      }
    });

    ipcMain.handle(IPC_CHANNELS.ASSET_DELETE, async (_, fileName: string) => {
      const userDataPath = app.getPath("userData");
      const assetsDir = path.join(userDataPath, "assets");
      const filePath = path.join(assetsDir, fileName);

      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.error(`Failed to delete asset ${fileName}: ${error}`);
      }
    });

    ipcMain.handle(IPC_CHANNELS.ASSET_FETCH_FAVICON, async (_, url: string) => {
      return IconFetcher.fetchFavicon(url);
    });

    ipcMain.handle(
      IPC_CHANNELS.ASSET_FETCH_APP_ICON,
      async (_, appPath: string) => {
        return IconFetcher.fetchAppIcon(appPath);
      },
    );

    ipcMain.handle(
      IPC_CHANNELS.ASSET_READ_AS_DATA_URL,
      async (_, sourcePath: string) => {
        try {
          let filePath = sourcePath;

          if (sourcePath.startsWith("bigdeck-asset://")) {
            const rawPath = sourcePath
              .replace("bigdeck-asset://", "")
              .replace(/^\/+/, "");
            const userDataPath = app.getPath("userData");
            filePath = path.join(
              userDataPath,
              "assets",
              decodeURIComponent(rawPath),
            );
          }

          const fileBuffer = await fs.readFile(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
          };
          const mimeType = mimeTypes[ext] || "application/octet-stream";
          return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
        } catch (error) {
          logger.error(
            `Failed to read asset as data URL: ${sourcePath}`,
            error,
          );
          return null;
        }
      },
    );

    // Dialog IPC handlers
    ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (_, options) => {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ["openFile"],
        ...options,
      });
      return result.canceled ? undefined : result.filePaths;
    });

    ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async (_, options) => {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ["openDirectory"],
        ...options,
      });
      return result.canceled ? undefined : result.filePaths;
    });
  }

  let areDeviceEventsSetup = false;

  function setupDeviceEvents(): void {
    if (areDeviceEventsSetup) {
      logger.warn("Device events already setup, skipping...");
      return;
    }

    deviceManager.on("device:connected", (device) => {
      logger.info(`Device connected: ${device.type} (${device.serialNumber})`);
      mainWindow?.webContents.send(IPC_CHANNELS.DEVICE_CONNECTED, device);

      // Apply current profile to device
      let activeProfile = profileManager.getActiveProfile();

      // If no active profile, or mismatch, try to find or create one
      if (!activeProfile || activeProfile.deviceType !== device.type) {
        logger.info(
          `Active profile mismatch (Current: ${activeProfile?.deviceType}, Device: ${device.type}). Switching...`,
        );
        const deviceProfiles = profileManager.getProfilesForDevice(device.type);
        if (deviceProfiles.length > 0) {
          activeProfile = profileManager.activateProfile(deviceProfiles[0].id);
        } else {
          logger.info(
            `No profile found for ${device.type}, creating default...`,
          );
          activeProfile = profileManager.createDefaultProfile(
            device.type,
            device.keyCount,
          );
          profileManager.activateProfile(activeProfile.id);
        }
      }

      if (activeProfile && activeProfile.deviceType === device.type) {
        applyProfileToDevice(device.id, activeProfile);
      }
    });

    deviceManager.on("device:disconnected", (deviceId) => {
      logger.info(`Device disconnected: ${deviceId}`);
      mainWindow?.webContents.send(IPC_CHANNELS.DEVICE_DISCONNECTED, deviceId);
    });

    /**
     * Render and cache idle state for a key (cache miss fallback).
     */
    const renderAndCacheIdle = async (deviceId: string, keyIndex: number, keyConfig: KeyConfig, deviceType: string) => {
      const keyId = `${deviceId}:${keyIndex}`;
      try {
        const rendered = await actionEngine.renderKeyImageEx(keyConfig, deviceType as any, false);
        keyImageCache.set(keyId, { idle: rendered.image, pressed: rendered.image });
        await deviceManager.setKeyImage(deviceId, keyIndex, rendered.image, false, rendered.delays);
      } catch (err) {
        logger.warn(`Failed to render key ${keyIndex}: ${err}`);
      }
    };

    /** Keys currently held down on hardware (`${deviceId}:${keyIndex}`). */
    const heldKeys = new Set<string>();

    /**
     * Lazy-render pressed state for a key and update cache.
     * If the key is still held when the render finishes, show it immediately.
     */
    const ensurePressedCached = async (deviceId: string, keyIndex: number) => {
      const keyId = `${deviceId}:${keyIndex}`;
      const cached = keyImageCache.get(keyId);
      if (!cached) return;
      const info = getActiveKeyConfig(keyIndex);
      if (!info) return;
      try {
        const rendered = await actionEngine.renderKeyImageEx(info.keyConfig, info.deviceType as any, true);
        keyImageCache.set(keyId, { idle: cached.idle, pressed: rendered.image });
        // Key still held — the initial press showed the idle image (nothing
        // better was cached yet), so upgrade to the real pressed image now.
        if (heldKeys.has(keyId)) {
          await deviceManager.setKeyImage(deviceId, keyIndex, rendered.image, false, rendered.delays);
        }
      } catch {}
    };

    const getActiveKeyConfig = (keyIndex: number) => {
      const activeProfile = profileManager.getActiveProfile();
      if (!activeProfile) return null;
      const page = activeProfile.pages[activeProfile.activePage];
      const keyConfig = page?.keys.find((k) => k.keyIndex === keyIndex);
      return keyConfig ? { keyConfig: keyConfig as KeyConfig, deviceType: activeProfile.deviceType } : null;
    };

    deviceManager.on("key:down", ({ deviceId, keyIndex }) => {
      const keyId = `${deviceId}:${keyIndex}`;

      logger.info(
        `HARDWARE EVENT RECEIVED: Key down: device=${deviceId}, key=${keyIndex}`,
      );
      mainWindow?.webContents.send(IPC_CHANNELS.DEVICE_KEY_DOWN, {
        deviceId,
        keyIndex,
      });

      heldKeys.add(keyId);

      // Instantly apply cached pressed image. If it's identical to what's
      // already on the key (synced state), DeviceManager no-ops the write,
      // so running animations don't restart.
      const cached = keyImageCache.get(keyId);
      if (cached) {
        deviceManager.setKeyImage(deviceId, keyIndex, cached.pressed).catch(() => {});
      }

      // Lazily render the real pressed variant in the background
      ensurePressedCached(deviceId, keyIndex);

      // Execute key action
      const info = getActiveKeyConfig(keyIndex);
      if (info?.keyConfig?.action) {
        logger.info(
          `Triggering action: ${info!.keyConfig.action.type} for key ${keyIndex}`,
        );
        actionEngine.executeAction(info!.keyConfig.action);
      }
    });

    deviceManager.on("key:up", ({ deviceId, keyIndex }) => {
      const keyId = `${deviceId}:${keyIndex}`;

      logger.debug(`Key up: device=${deviceId}, key=${keyIndex}`);
      mainWindow?.webContents.send(IPC_CHANNELS.DEVICE_KEY_UP, {
        deviceId,
        keyIndex,
      });

      heldKeys.delete(keyId);

      // Instantly apply cached idle image (no render delay)
      const cached = keyImageCache.get(keyId);
      if (cached) {
        deviceManager.setKeyImage(deviceId, keyIndex, cached.idle).catch(() => {});
      } else {
        const info = getActiveKeyConfig(keyIndex);
        if (info?.keyConfig) {
          renderAndCacheIdle(deviceId, keyIndex, info.keyConfig, info.deviceType);
        }
      }
    });

    profileManager.on("profile:activated", (profile) => {
      logger.info(`Profile activated: ${profile.name}, updating hardware...`);
      const devices = deviceManager.getDevices();
      for (const device of devices) {
        if (device.type === profile.deviceType) {
          applyProfileToDevice(device.id, profile);
        }
      }
    });

    // Per-key diffing: only keys whose appearance config changed get
    // re-rendered, each with its own trailing debounce. Slider drags and
    // typing coalesce per key instead of re-rendering the whole page.
    profileManager.on("profile:updated", (profile: Profile) => {
      const activeProfile = profileManager.getActiveProfile();
      if (!activeProfile || activeProfile.id !== profile.id) return;

      const devices = deviceManager.getDevices();
      for (const device of devices) {
        if (device.type !== profile.deviceType) continue;

        const page = profile.pages[profile.activePage];
        if (!page) continue;

        const deviceCache = getDeviceCache(device.id);
        const keyCount = DEVICE_SPECS[profile.deviceType]?.keyCount || page.keys.length;

        for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
          const keyConfig = page.keys.find((k) => k.keyIndex === keyIndex) ?? {
            id: `blank-${keyIndex}`,
            keyIndex,
          };
          const configHash = hashKeyConfig(keyConfig as KeyConfig);
          if (deviceCache.get(keyIndex) === configHash) continue;

          scheduleKeyRender(device.id, keyIndex, keyConfig as KeyConfig, profile.deviceType);
        }
      }
    });

    areDeviceEventsSetup = true;
  }

  // Cache previous key states to avoid redundant renders/writes
  const lastDeviceState = new Map<string, Map<number, string>>();

  function getDeviceCache(deviceId: string): Map<number, string> {
    let cache = lastDeviceState.get(deviceId);
    if (!cache) {
      cache = new Map();
      lastDeviceState.set(deviceId, cache);
    }
    return cache;
  }

  /** Appearance-relevant config fingerprint (actions don't affect pixels). */
  function hashKeyConfig(keyConfig: KeyConfig): string {
    return JSON.stringify({
      img: keyConfig.image,
      lbl: keyConfig.label,
      lp: keyConfig.labelPosition,
      lc: keyConfig.labelColor,
      act: keyConfig.action?.type,
      aname: keyConfig.action?.name,
      layers: keyConfig.layers,
      pressedLayers: keyConfig.pressedLayers,
    });
  }

  // ---- Per-key render scheduler -------------------------------------------
  // Main is the ONLY writer to hardware. The renderer never pushes images;
  // it saves config, we diff, and only changed keys are re-rendered — each
  // with a trailing debounce so rapid edits coalesce. Latest-write-wins via
  // per-key generation counters.
  const keyRenderTimers = new Map<string, NodeJS.Timeout>();
  const keyRenderGen = new Map<string, number>();
  /** Trailing debounce per key — feels instant for single edits, coalesces drags. */
  const KEY_RENDER_DEBOUNCE_MS = 120;

  function scheduleKeyRender(
    deviceId: string,
    keyIndex: number,
    keyConfig: KeyConfig,
    deviceType: Profile["deviceType"],
    opts?: { immediate?: boolean },
  ): void {
    const id = `${deviceId}:${keyIndex}`;
    const gen = (keyRenderGen.get(id) || 0) + 1;
    keyRenderGen.set(id, gen);

    const existing = keyRenderTimers.get(id);
    if (existing) clearTimeout(existing);

    const delay = opts?.immediate ? 0 : KEY_RENDER_DEBOUNCE_MS;
    keyRenderTimers.set(
      id,
      setTimeout(async () => {
        keyRenderTimers.delete(id);
        if (keyRenderGen.get(id) !== gen) return; // superseded

        try {
          const rendered = await actionEngine.renderKeyImageEx(keyConfig, deviceType, false);
          if (keyRenderGen.get(id) !== gen) return; // superseded while rendering

          keyImageCache.set(id, { idle: rendered.image, pressed: rendered.image });
          await deviceManager.setKeyImage(deviceId, keyIndex, rendered.image, false, rendered.delays);
          getDeviceCache(deviceId).set(keyIndex, hashKeyConfig(keyConfig));
        } catch (error) {
          logger.error(`Failed to render key ${keyIndex}: ${error}`);
        }
      }, delay),
    );
  }

  /**
   * Applies all changed key images from a profile to a connected device.
   * Used on connect/activate/page-switch: renders are scheduled immediately
   * and writes flow through the per-device control lane (serialized, so the
   * device can't be flooded).
   */
  async function applyProfileToDevice(
    deviceId: string,
    profile: Profile,
  ): Promise<void> {
    const page = profile.pages[profile.activePage];
    if (!page) return;

    const deviceSpecs = DEVICE_SPECS[profile.deviceType];
    const keyCount = deviceSpecs?.keyCount || page.keys.length;
    const deviceCache = getDeviceCache(deviceId);

    for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
      const keyConfig = page.keys.find((k) => k.keyIndex === keyIndex) ?? {
        id: `blank-${keyIndex}`,
        keyIndex,
      };

      const configHash = hashKeyConfig(keyConfig as KeyConfig);
      if (deviceCache.get(keyIndex) === configHash) continue;

      scheduleKeyRender(deviceId, keyIndex, keyConfig as KeyConfig, profile.deviceType, {
        immediate: true,
      });
    }
  }

  async function initializeApp(): Promise<void> {
    try {
      // Initialize logger first
      logger = new Logger();
      logger.info("BigDeck starting...");

      // Initialize managers
      settingsManager = new SettingsManager(logger);
      deviceManager = new DeviceManager(logger);

      // Listen for hardware errors
      deviceManager.on("hardware-error", (error) => {
        logger.warn("Hardware error:", error);
        mainWindow?.webContents.send(IPC_CHANNELS.DEVICE_HARDWARE_ERROR, error);
      });

      profileManager = new ProfileManager(logger);
      actionEngine = new ActionEngine(logger, app.getPath("userData"));

      actionEngine.setOnSwitchProfile(async (profileId: string) => {
        try {
          const newProfile = profileManager.activateProfile(profileId);
          mainWindow?.webContents.send(
            IPC_CHANNELS.PROFILE_CHANGED,
            newProfile,
          );
          const devices = deviceManager.getDevices();
          for (const device of devices) {
            if (device.type === newProfile.deviceType) {
              await applyProfileToDevice(device.id, newProfile);
            }
          }
        } catch (err) {
          logger.error("Failed to switch profile:", err);
        }
      });

      actionEngine.setOnSwitchPage(async (pageIndex: number) => {
        try {
          const activeProfile = profileManager.getActiveProfile();
          if (!activeProfile) return;
          const updated = profileManager.setActivePage(activeProfile.id, pageIndex);
          mainWindow?.webContents.send(
            IPC_CHANNELS.PROFILE_PAGE_CHANGED,
            { profileId: updated.id, pageIndex },
          );
          const devices = deviceManager.getDevices();
          for (const device of devices) {
            if (device.type === updated.deviceType) {
              await applyProfileToDevice(device.id, updated);
            }
          }
        } catch (err) {
          logger.error("Failed to switch page:", err);
        }
      });

      pluginManager = new PluginManager(logger);
      networkServer = new NetworkServer(
        logger,
        deviceManager,
        profileManager,
        actionEngine,
      );

      // Setup event handlers
      setupDeviceEvents();

      // Load plugins
      await pluginManager.loadPlugins();

      // Start device detection
      await deviceManager.startDetection();

      // Setup IPC handlers
      setupIPC();

      // Start network server if enabled
      const settings = settingsManager.getSettings();
      if (settings.networkControl.enabled) {
        await networkServer.start(settings.networkControl.port);
      }

      logger.info("BigDeck initialized");
    } catch (error) {
      if (logger) {
        logger.error("Failed to initialize app", error);
      } else {
        console.error("Failed to initialize app and logger:", error);
      }
      throw error;
    }
  }

  // App lifecycle
  app.whenReady().then(async () => {
    try {
      protocol.handle("bigdeck-asset", (request) => {
        let rawPath = request.url.replace("bigdeck-asset://", "");
        rawPath = rawPath.replace(/^\/+|\/+$/g, "");

        const assetPath = decodeURIComponent(rawPath);
        // Absolute paths (drag-dropped external files) are served as-is;
        // plain names resolve inside the managed assets directory.
        const fullPath = assetPath.startsWith("/")
          ? assetPath
          : path.join(app.getPath("userData"), "assets", assetPath);

        // net.fetch handles streaming, range requests, and MIME sniffing —
        // the documented way to serve local files over a custom scheme.
        return net.fetch(pathToFileURL(fullPath).toString());
      });

      await initializeApp();
      await createWindow();
      createTray();
    } catch (error) {
      console.error("Fatal startup error:", error);
      // In a real app, we might show a dialog here
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    const settings = settingsManager?.getSettings();
    if (!settings?.minimizeToTray || isQuitting) {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });

  app.on("before-quit", async () => {
    isQuitting = true;
    logger?.info("BigDeck shutting down...");

    // Flush any debounced profile writes, then cleanup
    profileManager?.flush();
    await deviceManager?.cleanup();
    await networkServer?.stop();

    logger?.info("Cleanup complete");
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger?.error(`Uncaught exception: ${error.message}`, error);
  });

  process.on("unhandledRejection", (reason) => {
    logger?.error(`Unhandled rejection: ${reason}`);
  });
}
