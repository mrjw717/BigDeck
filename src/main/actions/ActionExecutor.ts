// ============================================================================
// BigDeck - Action Executor
// Executes key actions: keyboard shortcuts, app launching, scripts, macros
// ============================================================================

import { exec, spawn } from "child_process";
import { promisify } from "util";
import { uIOhook, UiohookKeyboardEvent } from "uiohook-napi";
import {
  KeyboardShortcutAction,
  LaunchAppAction,
  MultimediaAction,
  RunScriptAction,
  MacroAction,
  SwitchProfileAction,
  SwitchPageAction,
  MacroStep,
  Action,
} from "../../shared/types";
import type { Logger } from "../utils/Logger";

const execAsync = promisify(exec);

export class ActionExecutor {
  private logger: Logger;
  private isRecordingMacro = false;
  private recordedSteps: MacroStep[] = [];
  private recordingStartTime = 0;
  private executionLocks: Map<string, number> = new Map();

  onSwitchProfile: ((profileId: string) => Promise<void>) | null = null;
  onSwitchPage: ((pageIndex: number) => Promise<void>) | null = null;

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

  async executeAction(action: Action): Promise<void> {
    const debounceMs = this.getDebounceTime(action.type);
    const now = Date.now();
    const lastExec = this.executionLocks.get(action.id) || 0;

    if (now - lastExec < debounceMs) {
      this.logger.debug(`Debouncing action: ${action.type} - ${action.name}`);
      return;
    }

    this.executionLocks.set(action.id, now);

    try {
      switch (action.type) {
        case "keyboard-shortcut":
          await this.executeKeyboardShortcut(action as KeyboardShortcutAction);
          break;
        case "launch-app":
          await this.executeLaunchApp(action as LaunchAppAction);
          break;
        case "multimedia":
          await this.executeMultimedia(action as MultimediaAction);
          break;
        case "open-url":
          await this.executeOpenUrl(action);
          break;
        case "open-folder":
          await this.executeOpenFolder(action);
          break;
        case "run-script":
          await this.executeScript(action as RunScriptAction);
          break;
        case "macro":
          await this.executeMacro(action as MacroAction);
          break;
        case "switch-profile":
          if (this.onSwitchProfile) {
            await this.onSwitchProfile((action as SwitchProfileAction).profileId);
          } else {
            this.logger.warn("No onSwitchProfile handler registered");
          }
          break;
        case "switch-page":
          if (this.onSwitchPage) {
            await this.onSwitchPage((action as SwitchPageAction).pageIndex);
          } else {
            this.logger.warn("No onSwitchPage handler registered");
          }
          break;
        default:
          this.logger.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      this.logger.error(`Error executing action ${action.type}:`, error);
    }
  }

  private getDebounceTime(actionType: string): number {
    switch (actionType) {
      case "multimedia":
        return 200;
      case "keyboard-shortcut":
        return 300;
      case "launch-app":
      case "open-url":
      case "open-folder":
        return 500;
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

  private async executeKeyboardShortcut(
    action: KeyboardShortcutAction,
  ): Promise<void> {
    const keys = action.keys || [];
    if (keys.length === 0) {
      this.logger.warn("No keys provided for keyboard-shortcut action");
      return;
    }

    const modifiers = action.modifiers || [];
    const allKeys = [...modifiers, ...keys];
    const combo = allKeys.join("+");
    const isWayland = this.isWaylandSession();

    if (isWayland) {
      if (await this.isToolAvailable("ydotool")) {
        await this.executeYdotoolShortcut(combo);
      } else {
        this.logger.warn("ydotool not available for Wayland keyboard shortcut");
      }
    } else {
      if (await this.isToolAvailable("xdotool")) {
        await this.executeXdotoolShortcut(combo);
      } else if (await this.isToolAvailable("ydotool")) {
        await this.executeYdotoolShortcut(combo);
      } else {
        this.logger.error("Neither xdotool nor ydotool available");
      }
    }
  }

  private async executeXdotoolShortcut(combo: string): Promise<void> {
    const parts = combo.split("+");
    const key = parts.pop() || "";
    const modifiers = parts;

    let cmd = "xdotool key";
    for (const mod of modifiers) {
      cmd += ` ${mod}`;
    }
    cmd += ` ${key}`;

    this.logger.debug(`Executing xdotool: ${cmd}`);
    try {
      await execAsync(cmd);
    } catch (error) {
      this.logger.error("xdotool execution failed:", error);
    }
  }

  private async executeYdotoolShortcut(combo: string): Promise<void> {
    const parts = combo.split("+");
    const key = parts.pop() || "";
    const modifiers = parts;

    const modifierCodes: Record<string, number> = {
      ctrl: 29,
      alt: 56,
      shift: 42,
      super: 125,
    };

    let cmd = "ydotool key";
    for (const mod of modifiers) {
      const code = modifierCodes[mod.toLowerCase()];
      if (code) {
        cmd += ` ${code}:1`;
      }
    }

    const keyCode = await this.comboToYdotoolKeyCode(key);
    if (keyCode) {
      cmd += ` ${keyCode}:1 ${keyCode}:0`;
    }

    this.logger.debug(`Executing ydotool: ${cmd}`);
    try {
      await execAsync(cmd);
    } catch (error) {
      this.logger.error("ydotool execution failed:", error);
    }
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
      escape: "1",
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

  private async executeLaunchApp(action: LaunchAppAction): Promise<void> {
    const command = action.command;
    if (!command) {
      this.logger.warn("No command provided for launch-app action");
      return;
    }

    const args = action.args || [];
    const workingDirectory = action.workingDirectory;

    try {
      spawn(command, args, {
        detached: true,
        stdio: "ignore",
        cwd: workingDirectory || undefined,
      }).unref();
      this.logger.info(`Launched app: ${command}`);
    } catch (error) {
      this.logger.error(`Failed to launch app ${command}:`, error);
    }
  }

  private async executeMultimedia(action: MultimediaAction): Promise<void> {
    const mediaCommand = action.mediaCommand;
    if (!mediaCommand) {
      this.logger.warn("No media command provided");
      return;
    }

    if (await this.tryVolumeControl(mediaCommand)) return;
    if (await this.tryPlayerctl(mediaCommand)) return;
    if (await this.tryDbusSend(mediaCommand)) return;
    if (await this.tryXdotool(mediaCommand)) return;
    if (await this.tryYdotool(mediaCommand)) return;

    this.logger.warn(
      `No working multimedia control found for: ${mediaCommand}`,
    );
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

    if (!tool) return false;

    try {
      const cmd = volumeCommands[mediaCommand];
      await execAsync(`${tool} ${cmd.slice(1).join(" ")}`);
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
      return true;
    } catch {
      return false;
    }
  }

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

    const dbusCmd = `dbus-send --print-reply --dest=org.mpris.MediaPlayer2.Player /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.${method}`;

    try {
      await execAsync(dbusCmd);
      return true;
    } catch {
      return false;
    }
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

  private async executeOpenUrl(action: Action): Promise<void> {
    const url = (action as { url?: string }).url;
    if (!url) {
      this.logger.warn("No URL provided for open-url action");
      return;
    }

    const cmd = process.platform === "darwin" ? "open" : "xdg-open";

    try {
      spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref();
      this.logger.info(`Opened URL: ${url}`);
    } catch (error) {
      this.logger.error(`Failed to open URL ${url}:`, error);
    }
  }

  private async executeOpenFolder(action: Action): Promise<void> {
    const path = (action as { path?: string }).path;
    if (!path) {
      this.logger.warn("No path provided for open-folder action");
      return;
    }

    const cmd = process.platform === "darwin" ? "open" : "xdg-open";

    try {
      spawn(cmd, [path], { detached: true, stdio: "ignore" }).unref();
      this.logger.info(`Opened folder: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to open folder ${path}:`, error);
    }
  }

  private async executeScript(action: RunScriptAction): Promise<void> {
    const script = action.script;
    if (!script) {
      this.logger.warn("No script provided for run-script action");
      return;
    }

    const interpreter = action.scriptType || "shell";
    const cmd =
      interpreter === "python"
        ? "python3"
        : interpreter === "node"
          ? "node"
          : "bash";

    try {
      spawn(cmd, ["-c", script], {
        detached: true,
        stdio: "ignore",
      }).unref();
      this.logger.info(`Executed script with ${cmd}`);
    } catch (error) {
      this.logger.error(`Failed to execute script:`, error);
    }
  }

  private async executeMacro(action: MacroAction): Promise<void> {
    const steps = action.steps || [];
    if (steps.length === 0) {
      this.logger.warn("No steps in macro");
      return;
    }

    for (const step of steps) {
      await this.executeMacroStep(step);
      if (step.duration) {
        await this.delay(step.duration);
      }
    }
  }

  private async executeMacroStep(step: MacroStep): Promise<void> {
    switch (step.type) {
      case "key":
        if (step.value) {
          const keys = this.sanitizeShortcutInput(step.value);
          if (process.platform === "darwin") {
            await execAsync(
              `osascript -e 'tell application "System Events" to keystroke "${keys.join("")}"'`,
            );
          } else if (this.isWaylandSession()) {
            await this.executeYdotoolShortcut(keys.join("+"));
          } else {
            await this.executeXdotoolShortcut(keys.join("+"));
          }
        }
        break;
      case "text":
        if (step.value) {
          if (process.platform === "darwin") {
            await execAsync(
              `osascript -e 'tell application "System Events" to keystroke "${step.value}"'`,
            );
          } else {
            await execAsync(`xdotool type --clearmodifiers "${step.value}"`);
          }
        }
        break;
      case "delay":
        await this.delay(step.duration || 100);
        break;
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
