// ============================================================================
// BigDeck - Action Executor
// Executes key actions: keyboard shortcuts, app launching, scripts, macros
//
// Linux viability notes:
// - Every execute* helper returns a boolean ("carried out") so executeAction
//   can log a truthful success/failure line per action type. Individual
//   helpers log the concrete reason (missing tool, spawn error) first.
// - Key/text injection on Wayland needs ydotool (with ydotoold running) or
//   wtype; on X11 xdotool. Missing tools degrade gracefully with an explicit
//   install hint instead of failing silently.
// ============================================================================

import { exec, execFile, spawn } from "child_process";
import { promisify } from "util";
import { access, constants as fsConstants } from "fs/promises";
import os from "os";
import path from "path";
import { uIOhook, UiohookKeyboardEvent } from "uiohook-napi";
import {
  KeyboardShortcutAction,
  LaunchAppAction,
  MultimediaAction,
  RunScriptAction,
  MacroAction,
  SwitchProfileAction,
  SwitchPageAction,
  SystemSleepAction,
  CloseAppAction,
  KeyBrightnessAction,
  MacroStep,
  SdPluginAction,
  Action,
  ActionOrigin,
} from "../../shared/types";
import type { Logger } from "../utils/Logger";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export class ActionExecutor {
  private logger: Logger;
  private isRecordingMacro = false;
  private recordedSteps: MacroStep[] = [];
  private recordingStartTime = 0;
  private executionLocks: Map<string, number> = new Map();

  onSwitchProfile: ((profileId: string) => Promise<void>) | null = null;
  onSwitchPage: ((pageIndex: number) => Promise<void>) | null = null;
  /**
   * key-brightness actions go through the DeviceManager (it owns the
   * hardware backlight). `deviceId` is the originating device when known
   * (hardware press); null means "every connected device" (network API).
   * Wired in the app entry point, same pattern as onSwitchProfile.
   */
  onKeyBrightness:
    | ((deviceId: string | null, brightness: number) => Promise<boolean>)
    | null = null;
  /**
   * Elgato .sdPlugin actions dispatch through the SDPluginHost (see
   * src/main/plugins/sd/SDPluginHost.ts). Wired in the app entry point,
   * same pattern as onSwitchProfile/onSwitchPage.
   */
  onSdPluginDispatch:
    | ((action: SdPluginAction, origin?: ActionOrigin) => Promise<void>)
    | null = null;

  constructor(logger: Logger) {
    this.logger = logger;

    uIOhook.on("keydown", (e: UiohookKeyboardEvent) => {
      if (this.isRecordingMacro) {
        this.recordKeyEvent(e.keycode.toString());
      }
    });

    try {
      uIOhook.start();
    } catch (err) {
      this.logger.warn(
        "Global keyboard hook failed to start (required for macro recording):",
        err,
      );
    }

    const currentPath = process.env.PATH || "";
    const commonPaths = [
      "/usr/local/bin",
      "/usr/bin",
      "/bin",
      "/usr/sbin",
      "/sbin",
    ];
    const newPaths = commonPaths.filter((p) => !currentPath.includes(p));
    if (newPaths.length > 0) {
      process.env.PATH = `${currentPath}:${newPaths.join(":")}`;
      this.logger.debug(`Augmented PATH with: ${newPaths.join(":")}`);
    }
  }

  /**
   * Execute an action. `origin` is the device key that triggered execution
   * when known (hardware press) — the SD plugin host uses it to resolve the
   * action-instance context.
   *
   * Logs start/success/failure with the action type so a hardware test can
   * be diagnosed from bigdeck.log alone. Individual helpers log the concrete
   * failure reason (missing tool, spawn error) before the summary line.
   */
  async executeAction(action: Action, origin?: ActionOrigin): Promise<void> {
    const debounceMs = this.getDebounceTime(action.type);
    const now = Date.now();
    const lastExec = this.executionLocks.get(action.id) || 0;

    if (now - lastExec < debounceMs) {
      this.logger.debug(`Debouncing action: ${action.type} - ${action.name}`);
      return;
    }

    this.executionLocks.set(action.id, now);

    this.logger.info(`Action executing: ${action.type} - ${action.name}`);

    let succeeded = false;
    try {
      switch (action.type) {
        case "keyboard-shortcut":
          succeeded = await this.executeKeyboardShortcut(
            action as KeyboardShortcutAction,
          );
          break;
        case "launch-app":
          succeeded = await this.executeLaunchApp(action as LaunchAppAction);
          break;
        case "multimedia":
          succeeded = await this.executeMultimedia(action as MultimediaAction);
          break;
        case "open-url":
          succeeded = await this.executeOpenUrl(action);
          break;
        case "open-folder":
          succeeded = await this.executeOpenFolder(action);
          break;
        case "run-script":
          succeeded = await this.executeScript(action as RunScriptAction);
          break;
        case "macro":
          succeeded = await this.executeMacro(action as MacroAction);
          break;
        case "switch-profile":
          if (this.onSwitchProfile) {
            try {
              await this.onSwitchProfile(
                (action as SwitchProfileAction).profileId,
              );
              succeeded = true;
            } catch (error) {
              this.logger.error("switch-profile handler failed:", error);
            }
          } else {
            this.logger.warn("No onSwitchProfile handler registered");
          }
          break;
        case "switch-page":
          if (this.onSwitchPage) {
            try {
              await this.onSwitchPage((action as SwitchPageAction).pageIndex);
              succeeded = true;
            } catch (error) {
              this.logger.error("switch-page handler failed:", error);
            }
          } else {
            this.logger.warn("No onSwitchPage handler registered");
          }
          break;
        case "system-sleep":
          succeeded = await this.executeSystemSleep();
          break;
        case "close-app":
          succeeded = await this.executeCloseApp(
            action as CloseAppAction,
          );
          break;
        case "key-brightness": {
          const brightnessAction = action as KeyBrightnessAction;
          if (this.onKeyBrightness) {
            try {
              succeeded = await this.onKeyBrightness(
                origin?.deviceId ?? null,
                brightnessAction.brightness,
              );
              if (!succeeded) {
                // Concrete reason already logged by the handler.
                this.logger.debug(
                  `Brightness ${brightnessAction.brightness} not applied to any device`,
                );
              }
            } catch (error) {
              this.logger.error("key-brightness handler failed:", error);
            }
          } else {
            this.logger.warn(
              "No onKeyBrightness handler registered (device manager not wired)",
            );
          }
          break;
        }
        case "sdplugin":
          if (this.onSdPluginDispatch) {
            try {
              await this.onSdPluginDispatch(action as SdPluginAction, origin);
              succeeded = true;
            } catch (error) {
              this.logger.error("sdplugin dispatch failed:", error);
            }
          } else {
            this.logger.warn(
              "No onSdPluginDispatch handler registered (SD host not wired)",
            );
          }
          break;
        default:
          this.logger.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      this.logger.error(`Error executing action ${action.type}:`, error);
    }

    if (succeeded) {
      this.logger.info(`Action succeeded: ${action.type} - ${action.name}`);
    } else {
      this.logger.warn(
        `Action failed: ${action.type} - ${action.name} (reason logged above)`,
      );
    }
  }

  private getDebounceTime(actionType: string): number {
    switch (actionType) {
      case "multimedia":
      case "key-brightness":
        return 200;
      case "keyboard-shortcut":
        return 300;
      case "launch-app":
      case "open-url":
      case "open-folder":
      case "close-app":
        return 500;
      case "sdplugin":
        // Plugin events must not be debounced — rapid taps are legitimate
        // plugin input (hold-detection lives in the plugin).
        return 0;
      default:
        return 1000;
    }
  }

  private async isToolAvailable(tool: string): Promise<boolean> {
    try {
      await execAsync(`which ${tool}`);
      return true;
    } catch {
      return false;
    }
  }

  private isWaylandSession(): boolean {
    return (
      process.env.XDG_SESSION_TYPE === "wayland" ||
      process.env.WAYLAND_DISPLAY !== undefined
    );
  }

  private mapToXdotoolKey(key: string): string {
    const keyMap: Record<string, string> = {
      Control: "ctrl",
      Alt: "alt",
      Shift: "shift",
      Meta: "super",
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      Enter: "Return",
      Escape: "Escape",
      Backspace: "BackSpace",
      Delete: "Delete",
      Tab: "Tab",
      Space: "space",
    };
    return keyMap[key] || key;
  }

  private sanitizeShortcutInput(input: string): string[] {
    return input
      .split(/[\s\+]+/)
      .filter((k) => k.length > 0)
      .map((k) => this.mapToXdotoolKey(k));
  }

  // ------------------------------------------------------------------
  // Keyboard shortcut injection (X11 via xdotool, Wayland via
  // ydotool/wtype). Shared by the keyboard-shortcut action and macro
  // "key" steps so both paths get the same backend fallbacks.
  // ------------------------------------------------------------------

  /**
   * Send a `mod+mod+key` combo on the current session type.
   * Returns true only when a backend actually carried the combo out.
   */
  private async sendKeyCombo(combo: string): Promise<boolean> {
    const isWayland = this.isWaylandSession();

    if (isWayland) {
      // ydotool first: kernel-level injection, works on every compositor
      // (requires the ydotoold daemon). FAILURE FALLS THROUGH: installed
      // but misconfigured must not block the next backend.
      const tried: string[] = [];
      if (await this.isToolAvailable("ydotool")) {
        if (await this.executeYdotoolShortcut(combo)) return true;
        tried.push("ydotool");
      }
      // wtype: Wayland-native input-method injection, needs no daemon.
      if (await this.isToolAvailable("wtype")) {
        if (await this.executeWtypeShortcut(combo)) return true;
        tried.push("wtype");
      }
      if (tried.length > 0) {
        this.logger.error(
          `Keyboard shortcut "${combo}": ${tried.join(" and ")} failed on Wayland. ` +
            `ydotool needs its daemon: 'systemctl --user start ydotool' (and your user in the 'input' group, then re-login). ` +
            `wtype needs compositor virtual-keyboard support.`,
        );
      } else {
        this.logger.error(
          `Cannot send keyboard shortcut "${combo}" on Wayland: neither ydotool nor wtype is installed. ` +
            `Install one of them (e.g. 'sudo apt install ydotool' or 'sudo pacman -S ydotool'), or install wtype.`,
        );
      }
      return false;
    }

    const triedX11: string[] = [];
    if (await this.isToolAvailable("xdotool")) {
      if (await this.executeXdotoolShortcut(combo)) return true;
      triedX11.push("xdotool");
    }
    if (await this.isToolAvailable("ydotool")) {
      if (await this.executeYdotoolShortcut(combo)) return true;
      triedX11.push("ydotool");
    }
    if (triedX11.length > 0) {
      this.logger.error(
        `Keyboard shortcut "${combo}": ${triedX11.join(" and ")} failed on X11.`,
      );
    } else {
      this.logger.error(
        `Cannot send keyboard shortcut "${combo}" on X11: neither xdotool nor ydotool is installed. ` +
          `Install xdotool (e.g. 'sudo apt install xdotool').`,
      );
    }
    return false;
  }

  private async executeKeyboardShortcut(
    action: KeyboardShortcutAction,
  ): Promise<boolean> {
    const keys = action.keys || [];
    if (keys.length === 0) {
      this.logger.warn(
        "Keyboard shortcut has no keys recorded yet — open this key's editor and record a combo (the empty shortcut is saved as a draft).",
      );
      return false;
    }

    const modifiers = action.modifiers || [];
    const allKeys = [...modifiers, ...keys];
    return this.sendKeyCombo(allKeys.join("+"));
  }

  private async executeXdotoolShortcut(combo: string): Promise<boolean> {
    // `xdotool key ctrl+t` (one argument, + separated) presses the combo;
    // separate arguments would press the keys one after another.
    const cmd = `xdotool key ${combo}`;

    this.logger.debug(`Executing xdotool: ${cmd}`);
    try {
      await execAsync(cmd);
      return true;
    } catch (error) {
      this.logger.error(`xdotool execution failed for "${combo}":`, error);
      return false;
    }
  }

  private async executeYdotoolShortcut(combo: string): Promise<boolean> {
    const parts = combo.split("+");
    const key = parts.pop() || "";
    const modifiers = parts;

    const modifierCodes: Record<string, number> = {
      ctrl: 29,
      alt: 56,
      shift: 42,
      super: 125,
    };

    const args: string[] = [];
    for (const mod of modifiers) {
      const code = modifierCodes[mod.toLowerCase()];
      if (code) {
        args.push(`${code}:1`);
      }
    }

    const keyCode = await this.comboToYdotoolKeyCode(key);
    if (!keyCode) {
      this.logger.warn(
        `ydotool: no key code known for "${key}" in combo "${combo}"`,
      );
      return false;
    }
    args.push(`${keyCode}:1`, `${keyCode}:0`);
    for (const mod of modifiers) {
      const code = modifierCodes[mod.toLowerCase()];
      if (code) {
        args.push(`${code}:0`);
      }
    }

    this.logger.debug(`Executing ydotool: key ${args.join(" ")}`);
    try {
      await execFileAsync("ydotool", ["key", ...args]);
      return true;
    } catch (error) {
      this.logger.error(
        `ydotool execution failed for "${combo}" (is the ydotoold daemon running and does the user have access to /dev/uinput?):`,
        error,
      );
      return false;
    }
  }

  /**
   * Wayland-native combo injection via wtype. Modifiers are held with -M,
   * the key pressed/released with -P/-U, then modifiers released with -m.
   */
  private async executeWtypeShortcut(combo: string): Promise<boolean> {
    const parts = combo.split("+");
    const key = parts.pop() || "";
    const modifiers = parts;

    const modifierNames: Record<string, string> = {
      ctrl: "ctrl",
      alt: "alt",
      shift: "shift",
      super: "logo",
      meta: "logo",
    };

    const args: string[] = [];
    for (const mod of modifiers) {
      const name = modifierNames[mod.toLowerCase()];
      if (name) args.push("-M", name);
    }
    if (key) {
      // wtype 0.4 has NO -U flag: press is -P <key>, release is -p <key>.
      // Single letters must be LOWERCASE — the uppercase keysym ("V") is the
      // shifted keysym, so ctrl+V would fire ctrl+shift+v on the target.
      const wtypeKey = key.length === 1 ? key.toLowerCase() : key;
      args.push("-P", wtypeKey, "-p", wtypeKey);
    }
    for (const mod of modifiers) {
      const name = modifierNames[mod.toLowerCase()];
      if (name) args.push("-m", name);
    }

    this.logger.debug(`Executing wtype: ${args.join(" ")}`);
    try {
      await execFileAsync("wtype", args);
      return true;
    } catch (error) {
      this.logger.error(`wtype execution failed for "${combo}":`, error);
      return false;
    }
  }

  /**
   * Type literal text: wtype on Wayland (its core feature), xdotool on X11.
   * Used by macro "text" steps — the old code always reached for xdotool,
   * which is X11-only and silently did nothing on Wayland sessions.
   */
  private async typeText(text: string): Promise<boolean> {
    if (this.isWaylandSession()) {
      // Same fall-through contract as sendKeyCombo: an installed-but-failing
      // backend must not block the next one.
      const tried: string[] = [];
      if (await this.isToolAvailable("wtype")) {
        this.logger.debug("Executing wtype (text)");
        try {
          await execFileAsync("wtype", ["--", text]);
          return true;
        } catch (error) {
          this.logger.error("wtype text typing failed:", error);
          tried.push("wtype");
        }
      }
      if (await this.isToolAvailable("ydotool")) {
        this.logger.debug("Executing ydotool type");
        try {
          await execFileAsync("ydotool", ["type", text]);
          return true;
        } catch (error) {
          this.logger.error(
            "ydotool type failed (is the ydotoold daemon running?):",
            error,
          );
          tried.push("ydotool");
        }
      }
      if (tried.length > 0) {
        this.logger.error(
          `Text typing failed: ${tried.join(" and ")} did not deliver the text on Wayland. ` +
            `ydotool needs its daemon: 'systemctl --user start ydotool' (and your user in the 'input' group, then re-login).`,
        );
      } else {
        this.logger.error(
          "Cannot type text on Wayland: neither wtype nor ydotool is installed.",
        );
      }
      return false;
    }

    if (await this.isToolAvailable("xdotool")) {
      try {
        await execFileAsync("xdotool", ["type", "--clearmodifiers", text]);
        return true;
      } catch (error) {
        this.logger.error("xdotool type failed:", error);
        return false;
      }
    }
    this.logger.error("Cannot type text on X11: xdotool is not installed.");
    return false;
  }

  private async comboToYdotoolKeyCode(combo: string): Promise<string | null> {
    const keyCodeMap: Record<string, string> = {
      a: "30",
      b: "48",
      c: "46",
      d: "32",
      e: "18",
      f: "33",
      g: "34",
      h: "35",
      i: "23",
      j: "36",
      k: "37",
      l: "38",
      m: "50",
      n: "49",
      o: "24",
      p: "25",
      q: "16",
      r: "19",
      s: "31",
      t: "20",
      u: "22",
      v: "47",
      w: "17",
      x: "45",
      y: "21",
      z: "44",
      "0": "11",
      "1": "2",
      "2": "3",
      "3": "4",
      "4": "5",
      "5": "6",
      "6": "7",
      "7": "8",
      "8": "9",
      "9": "10",
      enter: "28",
      // Common aliases (mapToXdotoolKey normalizes Enter -> "Return").
      return: "28",
      escape: "1",
      esc: "1",
      backspace: "14",
      tab: "15",
      space: "57",
      "-": "12",
      "=": "13",
      "[": "26",
      "]": "27",
      ";": "39",
      "'": "40",
      "`": "41",
      "\\": "43",
      ",": "51",
      ".": "52",
      "/": "53",
      f1: "59",
      f2: "60",
      f3: "61",
      f4: "62",
      f5: "63",
      f6: "64",
      f7: "65",
      f8: "66",
      f9: "67",
      f10: "68",
      f11: "87",
      f12: "88",
      up: "105",
      down: "108",
      left: "106",
      right: "103",
      home: "102",
      end: "107",
      pageup: "104",
      pagedown: "109",
      insert: "110",
      delete: "111",
    };

    const key = combo.toLowerCase().replace(/[^a-z0-9]/g, "");
    return keyCodeMap[key] || null;
  }

  // ------------------------------------------------------------------
  // launch-app
  // ------------------------------------------------------------------

  /**
   * Check whether a .desktop entry with this id exists in the standard
   * XDG / Flatpak application directories.
   */
  private async desktopEntryExists(desktopId: string): Promise<boolean> {
    const dataHome =
      process.env.XDG_DATA_HOME ||
      path.join(process.env.HOME || "", ".local/share");
    const dirs = [
      path.join(dataHome, "applications"),
      "/usr/local/share/applications",
      "/usr/share/applications",
      path.join(dataHome, "flatpak/exports/share/applications"),
      "/var/lib/flatpak/exports/share/applications",
    ];
    for (const dir of dirs) {
      try {
        await access(path.join(dir, desktopId), fsConstants.F_OK);
        return true;
      } catch {
        // Keep looking through the remaining directories.
      }
    }
    return false;
  }

  private async executeLaunchApp(action: LaunchAppAction): Promise<boolean> {
    const command = action.command;
    if (!command) {
      this.logger.warn("No command provided for launch-app action");
      return false;
    }

    const args = action.args || [];
    const workingDirectory = action.workingDirectory;
    const spawnOptions = {
      detached: true,
      stdio: "ignore" as const,
      cwd: workingDirectory || undefined,
    };
    // spawn() errors (ENOENT etc.) arrive ASYNC on the child — without this
    // handler they'd surface as an unhandled 'error' event, not a log line.
    const attachErrorHandler = (
      child: ReturnType<typeof spawn>,
      label: string,
    ) => {
      child.on("error", (err) => {
        this.logger.error(`Failed to launch ${label}:`, err);
      });
      child.unref();
    };

    // Resolve the command first so "not found" is a logged failure instead
    // of a lost async error: absolute/relative paths are checked for the
    // executable bit, bare names are looked up in PATH.
    let resolved: string | null = null;
    if (command.includes("/")) {
      try {
        await access(command, fsConstants.X_OK);
        resolved = command;
      } catch {
        // Fall through to the .desktop fallback below.
      }
    } else if (await this.isToolAvailable(command)) {
      resolved = command;
    }

    if (resolved) {
      attachErrorHandler(spawn(resolved, args, spawnOptions), command);
      this.logger.info(`Launched app: ${command}`);
      return true;
    }

    // Desktop-entry fallback: apps like Steam or Firefox are often only
    // reachable through their .desktop file (no binary on PATH), or are
    // Flatpak'd. gtk-launch starts them exactly like a desktop click.
    const desktopId = `${path.basename(command.toLowerCase())}.desktop`;
    if (
      (await this.desktopEntryExists(desktopId)) &&
      (await this.isToolAvailable("gtk-launch"))
    ) {
      attachErrorHandler(
        spawn("gtk-launch", [desktopId, ...args], spawnOptions),
        desktopId,
      );
      this.logger.info(`Launched app via desktop entry: ${desktopId}`);
      return true;
    }

    this.logger.error(
      `Cannot launch app "${command}": not found in PATH and no matching ${desktopId} entry. ` +
        `Install the application or set the full executable path in the action.`,
    );
    return false;
  }

  // ------------------------------------------------------------------
  // multimedia (volume + MPRIS playback control)
  // ------------------------------------------------------------------

  private async executeMultimedia(action: MultimediaAction): Promise<boolean> {
    const mediaCommand = action.mediaCommand;
    if (!mediaCommand) {
      this.logger.warn("No media command provided");
      return false;
    }

    if (await this.tryVolumeControl(mediaCommand)) return true;
    if (await this.tryPlayerctl(mediaCommand)) return true;
    if (await this.tryDbusSend(mediaCommand)) return true;
    if (await this.tryXdotool(mediaCommand)) return true;
    if (await this.tryYdotool(mediaCommand)) return true;

    this.logger.warn(
      `No working multimedia control found for "${mediaCommand}". ` +
        `For volume control install pactl or amixer; for play/pause/next/previous install playerctl ` +
        `(or make sure a running player exposes MPRIS on the session bus).`,
    );
    return false;
  }

  private async tryVolumeControl(mediaCommand: string): Promise<boolean> {
    const volumeCommands: Record<string, string[]> = {
      "volume-up": ["amixer", "sset", "Master", "5%+"],
      "volume-down": ["amixer", "sset", "Master", "5%-"],
      mute: ["amixer", "sset", "Master", "toggle"],
    };

    if (!volumeCommands[mediaCommand]) return false;

    const tool = (await this.isToolAvailable("amixer"))
      ? "amixer"
      : (await this.isToolAvailable("pactl"))
        ? "pactl"
        : null;

    if (!tool) {
      this.logger.debug(
        `Volume control skipped for "${mediaCommand}": neither amixer nor pactl installed`,
      );
      return false;
    }

    try {
      const cmd = volumeCommands[mediaCommand];
      await execAsync(`${tool} ${cmd.slice(1).join(" ")}`);
      this.logger.info(
        `Volume control via ${tool}: ${cmd.slice(1).join(" ")}`,
      );
      return true;
    } catch {
      return false;
    }
  }

  private async tryPlayerctl(mediaCommand: string): Promise<boolean> {
    const playerctlCommands: Record<string, string> = {
      "play-pause": "play-pause",
      play: "play",
      pause: "pause",
      next: "next",
      previous: "previous",
      stop: "stop",
    };

    const cmd = playerctlCommands[mediaCommand];
    if (!cmd || !(await this.isToolAvailable("playerctl"))) return false;

    try {
      await execAsync(`playerctl ${cmd}`);
      this.logger.info(`Media control via playerctl: ${cmd}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Discover running MPRIS players. playerctl -l knows player instances
   * even when they hide from ListNames; the gdbus fallback works on any
   * desktop with a session bus and needs no playerctl installed.
   */
  private async listMprisBusNames(): Promise<string[]> {
    if (await this.isToolAvailable("playerctl")) {
      try {
        const { stdout } = await execAsync("playerctl -l");
        const players = stdout
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        if (players.length > 0) {
          return players.map((p) => `org.mpris.MediaPlayer2.${p}`);
        }
      } catch {
        // playerctl exists but listed nothing — fall through to D-Bus.
      }
    }

    try {
      const { stdout } = await execAsync(
        "gdbus call --session --dest org.freedesktop.DBus " +
          "--object-path /org/freedesktop/DBus " +
          "--method org.freedesktop.DBus.ListNames",
      );
      return stdout.match(/org\.mpris\.MediaPlayer2\.[A-Za-z0-9_.-]+/g) || [];
    } catch {
      return [];
    }
  }

  /**
   * Send the MPRIS command directly over the session bus. The old code
   * targeted the hardcoded bus name "org.mpris.MediaPlayer2.Player", which
   * no real player owns — discover the actual player bus names instead.
   */
  private async tryDbusSend(mediaCommand: string): Promise<boolean> {
    const dbusCommands: Record<string, string> = {
      "play-pause": "PlayPause",
      play: "Play",
      pause: "Pause",
      next: "Next",
      previous: "Previous",
      stop: "Stop",
    };

    const method = dbusCommands[mediaCommand];
    if (!method) return false;

    if (!(await this.isToolAvailable("dbus-send"))) return false;

    const players = await this.listMprisBusNames();
    for (const busName of players) {
      // playerctld is a multiplexer, not a player; targeting it would
      // double-apply commands to whichever player it forwards to.
      if (busName.endsWith(".playerctld")) continue;
      try {
        await execAsync(
          `dbus-send --print-reply --dest=${busName} /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.${method}`,
        );
        this.logger.info(`Media control via MPRIS (${busName}): ${method}`);
        return true;
      } catch {
        // Player may have quit or not implement the method — try the next.
      }
    }
    return false;
  }

  private async tryXdotool(mediaKey: string): Promise<boolean> {
    const xdotoolKeys: Record<string, string> = {
      "play-pause": " XF86AudioPlay",
      play: " XF86AudioPlay",
      pause: " XF86AudioPause",
      next: " XF86AudioNext",
      previous: " XF86AudioPrev",
      stop: " XF86AudioStop",
    };

    const key = xdotoolKeys[mediaKey];
    if (!key || !(await this.isToolAvailable("xdotool"))) return false;

    try {
      await execAsync(`xdotool key${key}`);
      return true;
    } catch {
      return false;
    }
  }

  private async tryYdotool(mediaKey: string): Promise<boolean> {
    const ydotoolKeys: Record<string, string> = {
      "play-pause": "202",
      play: "202",
      pause: "202",
      next: "407",
      previous: "412",
      stop: "128",
    };

    const keyCode = ydotoolKeys[mediaKey];
    if (!keyCode || !(await this.isToolAvailable("ydotool"))) return false;

    try {
      await execAsync(`ydotool key ${keyCode}:1 ${keyCode}:0`);
      return true;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // system-sleep (systemctl suspend)
  // ------------------------------------------------------------------

  /**
   * Suspend the machine. Elgato's Sleep action; on Linux the session-independent
   * path is systemd. A failed suspend (polkit denial, sleep target masked)
   * is logged — from a hardware key the user sees nothing else.
   */
  private async executeSystemSleep(): Promise<boolean> {
    if (!(await this.isToolAvailable("systemctl"))) {
      this.logger.error(
        "Cannot suspend: systemctl is not available (non-systemd system?). " +
          "BigDeck's sleep action requires systemd (logind).",
      );
      return false;
    }

    this.logger.info("Suspending system (systemctl suspend)");
    try {
      await execFileAsync("systemctl", ["suspend"]);
      return true;
    } catch (error) {
      this.logger.error(
        "systemctl suspend failed (is your user allowed to suspend without a password? " +
          "Check polkit, or that the sleep target is not masked):",
        error,
      );
      return false;
    }
  }

  // ------------------------------------------------------------------
  // close-app (graceful app close: wmctrl windows, pkill fallback)
  // ------------------------------------------------------------------

  /**
   * Close all instances of an app (Elgato's Close action). Graceful first:
   * on X11 wmctrl asks each matching window to close (the app may prompt to
   * save), then a SIGTERM to the exact process name covers headless apps and
   * Wayland sessions where window listing is unavailable. SIGKILL is never
   * used — that is "force quit", not "close".
   */
  private async executeCloseApp(action: CloseAppAction): Promise<boolean> {
    const target = action.target?.trim();
    if (!target) {
      this.logger.warn("No target provided for close-app action");
      return false;
    }

    // X11: close each window whose title contains the target. Most honest
    // reading of "close the app" — the app gets to shut down cleanly.
    if (
      process.env.XDG_SESSION_TYPE !== "wayland" &&
      (await this.isToolAvailable("wmctrl"))
    ) {
      try {
        const { stdout } = await execAsync("wmctrl -l");
        const windowIds = stdout
          .split("\n")
          .filter((line) => line.toLowerCase().includes(target.toLowerCase()))
          .map((line) => line.split(/\s+/)[0])
          .filter(Boolean);

        if (windowIds.length > 0) {
          let closed = 0;
          for (const id of windowIds) {
            try {
              await execAsync(`wmctrl -ic ${id}`);
              closed++;
            } catch {
              // Window may have closed itself in between — keep going.
            }
          }
          this.logger.info(
            `Closed ${closed} window(s) matching "${target}" via wmctrl`,
          );
          return true;
        }
        this.logger.debug(
          `No wmctrl windows match "${target}" — falling back to process signal`,
        );
      } catch (error) {
        this.logger.warn("wmctrl -l failed:", error);
      }
    }

    // Fallback (and the only path on Wayland): SIGTERM the exact process
    // name. Exit code 0 means at least one process was signalled.
    if (await this.isToolAvailable("pkill")) {
      try {
        await execFileAsync("pkill", ["-TERM", "-x", target]);
        this.logger.info(`Sent SIGTERM to process "${target}"`);
        return true;
      } catch (error) {
        // pkill exits non-zero when nothing matched.
        this.logger.warn(
          `No running process named "${target}" to close (pkill matched nothing)`,
          error,
        );
        return false;
      }
    }

    this.logger.error(
      `Cannot close "${target}": neither wmctrl (X11) nor pkill is installed. ` +
        `Install wmctrl (e.g. 'sudo apt install wmctrl') or procps for the pkill fallback.`,
    );
    return false;
  }

  // ------------------------------------------------------------------
  // open-url / open-folder (xdg-open on Linux)
  // ------------------------------------------------------------------

  private async executeOpenUrl(action: Action): Promise<boolean> {
    const url = (action as { url?: string }).url;
    if (!url) {
      this.logger.warn("No URL provided for open-url action");
      return false;
    }

    const cmd = process.platform === "darwin" ? "open" : "xdg-open";
    if (!(await this.isToolAvailable(cmd))) {
      this.logger.error(
        `Cannot open URL "${url}": ${cmd} is not installed (part of xdg-utils).`,
      );
      return false;
    }

    try {
      const child = spawn(cmd, [url], { detached: true, stdio: "ignore" });
      child.on("error", (err) => {
        this.logger.error(`Failed to open URL ${url}:`, err);
      });
      child.unref();
      this.logger.info(`Opened URL: ${url}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to open URL ${url}:`, error);
      return false;
    }
  }

  private async executeOpenFolder(action: Action): Promise<boolean> {
    const folderPath = (action as { path?: string }).path;
    if (!folderPath) {
      this.logger.warn("No path provided for open-folder action");
      return false;
    }

    const cmd = process.platform === "darwin" ? "open" : "xdg-open";
    if (!(await this.isToolAvailable(cmd))) {
      this.logger.error(
        `Cannot open folder "${folderPath}": ${cmd} is not installed (part of xdg-utils).`,
      );
      return false;
    }

    try {
      const child = spawn(cmd, [folderPath], {
        detached: true,
        stdio: "ignore",
      });
      child.on("error", (err) => {
        this.logger.error(`Failed to open folder ${folderPath}:`, err);
      });
      child.unref();
      this.logger.info(`Opened folder: ${folderPath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to open folder ${folderPath}:`, error);
      return false;
    }
  }

  // ------------------------------------------------------------------
  // run-script
  // ------------------------------------------------------------------

  private async executeScript(action: RunScriptAction): Promise<boolean> {
    const interpreter = action.scriptType || "shell";
    const cmd =
      interpreter === "python"
        ? "python3"
        : interpreter === "node"
          ? "node"
          : "bash";

    if (!(await this.isToolAvailable(cmd))) {
      this.logger.error(
        `Cannot run script: interpreter "${cmd}" is not installed.`,
      );
      return false;
    }

    // ---- File mode: run a script on disk (~ expanded, must exist) ----
    if (action.scriptFile) {
      const resolved = action.scriptFile.startsWith("~")
        ? path.join(os.homedir(), action.scriptFile.slice(1))
        : action.scriptFile;
      try {
        await access(resolved, fsConstants.F_OK);
      } catch {
        this.logger.error(
          `Cannot run script file: not found at "${resolved}" (configured: "${action.scriptFile}").`,
        );
        return false;
      }

      try {
        // Detached on purpose (same rationale as inline mode): the deck must
        // never wait on a script. The interpreter opens the file itself, so
        // the execute bit is not required.
        const child = spawn(cmd, [resolved], {
          detached: true,
          stdio: "ignore",
        });
        child.on("error", (err) => {
          this.logger.error(
            `Failed to execute script file "${resolved}" with ${cmd}:`,
            err,
          );
        });
        child.unref();
        this.logger.info(`Executed script file with ${cmd}: ${resolved}`);
        return true;
      } catch (error) {
        this.logger.error(`Failed to execute script file:`, error);
        return false;
      }
    }

    // ---- Inline mode ----
    const script = action.script;
    if (!script) {
      this.logger.warn(
        "No script provided for run-script action (paste code or point to a script file).",
      );
      return false;
    }

    try {
      // Detached on purpose: long-running scripts must not hold the deck
      // hostage. stdout/stderr are discarded, so failures inside the script
      // itself (bad shebang, syntax error) are not tracked — only spawn
      // errors are logged.
      const child = spawn(cmd, ["-c", script], {
        detached: true,
        stdio: "ignore",
      });
      child.on("error", (err) => {
        this.logger.error(`Failed to execute script with ${cmd}:`, err);
      });
      child.unref();
      this.logger.info(`Executed script with ${cmd}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to execute script:`, error);
      return false;
    }
  }

  // ------------------------------------------------------------------
  // macro
  // ------------------------------------------------------------------

  private async executeMacro(action: MacroAction): Promise<boolean> {
    const steps = action.steps || [];
    if (steps.length === 0) {
      this.logger.warn("No steps in macro");
      return false;
    }

    for (const step of steps) {
      const ok = await this.executeMacroStep(step);
      if (!ok) return false;
      if (step.duration) {
        await this.delay(step.duration);
      }
    }
    return true;
  }

  private async executeMacroStep(step: MacroStep): Promise<boolean> {
    switch (step.type) {
      case "key":
        if (step.value) {
          if (process.platform === "darwin") {
            const keys = this.sanitizeShortcutInput(step.value);
            try {
              await execAsync(
                `osascript -e 'tell application "System Events" to keystroke "${keys.join("")}"'`,
              );
              return true;
            } catch (error) {
              this.logger.error("macOS keystroke failed:", error);
              return false;
            }
          }
          return this.sendKeyCombo(
            this.sanitizeShortcutInput(step.value).join("+"),
          );
        }
        return true;
      case "text":
        if (step.value) {
          if (process.platform === "darwin") {
            try {
              await execAsync(
                `osascript -e 'tell application "System Events" to keystroke "${step.value}"'`,
              );
              return true;
            } catch (error) {
              this.logger.error("macOS keystroke failed:", error);
              return false;
            }
          }
          return this.typeText(step.value);
        }
        return true;
      case "delay":
        await this.delay(step.duration || 100);
        return true;
    }
  }

  startMacroRecording(): void {
    this.isRecordingMacro = true;
    this.recordedSteps = [];
    this.recordingStartTime = Date.now();
    this.logger.info("Started macro recording");
  }

  stopMacroRecording(): MacroStep[] {
    this.isRecordingMacro = false;
    this.logger.info(
      `Stopped macro recording, recorded ${this.recordedSteps.length} steps`,
    );
    return this.recordedSteps;
  }

  private recordKeyEvent(key: string): void {
    const now = Date.now();
    const elapsed = now - this.recordingStartTime;

    this.recordedSteps.push({
      type: "key",
      value: key,
      duration: Math.min(elapsed, 5000),
    });

    this.recordingStartTime = now;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
