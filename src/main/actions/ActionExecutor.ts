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

import { exec, execFile, spawn, type ChildProcess } from "child_process";
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
  SoundboardAction,
  SoundboardStopAction,
  TimerAction,
  ClockAction,
  HotkeySwitchAction,
  PageNextAction,
  PagePreviousAction,
  Action,
  ActionOrigin,
} from "../../shared/types";
import type { DeviceType, ProfilePage } from "../../shared/types";
import type { Logger } from "../utils/Logger";
import { UinputInjector } from "./UinputInjector";
import {
  ActionTickService,
  renderTickTextFrame,
  tickKeySize,
} from "./ActionTickService";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

/**
 * Format wall-clock time for a clock key: "HH:MM" (24h) / "H:MM AM|PM"
 * (12h), optional ":SS" seconds suffix.
 */
export function formatClockTime(
  now: Date,
  use24h: boolean,
  showSeconds: boolean,
): string {
  const hours24 = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  if (use24h) {
    const hours = String(hours24).padStart(2, "0");
    return `${hours}:${minutes}${showSeconds ? `:${seconds}` : ""}`;
  }
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const suffix = hours24 < 12 ? " AM" : " PM";
  return `${hours12}:${minutes}${showSeconds ? `:${seconds}` : ""}${suffix}`;
}

/** One injection backend's availability for the settings diagnostics card. */
export interface KeyboardInjectionBackendStatus {
  name: "uinput" | "ydotool" | "wtype" | "xdotool";
  available: boolean;
  detail: string;
}

/** What the Settings panel's "Keyboard Shortcuts (Linux injection)" card renders. */
export interface KeyboardInjectionStatus {
  session: "wayland" | "x11";
  backends: KeyboardInjectionBackendStatus[];
}

export class ActionExecutor {
  private logger: Logger;
  private isRecordingMacro = false;
  private recordedSteps: MacroStep[] = [];
  private recordingStartTime = 0;
  private executionLocks: Map<string, number> = new Map();

  onSwitchProfile: ((profileId: string) => Promise<void>) | null = null;
  onSwitchPage: ((pageIndex: number) => Promise<void>) | null = null;
  /**
   * Relative page navigation (page.next / page.previous). The handler owns
   * clamping/wrap-around — the app entry point rotates within the profile's
   * page count.
   */
  onSwitchPageRelative: ((delta: number) => Promise<void>) | null = null;
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

  private uinput: UinputInjector;
  /**
   * Hotkey Switch toggle state per key (`deviceId:keyIndex`, or the action
   * id when triggered without a device origin). In-memory only: RESET ON
   * PROFILE SWITCH (resetHotkeySwitchStates, called by the app entry
   * point's onSwitchProfile wiring) and on app restart.
   */
  private readonly hotkeySwitchStates = new Map<string, boolean>();
  /**
   * Tick-render registry (timer/clock displays, future screensavers).
   * Constructed here; the image sink is wired from the app entry point via
   * tickService.setSink(...). Tests inject a fake service.
   */
  readonly tickService: ActionTickService;

  constructor(logger: Logger, tickService?: ActionTickService) {
    this.logger = logger;
    this.uinput = new UinputInjector(logger);
    this.tickService = tickService ?? new ActionTickService(logger);

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
        case "soundboard":
          succeeded = await this.executeSoundboard(
            action as SoundboardAction,
          );
          break;
        case "soundboard.stop":
          succeeded = await this.executeSoundboardStop(
            action as SoundboardStopAction,
          );
          break;
        case "timer":
          succeeded = await this.executeTimer(action as TimerAction, origin);
          break;
        case "clock":
          succeeded = await this.executeClock(action as ClockAction, origin);
          break;
        case "hotkeyswitch":
          succeeded = await this.executeHotkeySwitch(
            action as HotkeySwitchAction,
            origin,
          );
          break;
        case "page.next":
        case "page.previous": {
          if (this.onSwitchPageRelative) {
            try {
              await this.onSwitchPageRelative(
                action.type === "page.next" ? 1 : -1,
              );
              succeeded = true;
            } catch (error) {
              this.logger.error(`${action.type} handler failed:`, error);
            }
          } else {
            this.logger.warn(
              "No onSwitchPageRelative handler registered",
            );
          }
          break;
        }
        default:
          // Static unreachable (the cases above cover every ActionType
          // member) but kept as the runtime safety net for malformed actions
          // from persisted profiles or the network API.
          this.logger.warn(
            `Unknown action type: ${(action as Action).type}`,
          );
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
      case "soundboard":
      case "soundboard.stop":
        return 200;
      case "keyboard-shortcut":
        return 300;
      // Toggle/start-stop semantics: EVERY press must arrive — debouncing
      // a timer toggle or a hotkey switch would eat the second press.
      case "timer":
      case "clock":
      case "hotkeyswitch":
        return 0;
      case "page.next":
      case "page.previous":
        return 200;
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

  // ------------------------------------------------------------------
  // Keyboard injection diagnostics (Settings panel, Linux)
  // ------------------------------------------------------------------

  /**
   * Report which injection backends are usable in THIS session, for the
   * settings diagnostics card. uinput counts as available when /dev/uinput
   * is writable (UinputInjector.isEnvironmentCapable) — the helper process
   * starts lazily on first use, so its ready-state is reported in the detail
   * string instead of failing the chip before any shortcut was ever sent.
   * The end-to-end verdict comes from testKeyboardInjection().
   */
  async getKeyboardInjectionStatus(): Promise<KeyboardInjectionStatus> {
    const session: "wayland" | "x11" = this.isWaylandSession()
      ? "wayland"
      : "x11";

    const uinputCapable = UinputInjector.isEnvironmentCapable();
    const uinputReady = this.uinput.isReady;
    const [ydotool, wtype, xdotool] = await Promise.all([
      this.isToolAvailable("ydotool"),
      this.isToolAvailable("wtype"),
      this.isToolAvailable("xdotool"),
    ]);

    const backends: KeyboardInjectionBackendStatus[] = [
      {
        name: "uinput",
        available: uinputCapable,
        detail: uinputCapable
          ? uinputReady
            ? "/dev/uinput writable — native helper running"
            : "/dev/uinput writable — helper starts on first use"
          : "/dev/uinput is not writable — install BigDeck's udev rules and re-login (or add your user to the input group)",
      },
      {
        name: "ydotool",
        available: ydotool,
        detail: ydotool
          ? "installed — needs the ydotoold daemon running"
          : "not installed",
      },
      {
        name: "wtype",
        available: wtype,
        detail: wtype
          ? "installed — needs compositor virtual-keyboard support (KDE/GNOME Wayland may reject it)"
          : "not installed",
      },
      {
        name: "xdotool",
        available: xdotool,
        detail: xdotool
          ? "installed (X11 sessions only)"
          : "not installed (X11 sessions only)",
      },
    ];

    return { session, backends };
  }

  /**
   * Diagnostics test: tap Ctrl down+up through the SAME chain real shortcuts
   * use (uinput → ydotool/wtype on Wayland, uinput → xdotool/ydotool on
   * X11). A lone modifier press types nothing, so the test is harmless no
   * matter which window has focus. Returns the chain's verdict.
   */
  async testKeyboardInjection(): Promise<boolean> {
    return this.sendKeyCombo("ctrl");
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

    // --- uinput first: native kernel injection, works on EVERY compositor
    // (X11, KDE/GNOME Wayland, wlroots) with zero external tools. Falls
    // through when /dev/uinput is inaccessible, python3 is missing, or a
    // key name has no evdev mapping.
    const mapped = UinputInjector.mapCombo(combo.split("+"));
    if (mapped) {
      if (await this.uinput.sendCombo(mapped)) return true;
    }

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
    // uinput first: native kernel injection, works on every compositor
    // (KDE/GNOME Wayland reject wtype's virtual-keyboard protocol).
    if (await this.uinput.sendText(text)) return true;

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

    // System mic/output mute via pactl — the Linux-native "Discord mute/
    // deafen": mutes the real capture/playback device, works regardless of
    // which window has focus (unlike Discord's X11 global keybinds).
    if (mediaCommand === "mute-mic" || mediaCommand === "mute-output") {
      return this.tryPactlMute(mediaCommand);
    }
    // ptt-mic is HOLD semantics: press handled by pressPtt() (unmute),
    // release on key:up via releasePtt() — wired in index.ts key handlers.
    if (mediaCommand === "ptt-mic") {
      this.logger.warn(
        "ptt-mic reached executeMultimedia without hold wiring — dropped.",
      );
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

  /**
   * System-level mic/output mute via pactl (PipeWire/PulseAudio). Toggles
   * the DEFAULT source (microphone) or sink (speakers/headphones) and logs
   * the resulting state truthfully — this is what Discord mute/deafen keys
   * should map to on Linux: it works no matter which app is focused.
   */
  /** Keys with a held PTT mic (keyIndex -> true while held). */
  private heldPtt = new Set<number>();

  /**
   * Push-to-talk PRESS: unmute the system microphone. Paired with
   * releasePtt(keyIndex) on key up — hold the deck key to talk.
   */
  async pressPtt(keyIndex: number): Promise<boolean> {
    if (this.heldPtt.has(keyIndex)) return true; // already held — no re-trigger
    if (!(await this.isToolAvailable("pactl"))) {
      this.logger.error("PTT: pactl is not installed.");
      return false;
    }
    try {
      await execFileAsync("pactl", ["set-source-mute", "@DEFAULT_SOURCE@", "0"]);
      this.heldPtt.add(keyIndex);
      this.logger.info(`PTT: microphone LIVE (key ${keyIndex} held).`);
      return true;
    } catch (error) {
      this.logger.error("PTT press failed:", error);
      return false;
    }
  }

  /**
   * Push-to-talk RELEASE: mute the system microphone. Called from the
   * key-up path; safe to call when nothing is held.
   */
  async releasePtt(keyIndex: number): Promise<boolean> {
    if (!this.heldPtt.has(keyIndex)) return true;
    this.heldPtt.delete(keyIndex);
    if (!(await this.isToolAvailable("pactl"))) return false;
    try {
      await execFileAsync("pactl", ["set-source-mute", "@DEFAULT_SOURCE@", "1"]);
      this.logger.info(`PTT: microphone muted (key ${keyIndex} released).`);
      return true;
    } catch (error) {
      this.logger.error("PTT release failed:", error);
      return false;
    }
  }

  private async tryPactlMute(mediaCommand: string): Promise<boolean> {
    if (!(await this.isToolAvailable("pactl"))) {
      this.logger.error(
        "Cannot toggle mute: pactl is not installed (PipeWire/PulseAudio systems ship it by default).",
      );
      return false;
    }
    const isMic = mediaCommand === "mute-mic";
    const target = isMic ? "@DEFAULT_SOURCE@" : "@DEFAULT_SINK@";
    const what = isMic ? "microphone" : "speakers/headphones";
    try {
      await execFileAsync(
        "pactl",
        [isMic ? "set-source-mute" : "set-sink-mute", target, "toggle"],
      );
      // PipeWire applies the mute asynchronously — an immediate state query
      // races ahead and reads the STALE pre-toggle state (logged "unmuted"
      // after a successful mute). Settle before reading back.
      await new Promise((resolve) => setTimeout(resolve, 150));
      const state = await execFileAsync(
        isMic ? "get-source-mute" : "get-sink-mute",
        [target],
        { timeout: 3000 },
      )
        .then((r) => String((r as { stdout: string }).stdout))
        .catch(() => "");
      const muted = /mute:\s*yes/i.test(state);
      this.logger.info(`System ${what} is now ${muted ? "MUTED" : "unmuted"}.`);
      return true;
    } catch (error) {
      this.logger.error(`pactl ${mediaCommand} toggle failed:`, error);
      return false;
    }
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
  // soundboard (paplay → pw-play → ffplay → cvlc)
  // ------------------------------------------------------------------

  /**
   * Playing samples, keyed by resolved sample path. Elgato Soundboard
   * semantics: a new press on the SAME sample stops and restarts it;
   * different samples overlap. `soundboard.stop` terminates everything in
   * this registry — without it, "stop" would be impossible.
   */
  private readonly soundboardChildren = new Map<string, ChildProcess>();

  /**
   * Terminate one playing sample. SIGTERM first; the process removes itself
   * from the registry via its exit listener. Returns true when something
   * was actually signalled.
   */
  private stopSoundboardChild(key: string, reason: string): boolean {
    const child = this.soundboardChildren.get(key);
    if (!child) return false;
    this.soundboardChildren.delete(key);
    try {
      child.kill("SIGTERM");
      // SIGKILL escalation: a wedged player must not keep the audio device.
      const killed = child;
      setTimeout(() => {
        if (!killed.killed && killed.exitCode === null) {
          this.logger.warn(`soundboard: SIGTERM ignored, sending SIGKILL (${reason})`);
          killed.kill("SIGKILL");
        }
      }, 500).unref();
    } catch (error) {
      this.logger.warn(`soundboard: failed to stop "${reason}":`, error);
    }
    return true;
  }

  private async executeSoundboard(action: SoundboardAction): Promise<boolean> {
    const raw = action.samplePath?.trim();
    if (!raw) {
      this.logger.warn(
        "No audio file selected for soundboard action — open this key's editor and pick a sample.",
      );
      return false;
    }

    const samplePath = raw.startsWith("~")
      ? path.join(os.homedir(), raw.slice(1))
      : raw;
    try {
      await access(samplePath, fsConstants.F_OK);
    } catch {
      this.logger.error(
        `Cannot play sound: file not found at "${samplePath}" (configured: "${raw}").`,
      );
      return false;
    }

    // Elgato behavior: re-press on the same sample = stop + restart.
    const registryKey = path.resolve(samplePath);
    if (this.stopSoundboardChild(registryKey, "restart")) {
      this.logger.debug(`soundboard: restarting "${samplePath}"`);
    }

    const volume = Math.max(0, Math.min(100, Math.round(action.volume ?? 100)));

    // Backend chain, first installed wins. Each entry knows how to turn
    // (samplePath, volume) into argv for one player.
    const backends: Array<{
      name: string;
      build: () => string[] | null;
    }> = [
      {
        name: "paplay",
        build: () => [`--volume=${volume}`, samplePath],
      },
      {
        name: "pw-play",
        build: () => {
          // pw-play has no volume flag (PipeWire node volume is the
          // proper knob and needs more wiring) — play at native volume.
          this.logger.debug(
            "soundboard: pw-play has no volume flag — playing at native volume",
          );
          return [samplePath];
        },
      },
      {
        name: "ffplay",
        build: () => [
          "-nodisp",
          "-autoexit",
          "-loglevel",
          "quiet",
          "-volume",
          String(volume),
          samplePath,
        ],
      },
      {
        name: "cvlc",
        build: () => {
          // --gain is a linear factor (1.0 = 100%); some output modules
          // ignore it, which is why the volume slider keeps the honest
          // "best effort" hint in the editor.
          this.logger.debug(
            "soundboard: cvlc volume uses --gain — some output modules ignore it",
          );
          return ["--play-and-exit", "--gain", (volume / 100).toFixed(2), samplePath];
        },
      },
    ];

    for (const backend of backends) {
      if (!(await this.isToolAvailable(backend.name))) continue;
      const args = backend.build();
      if (!args) continue;

      try {
        const child = spawn(backend.name, args, {
          detached: true,
          stdio: "ignore",
        });
        // Spawn errors (ENOENT races, EACCES) arrive async — surface them.
        child.on("error", (err) => {
          this.logger.error(`soundboard: ${backend.name} failed to start:`, err);
          this.soundboardChildren.delete(registryKey);
        });
        child.on("exit", () => {
          if (this.soundboardChildren.get(registryKey) === child) {
            this.soundboardChildren.delete(registryKey);
          }
        });
        // Fire-and-forget on purpose (v1): playback outlives the press and
        // is stopped via `soundboard.stop` or a re-press restart.
        child.unref();
        this.soundboardChildren.set(registryKey, child);
        this.logger.info(
          `Playing sound via ${backend.name}: ${samplePath} (volume ${volume}%)`,
        );
        return true;
      } catch (error) {
        this.logger.error(`soundboard: spawning ${backend.name} failed:`, error);
      }
    }

    this.logger.error(
      `Cannot play sound "${samplePath}": none of paplay, pw-play, ffplay or cvlc is installed. ` +
        `Install one of them (e.g. 'sudo apt install pipewire-audio ffmpeg' provides paplay/pw-play/ffplay).`,
    );
    return false;
  }

  private async executeSoundboardStop(
    _action: SoundboardStopAction,
  ): Promise<boolean> {
    if (this.soundboardChildren.size === 0) {
      this.logger.debug("soundboard.stop: no sounds playing");
      return true;
    }

    let stopped = 0;
    for (const key of [...this.soundboardChildren.keys()]) {
      if (this.stopSoundboardChild(key, "stop-all")) stopped++;
    }
    this.logger.info(`soundboard.stop: stopped ${stopped} playing sample(s)`);
    return true;
  }

  // ------------------------------------------------------------------
  // timer + clock (ActionTickService display actions)
  //
  // Both own their key: registering with the tick service renders frames
  // through DeviceManager each bucket (DeviceManager hash-skips unchanged
  // images, so a minute clock's 1s render loop is free at the hardware).
  // Countdowns are wall-clock based (endTime vs Date.now()) so a suspended
  // machine doesn't drift the timer. A render returning null is the generic
  // "display finished" signal — the service unregisters the key and
  // restores its static appearance from HardwareSync's cache.
  // ------------------------------------------------------------------

  /** Start (or restart) the countdown for one key. */
  private startTimer(
    action: TimerAction,
    origin: ActionOrigin,
    keyId: string,
    durationMs: number,
  ): void {
    const { width, height } = tickKeySize(origin.deviceType ?? "original");
    const endTime = Date.now() + durationMs;
    this.tickService.register({
      keyId,
      deviceId: origin.deviceId,
      keyIndex: origin.keyIndex,
      intervalMs: 1000,
      kind: "timer",
      render: async () => {
        const remainingMs = endTime - Date.now();
        if (remainingMs <= 0) {
          this.logger.info(
            `timer on ${keyId} finished — restoring key` +
              (action.onCompleteAction ? ", running completion action" : ""),
          );
          // Returning null unregisters + restores the static appearance;
          // the chained action is fired without blocking the tick loop.
          if (action.onCompleteAction) {
            void this.executeAction(action.onCompleteAction, origin);
          }
          return null;
        }
        const totalSeconds = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const text = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        return renderTickTextFrame(text, width, height);
      },
    });
  }

  private async executeTimer(
    action: TimerAction,
    origin?: ActionOrigin,
  ): Promise<boolean> {
    if (!origin) {
      this.logger.warn(
        "timer action needs a device key origin to render its countdown (hardware presses provide it) — press ignored",
      );
      return false;
    }

    const minutes = Math.max(0, Math.floor(action.minutes ?? 0));
    const seconds = Math.max(0, Math.floor(action.seconds ?? 0));
    const durationMs = (minutes * 60 + seconds) * 1000;
    if (durationMs <= 0) {
      this.logger.warn(
        "timer has a zero duration — set minutes or seconds in the key editor",
      );
      return false;
    }

    const keyId = `${origin.deviceId}:${origin.keyIndex}`;
    const running = this.tickService.kindOf(keyId);

    if (running === "timer") {
      if ((action.pressAgain ?? "stop") === "restart") {
        this.logger.info(
          `timer on ${keyId}: restarted (${minutes}m ${seconds}s)`,
        );
        this.startTimer(action, origin, keyId, durationMs);
        return true;
      }
      await this.tickService.unregister(keyId);
      this.logger.info(`timer on ${keyId}: stopped, key restored`);
      return true;
    }

    // A clock (or another display) may own the key from an earlier config —
    // take the key over before starting the countdown.
    if (running) await this.tickService.unregister(keyId);
    this.logger.info(
      `timer on ${keyId}: started (${minutes}m ${seconds}s, press again to ${
        (action.pressAgain ?? "stop") === "restart" ? "restart" : "stop"
      })`,
    );
    this.startTimer(action, origin, keyId, durationMs);
    return true;
  }

  private async executeClock(
    action: ClockAction,
    origin?: ActionOrigin,
  ): Promise<boolean> {
    if (!origin) {
      this.logger.warn(
        "clock action needs a device key origin to render the time (hardware presses provide it) — press ignored",
      );
      return false;
    }

    const keyId = `${origin.deviceId}:${origin.keyIndex}`;
    const { width, height } = tickKeySize(origin.deviceType ?? "original");
    const use24h = action.use24h !== false;
    const showSeconds = action.showSeconds === true;

    // Render every second (exact minute flips) but memoize the last frame:
    // an unchanged text returns the same buffer, which DeviceManager
    // hash-skips — no re-encode, no hardware write.
    let lastText = "";
    let lastFrame: Buffer | null = null;
    this.tickService.register({
      keyId,
      deviceId: origin.deviceId,
      keyIndex: origin.keyIndex,
      intervalMs: 1000,
      kind: "clock",
      render: async () => {
        const text = formatClockTime(new Date(Date.now()), use24h, showSeconds);
        if (text === lastText && lastFrame) return lastFrame;
        lastText = text;
        lastFrame = await renderTickTextFrame(text, width, height);
        return lastFrame;
      },
    });
    this.logger.info(
      `clock live on ${keyId} (${use24h ? "24h" : "12h"}${
        showSeconds ? ", seconds" : ""
      })`,
    );
    return true;
  }

  /**
   * Keep clock displays in sync with a page's placements. Called by the app
   * entry point after every page apply/activation/update so clocks show the
   * time WITHOUT a press (Elgato's Digital Time is passive). Registers keys
   * carrying a clock action, refreshes existing ones, and stops displays on
   * keys whose clock action went away. Timers are deliberately untouched —
   * they are press-started and keep counting across page switches.
   */
  syncClocks(
    deviceId: string,
    deviceType: DeviceType,
    page: ProfilePage | undefined,
  ): void {
    const wanted = new Map<number, ClockAction>();
    for (const key of page?.keys ?? []) {
      if (key.action?.type === "clock") {
        wanted.set(key.keyIndex, key.action as ClockAction);
      }
    }

    for (const entry of this.tickService.listKeys()) {
      if (
        entry.deviceId === deviceId &&
        entry.kind === "clock" &&
        !wanted.has(entry.keyIndex)
      ) {
        void this.tickService.unregister(entry.keyId);
      }
    }

    for (const [keyIndex, clockAction] of wanted) {
      void this.executeClock(clockAction, { deviceId, keyIndex, deviceType });
    }
  }

  // ------------------------------------------------------------------
  // hotkeyswitch (toggle between two combos, per-key state)
  // ------------------------------------------------------------------

  /**
   * Toggle the key's on/off state and send the matching combo. The state
   * only flips when the combo actually went out — a failed injection keeps
   * the previous state so the toggle never lies.
   */
  private async executeHotkeySwitch(
    action: HotkeySwitchAction,
    origin?: ActionOrigin,
  ): Promise<boolean> {
    // With a device origin, state is per KEY (two keys with the same action
    // toggle independently). Without one (network/API triggers), fall back
    // to per-action-instance state.
    const keyId = origin
      ? `${origin.deviceId}:${origin.keyIndex}`
      : `action:${action.id}`;

    const wasOn = this.hotkeySwitchStates.get(keyId) ?? false;
    const turningOn = !wasOn;
    const keys = turningOn ? action.onKeys : action.offKeys;
    const modifiers = turningOn ? action.onModifiers : action.offModifiers;

    if (!keys || keys.length === 0) {
      this.logger.warn(
        `hotkeyswitch has no combo recorded for the ${turningOn ? "ON" : "OFF"} state — open this key's editor and record both combos.`,
      );
      return false;
    }

    const combo = [...(modifiers || []), ...keys].join("+");
    if (!(await this.sendKeyCombo(combo))) {
      this.logger.error(
        `hotkeyswitch: ${turningOn ? "ON" : "OFF"} combo "${combo}" failed — state NOT toggled (reason logged above)`,
      );
      return false;
    }

    this.hotkeySwitchStates.set(keyId, turningOn);
    this.logger.info(
      `hotkeyswitch ${keyId}: ${turningOn ? "ON" : "OFF"} (sent "${combo}")`,
    );
    return true;
  }

  /**
   * Forget all Hotkey Switch states. Called on profile switches by the app
   * entry point — a fresh page means fresh toggles (documented behavior:
   * state is in-memory only and never persisted).
   */
  resetHotkeySwitchStates(): void {
    if (this.hotkeySwitchStates.size > 0) {
      this.logger.debug(
        `hotkeyswitch: resetting ${this.hotkeySwitchStates.size} toggle state(s)`,
      );
    }
    this.hotkeySwitchStates.clear();
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
