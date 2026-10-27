// ============================================================================
// FocusWatcher — tracks the focused window's app class for profile
// auto-switching.
//
// KDE Wayland (primary): a persistent KWin script prints every window
// activation ("BIGDECK_FOCUS:<class>|<name>|<caption>") to the session
// journal; we follow the journal with `journalctl --user -f` and parse it.
// This avoids KWin's missing virtual-keyboard-style APIs entirely — qdbus6
// is the only requirement (present on every KDE install).
//
// X11 fallback: `xdotool getactivewindow getwindowclassname` polled every
// 2s when xdotool exists and the session is X11.
//
// Events: "focus" -> { appClass, title }
// ============================================================================

import { execFile, spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import fs from "fs";
import os from "os";
import path from "path";
import type { Logger } from "../utils/Logger";

const KWIN_SCRIPT_DIR = path.join(
  os.homedir(),
  ".local/share/bigdeck/kwin",
);
const KWIN_SCRIPT_PATH = path.join(KWIN_SCRIPT_DIR, "focus-watch.js");
const KWIN_SCRIPT_NAME = "bigdeckFocusWatch";
const JOURNAL_MARK = "BIGDECK_FOCUS:";

const KWIN_FOCUS_WATCH_JS = `
function emit(w) {
    if (!w || !w.resourceClass) return;
    print("${JOURNAL_MARK}" + w.resourceClass + "|" + (w.resourceName || "") + "|" + (w.caption || ""));
}
workspace.windowList().forEach(emit);
workspace.windowActivated.connect(emit);
`;

export interface FocusEvent {
  appClass: string;
  title: string;
}

export type FocusSource = "kwin-journal" | "xdotool" | "none";

export class FocusWatcher extends EventEmitter {
  private journal: ChildProcess | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private stopped = true;
  private source: FocusSource = "none";
  private lastEmitted = "";

  constructor(private logger: Logger) {
    super();
  }

  getSource(): FocusSource {
    return this.source;
  }

  /** Install/refresh the KWin watcher script and load it into the session. */
  private async setupKWinScript(): Promise<boolean> {
    try {
      fs.mkdirSync(KWIN_SCRIPT_DIR, { recursive: true });
      fs.writeFileSync(KWIN_SCRIPT_PATH, KWIN_FOCUS_WATCH_JS);
    } catch (error) {
      this.logger.warn("FocusWatcher: cannot write KWin script:", error);
      return false;
    }

    const qdbus = async (args: string[]): Promise<string> => {
      const exe = await new Promise<string>((resolve) => {
        fs.access("/usr/bin/qdbus6", fs.constants.F_OK, (err) =>
          resolve(err ? "qdbus" : "qdbus6"),
        );
      });
      return new Promise((resolve, reject) => {
        execFile(exe, args, { timeout: 5000 }, (err, stdout) =>
          err ? reject(err) : resolve(String(stdout)),
        );
      });
    };

    try {
      // Plasma 6 KWin: loadScript(QString filePath) — single arg. Returns the
      // script id, or -1 when a script with that name is already loaded (then
      // the existing one keeps running — which is exactly what we want).
      const result = (
        await qdbus([
          "org.kde.KWin",
          "/Scripting",
          "org.kde.kwin.Scripting",
          "unloadScript",
          KWIN_SCRIPT_NAME,
        ]).catch(() => "")
      ).trim();
      void result;
      const loadResult = (
        await qdbus([
          "org.kde.KWin",
          "/Scripting",
          "org.kde.kwin.Scripting",
          "loadScript",
          KWIN_SCRIPT_PATH,
        ]).catch(() => "")
      ).trim();
      if (loadResult === "-1") {
        this.logger.warn(
          "FocusWatcher: KWin rejected the focus-watch script load.",
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn("FocusWatcher: KWin script load failed:", error);
      return false;
    }
  }

  private isWayland(): boolean {
    return (
      process.env.XDG_SESSION_TYPE === "wayland" ||
      !!process.env.WAYLAND_DISPLAY
    );
  }

  /**
   * Start watching. KDE Wayland uses the journal-follow source; X11 uses a
   * 2s xdotool poll. Resolves once a source is chosen (or 'none').
   */
  async start(): Promise<FocusSource> {
    if (!this.stopped) return this.source;

    if (this.isWayland()) {
      if (await this.setupKWinScript()) {
        this.startJournalFollow();
        this.source = "kwin-journal";
      }
    }

    if (this.source === "none" && !this.isWayland()) {
      this.startXdotoolPoll();
      this.source = "xdotool";
    }

    this.stopped = false;
    if (this.source === "none") {
      this.logger.warn(
        "FocusWatcher: no focus source available (install kdotool/xdotool or run on KDE Wayland).",
      );
    }
    return this.source;
  }

  private startJournalFollow(): void {
    const child = spawn(
      "journalctl",
      ["--user", "-f", "--output", "cat", "-u", "plasma-kwin_wayland.service"],
      { stdio: ["ignore", "pipe", "ignore"] },
    );
    this.journal = child;
    child.stdout.on("data", (chunk) => {
      for (const line of String(chunk).split("\n")) {
        const idx = line.indexOf(JOURNAL_MARK);
        if (idx === -1) continue;
        const payload = line.slice(idx + JOURNAL_MARK.length);
        const [appClass = "", name = "", caption = ""] = payload.split("|");
        this.emitFocus(appClass, name || caption);
      }
    });
    child.on("exit", () => {
      if (!this.stopped) {
        this.logger.warn("FocusWatcher: journal follower exited");
      }
      if (this.journal === child) this.journal = null;
    });
  }

  private startXdotoolPoll(): void {
    const poll = () => {
      if (this.stopped) return;
      execFile(
        "xdotool",
        ["getactivewindow", "getwindowclassname"],
        { timeout: 3000 },
        (err, stdout) => {
          if (!err) this.emitFocus(String(stdout).trim(), "");
        },
      );
    };
    poll();
    this.pollTimer = setInterval(poll, 2000);
  }

  private emitFocus(appClass: string, title: string): void {
    if (!appClass) return;
    const key = `${appClass}|${title}`;
    if (key === this.lastEmitted) return; // debounce duplicates
    this.lastEmitted = key;
    this.emit("focus", { appClass, title } as FocusEvent);
  }

  stop(): void {
    this.stopped = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    if (this.journal) {
      this.journal.kill();
      this.journal = null;
    }
    this.source = "none";
  }
}
