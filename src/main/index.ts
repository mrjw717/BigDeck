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
import { HardwareSync } from "./actions/HardwareSync";
import { PluginManager } from "./plugins/PluginManager";
import { SDPluginHost } from "./plugins/sd/SDPluginHost";
import { wireSdPlacements, wireSdProfileSwitching } from "./plugins/sd/SdBridge";
import { NetworkServer } from "./network/NetworkServer";
import { SettingsManager } from "./utils/SettingsManager";
import { Logger } from "./utils/Logger";
import { IconFetcher } from "./utils/IconFetcher";
import {
  IPC_CHANNELS,
  DEFAULT_SETTINGS,
} from "../shared/constants";
import type { Action, AppSettings, Profile, KeyConfig } from "../shared/types";

// Globals
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let deviceManager: DeviceManager;
let profileManager: ProfileManager;
let actionEngine: ActionEngine;
let hardwareSync: HardwareSync;
let pluginManager: PluginManager;
let sdPluginHost: SDPluginHost | null = null;
let networkServer: NetworkServer;
let settingsManager: SettingsManager;
let logger: Logger;

// Is development mode
const isDev = process.env.NODE_ENV === "development";

// Track if app is quitting (for minimize to tray feature)
let isQuitting = false;

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
    // X11: the title-bar/taskbar icon comes from the BrowserWindow `icon`
    // (largest PNG available, 512px). On Wayland the compositor ignores this
    // and matches the window's app_id against a .desktop entry instead —
    // that pairing is maintained in electron-builder.yml (desktop section)
    // and build/bigdeck.desktop: productName "BigDeck" (which is what
    // Electron uses as WM_CLASS / Wayland app_id) must equal StartupWMClass.
    const windowIconPath = path.join(
      app.getAppPath(),
      "assets/icons/icon-512x512.png",
    );

    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      title: "BigDeck",
      icon: windowIconPath,
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
          hardwareSync.setCachedImages(deviceId, keyIndex, {
            idle: imageOrFrames,
            pressed: imageOrFrames,
          });
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
        hardwareSync.applyProfileToDevice(device.id, activeProfile);
      }
    });

    deviceManager.on("device:disconnected", (deviceId) => {
      logger.info(`Device disconnected: ${deviceId}`);
      // The single owner must forget the departed device's key state, or a
      // reconnect would skip re-applying keys whose last-rendered hash still
      // matches while the hardware panel is actually blank.
      hardwareSync.clearDevice(deviceId);
      mainWindow?.webContents.send(IPC_CHANNELS.DEVICE_DISCONNECTED, deviceId);
    });

    /**
     * Render and cache idle state for a key (cache miss fallback).
     */
    const renderAndCacheIdle = async (deviceId: string, keyIndex: number, keyConfig: KeyConfig, deviceType: string) => {
      try {
        const rendered = await actionEngine.renderKeyImageEx(keyConfig, deviceType as any, false);
        hardwareSync.setCachedImages(deviceId, keyIndex, { idle: rendered.image, pressed: rendered.image });
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
      const cached = hardwareSync.getCachedImages(deviceId, keyIndex);
      if (!cached) return;
      const info = profileManager.getActiveKeyConfig(keyIndex);
      if (!info) return;
      try {
        const rendered = await actionEngine.renderKeyImageEx(info.keyConfig, info.deviceType as any, true);
        hardwareSync.setCachedImages(deviceId, keyIndex, { idle: cached.idle, pressed: rendered.image });
        // Key still held — the initial press showed the idle image (nothing
        // better was cached yet), so upgrade to the real pressed image now.
        if (heldKeys.has(keyId)) {
          await deviceManager.setKeyImage(deviceId, keyIndex, rendered.image, false, rendered.delays);
        }
      } catch {}
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
      const cached = hardwareSync.getCachedImages(deviceId, keyIndex);
      if (cached) {
        deviceManager.setKeyImage(deviceId, keyIndex, cached.pressed).catch(() => {});
      }

      // Lazily render the real pressed variant in the background
      ensurePressedCached(deviceId, keyIndex);

      // Execute key action. The origin lets SD-plugin actions resolve the
      // action-instance context for this exact key. Every "no dispatch"
      // outcome is logged with its reason — a press that silently produces
      // no action line is impossible to diagnose from the log alone.
      const info = profileManager.getActiveKeyConfig(keyIndex);
      if (info?.keyConfig?.action) {
        logger.info(
          `Triggering action: ${info!.keyConfig.action.type} for key ${keyIndex}`,
        );
        actionEngine.executeAction(info!.keyConfig.action, {
          deviceId,
          keyIndex,
        });
      } else if (!info) {
        const activeProfile = profileManager.getActiveProfile();
        logger.warn(
          `Key ${keyIndex} press DROPPED: no matching key on the active page ` +
            `(profile=${activeProfile?.name ?? "none"}, ` +
            `activePage=${activeProfile?.activePage ?? "?"} of ${activeProfile?.pages.length ?? 0} pages)`,
        );
      } else {
        logger.debug(
          `Key ${keyIndex} has no action assigned - press ignored (profile=${profileManager.getActiveProfile()?.name ?? "?"})`,
        );
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
      const cached = hardwareSync.getCachedImages(deviceId, keyIndex);
      if (cached) {
        deviceManager.setKeyImage(deviceId, keyIndex, cached.idle).catch(() => {});
      } else {
        const info = profileManager.getActiveKeyConfig(keyIndex);
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
          hardwareSync.applyProfileToDevice(device.id, profile);
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

        // Diff against last-rendered state and re-render only changed keys,
        // each with its own trailing debounce (single owner: HardwareSync).
        hardwareSync.syncChangedKeys(device.id, profile);
      }
    });

    areDeviceEventsSetup = true;
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

      // Single owner of per-key rendered-image state ("what is on the key").
      // The IPC set-image handler, the press/release visual path, and the
      // profile render path all go through this one cache — a second cache
      // here caused stale pressed images depending on which path wrote last
      // (audit #1).
      hardwareSync = new HardwareSync(deviceManager, actionEngine, logger);

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
              await hardwareSync.applyProfileToDevice(device.id, newProfile);
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
              await hardwareSync.applyProfileToDevice(device.id, updated);
            }
          }
        } catch (err) {
          logger.error("Failed to switch page:", err);
        }
      });

      // key-brightness actions: the executor knows nothing about devices;
      // the DeviceManager owns the backlight. A hardware press targets its
      // own device; a network/API trigger (no origin) fans out to every
      // connected device. Truthful boolean back to the executor's logging.
      actionEngine.setOnKeyBrightness(async (deviceId, brightness) => {
        if (!Number.isFinite(brightness)) {
          logger.error(
            `key-brightness: non-numeric brightness value (${brightness})`,
          );
          return false;
        }
        const clamped = Math.max(0, Math.min(100, Math.round(brightness)));
        const targets = deviceId
          ? [deviceId]
          : deviceManager.getDevices().map((d) => d.id);
        if (targets.length === 0) {
          logger.warn("key-brightness: no connected device to apply brightness to");
          return false;
        }
        let applied = 0;
        for (const target of targets) {
          try {
            await deviceManager.setBrightness(target, clamped);
            applied++;
          } catch (err) {
            logger.error(`key-brightness: failed on device ${target}:`, err);
          }
        }
        if (applied > 0) {
          logger.info(
            `Brightness set to ${clamped}% on ${applied} device(s)`,
          );
        }
        return applied > 0;
      });

      pluginManager = new PluginManager(logger);
      networkServer = new NetworkServer(
        logger,
        deviceManager,
        profileManager,
        actionEngine,
      );

      // Elgato .sdPlugin compatibility host (backend phase — docs/
      // SDPLUGIN-COMPAT.md). Lives ALONGSIDE the legacy PluginManager above,
      // which is untouched.
      //
      // The host must start (and therefore register its DeviceManager
      // listeners) BEFORE setupDeviceEvents() below: on a physical press the
      // host's listener runs first, and the ActionExecutor dispatch path
      // relies on that order for its single-delivery guarantee
      // (SDPluginHost.dispatchAction).
      const sdPluginsDir = path.join(app.getPath("userData"), "sdplugins");
      sdPluginHost = new SDPluginHost({
        logger,
        devicePort: deviceManager,
        keyImageCache: hardwareSync,
        pluginsDir: sdPluginsDir,
        stateDir: path.join(sdPluginsDir, "state"),
        appVersion: app.getVersion(),
      });

      actionEngine.setOnSdPluginDispatch(async (action, origin) => {
        await sdPluginHost?.dispatchAction(action, origin);
      });

      // Simple flag for the backend phase: always-on when the sdplugins dir
      // exists (something was installed) or any profile already carries an
      // SD action. Otherwise the host stays down (and the dir is not created).
      const sdPluginsDirExists = await fs
        .stat(sdPluginsDir)
        .then(() => true)
        .catch(() => false);
      const anySdActionConfigured = profileManager
        .getProfiles()
        .some((profile) =>
          profile.pages.some((page) =>
            page.keys.some((key) => key.action?.type === "sdplugin"),
          ),
        );
      if (sdPluginsDirExists || anySdActionConfigured) {
        await sdPluginHost.start();
      } else {
        logger.info("SD plugin host not started (no sdplugins dir, no SD actions)");
      }

      // Placement authority → SD host bridge: HardwareSync diffs sdplugin
      // action placements (profile applied / edited / device cleared) and the
      // bridge turns each diff into registerActionInstance /
      // unregisterActionInstance, i.e. willAppear/willDisappear. Wired here —
      // before setupDeviceEvents() — so the listener exists before any
      // device:connected can trigger an apply. HardwareSync never imports the
      // host; this is the only meeting point.
      if (sdPluginHost) {
        wireSdPlacements(hardwareSync, sdPluginHost);

        // SDK switchToProfile: a plugin asks for a profile switch by NAME;
        // resolve it against ProfileManager (preferring the requesting
        // device's type) and activate through the existing path — the
        // profile:activated listener above applies it to hardware. The
        // renderer is notified like any other profile activation.
        wireSdProfileSwitching({
          host: sdPluginHost,
          profiles: profileManager,
          resolveDeviceType: (deviceId) =>
            deviceId ? (deviceManager.getDevice(deviceId)?.type ?? null) : null,
          logger,
          onActivated: (profile) => {
            mainWindow?.webContents.send(IPC_CHANNELS.PROFILE_CHANGED, profile);
          },
        });
      }

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
      // Match electron-builder's appId (see electron-builder.yml). Set before
      // any window exists: it identifies the app to the shell (Windows
      // taskbar/notifications, and keeps the id consistent across platforms).
      app.setAppUserModelId("com.bigdeck.app");

      protocol.handle("bigdeck-asset", (request) => {
        // Two URL forms arrive here:
        // - Query form `bigdeck-asset://local/?p=<encoded>` — what the
        //   renderer emits (see src/renderer/utils/assets.ts). The payload
        //   rides in the query string, which Chromium canonicalizes
        //   transparently: filename case survives (host-form URLs had their
        //   case folded, 404-ing multi-case names like "Animation Waving
        //   GIF...gif"). decodeURIComponent restores the exact target.
        // - Legacy host form `bigdeck-asset://<encoded-name>` — older stored
        //   profiles, kept working for lowercase names.
        const queryPath = /[?&]p=([^&]*)/.exec(request.url)?.[1];
        let assetPath: string;
        if (queryPath !== undefined) {
          assetPath = decodeURIComponent(queryPath);
        } else {
          let rawPath = request.url.replace("bigdeck-asset://", "");
          rawPath = rawPath.replace(/^\/+|\/+$/g, "");
          assetPath = decodeURIComponent(rawPath);
        }

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

  // Electron does NOT await before-quit listener promises: an async handler
  // only runs its synchronous prefix before the app tears down. So the
  // cleanup is bracketed with preventDefault() + app.exit() here, and capped
  // with a race: a plugin that swallows SIGTERM only dies via SDPluginHost's
  // SIGKILL escalation (≤ 2s), and a hung cleanup must never stall exit
  // indefinitely. 3s leaves margin above that escalation window.
  const QUIT_CLEANUP_CAP_MS = 3000;
  let quitCleanup: Promise<void> | null = null;

  app.on("before-quit", (event) => {
    // Hold the default quit — app.exit(0) below is the real exit, after
    // cleanup. This must happen on EVERY invocation: a second before-quit
    // letting the default through would tear the app down mid-cleanup.
    event.preventDefault();

    // Re-entrancy guard: app.quit() can fire before-quit more than once
    // (tray menu, window-all-closed, ...). Only the first invocation starts
    // the cleanup; later ones piggyback on the in-flight run.
    if (!quitCleanup) {
      isQuitting = true;
      logger?.info("BigDeck shutting down...");

      // Flush any debounced profile writes, then cleanup. The race's losing
      // branch is abandoned rather than cancelled — the app is exiting
      // anyway, and Promise.race keeps every member's rejection handled.
      quitCleanup = (async () => {
        profileManager?.flush();
        hardwareSync?.dispose();
        await Promise.race([
          (async () => {
            await sdPluginHost?.stop();
            await deviceManager?.cleanup();
            await networkServer?.stop();
          })(),
          new Promise<void>((resolve) => setTimeout(resolve, QUIT_CLEANUP_CAP_MS)),
        ]);
        logger?.info("Cleanup complete");
      })().catch((error) => {
        // Cleanup must never reject: the app.exit() below has to run either
        // way, and an unhandled rejection here would be our last log line.
        logger?.error("Error during quit cleanup:", error);
      });
    }

    void quitCleanup.then(() => app.exit(0));
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger?.error(`Uncaught exception: ${error.message}`, error);
  });

  process.on("unhandledRejection", (reason) => {
    logger?.error(`Unhandled rejection: ${reason}`);
  });
}
