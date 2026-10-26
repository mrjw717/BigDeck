// ============================================================================
// UinputInjector — native keyboard injection via the kernel uinput interface
//
// WHY: KDE and GNOME Wayland reject virtual-keyboard clients (wtype dies
// with "Compositor does not support the virtual keyboard protocol"), and
// ydotool needs a daemon + input-group membership. uinput is what ydotool
// uses under the hood — with BigDeck's udev rule (KERNEL=="uinput",
// TAG+="uaccess") the app can do it directly: no external tools, no daemon,
// no groups, works identically on X11 and every Wayland compositor.
//
// DESIGN: /dev/uinput requires ioctls (UI_SET_KEYBIT / UI_DEV_CREATE) that
// Node cannot issue natively. A tiny persistent Python helper does the
// setup and holds the fd; the main process speaks one-JSON-per-line over
// stdin. python3 is effectively universal on desktop Linux; when it or
// /dev/uinput is missing the injector reports unavailable and the caller
// falls back to ydotool → wtype → xdotool.
//
// The helper enables key codes 1..248 once at startup, so no reconfiguration
// is needed per combo. Events are written immediately after reads on stdin;
// EV_SYN follows every EV_KEY.
// ============================================================================

import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import type { Logger } from "../utils/Logger";

/** evdev key codes for the shortcut names BigDeck supports. */
export const EVDEV_KEY_CODES: Record<string, number> = {
  // letters
  a: 30, b: 48, c: 46, d: 32, e: 18, f: 33, g: 34, h: 35, i: 23, j: 36,
  k: 37, l: 38, m: 50, n: 49, o: 24, p: 25, q: 16, r: 19, s: 31, t: 20,
  u: 22, v: 47, w: 17, x: 45, y: 21, z: 44,
  // digits
  "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8, "8": 9, "9": 10,
  "0": 11,
  // modifiers
  ctrl: 29, control: 29, shift: 42, alt: 56, super: 125, meta: 125,
  // specials (accept the xdotool-style names ActionExecutor produces)
  space: 57, return: 28, enter: 28, escape: 1, esc: 1, tab: 15,
  backspace: 14, delete: 111, deletechar: 111, home: 102, end: 107,
  pageup: 104, pagedown: 109, up: 103, right: 106, down: 108, left: 105,
  print: 99, insert: 110,
  f1: 59, f2: 60, f3: 61, f4: 62, f5: 63, f6: 64, f7: 65, f8: 66, f9: 67,
  f10: 68, f11: 87, f12: 88,
  // punctuation (shifted-name variants included)
  minus: 12, equal: 13, bracketleft: 26, bracketright: 27, backslash: 43,
  semicolon: 39, apostrophe: 40, grave: 41, comma: 51, period: 52,
  slash: 53,
  "-": 12, "=": 13, "[": 26, "]": 27, "\\": 43, ";": 39, "'": 40,
  "`": 41, ",": 51, ".": 52, "/": 53,
};

/**
 * The persistent helper: configures /dev/uinput (all key codes), then
 * forwards {"type":"key","code":N,"value":0|1|2} lines from stdin to the
 * kernel as EV_KEY + EV_SYN. Prints "ready" on stdout when the device is
 * up; exits cleanly on the "close" line.
 */
export const UINPUT_HELPER_PY = `
import sys, os, time, struct, fcntl, json

UINPUT = "/dev/uinput"
EV_SYN, EV_KEY = 0x00, 0x01
UI_SET_EVBIT = 0x40045564
UI_SET_KEYBIT = 0x40045565
UI_DEV_CREATE = 0x5501
UI_DEV_DESTROY = 0x5502

fd = os.open(UINPUT, os.O_WRONLY | os.O_NONBLOCK)
for code in range(1, 249):
    fcntl.ioctl(fd, UI_SET_KEYBIT, code)
fcntl.ioctl(fd, UI_SET_EVBIT, EV_KEY)
fcntl.ioctl(fd, UI_DEV_CREATE)
print("ready", flush=True)

def emit(etype, code, value):
    t = time.time()
    sec, usec = int(t), int((t - int(t)) * 1_000_000)
    os.write(fd, struct.pack("llHHi", sec, usec, etype, code, value))
    os.write(fd, struct.pack("llHHi", sec, usec, EV_SYN, 0, 0))

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    if line == "close":
        fcntl.ioctl(fd, UI_DEV_DESTROY)
        break
    try:
        msg = json.loads(line)
    except Exception:
        continue
    if msg.get("type") == "key":
        emit(EV_KEY, int(msg["code"]), int(msg["value"]))
        emit(EV_SYN, 0, 0)
`.trim();

export interface UinputCombo {
  /** Key codes held down before the main key (modifiers). */
  down: number[];
  /** The main key's code. */
  press: number;
  /** Release order: main key first, then modifiers (LIFO). */
  up: number[];
}

export class UinputInjector {
  private child: ChildProcessWithoutNullStreams | null = null;
  private ready = false;
  private starting: Promise<boolean> | null = null;
  private buffer = "";

  constructor(private logger: Logger) {}

  /** Cheap precondition checks (no side effects). Requires WRITE access —
   * existence alone is not enough (uinput is root:input 0660 by default). */
  static isEnvironmentCapable(): boolean {
    try {
      fs.accessSync("/dev/uinput", fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure the helper is running and ready. Safe to call repeatedly —
   * concurrent callers share one start attempt; a dead helper restarts.
   */
  async ensureStarted(): Promise<boolean> {
    if (this.ready && this.child) return true;
    if (this.starting) return this.starting;
    this.starting = this.start().finally(() => (this.starting = null));
    return this.starting;
  }

  private async start(): Promise<boolean> {
    if (!UinputInjector.isEnvironmentCapable()) {
      this.logger.debug(
        "uinput injection unavailable: /dev/uinput is not accessible (install BigDeck's udev rules).",
      );
      return false;
    }
    try {
      const child = spawn("python3", ["-c", UINPUT_HELPER_PY], {
        stdio: ["pipe", "pipe", "pipe"],
      });
      this.child = child;
      child.on("error", (err) => {
        this.logger.error("uinput helper failed to spawn:", err);
        this.ready = false;
      });
      child.on("exit", (code) => {
        this.logger.warn(`uinput helper exited (code ${code})`);
        this.ready = false;
        this.child = null;
      });
      child.stderr.on("data", (d) =>
        this.logger.warn(`uinput helper stderr: ${String(d).trim()}`),
      );

      const ok = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 4000);
        child.stdout.on("data", (chunk) => {
          this.buffer += String(chunk);
          if (this.buffer.includes("ready")) {
            clearTimeout(timer);
            resolve(true);
          }
        });
        child.on("exit", () => {
          clearTimeout(timer);
          resolve(false);
        });
      });
      this.buffer = "";
      if (!ok) {
        this.logger.error("uinput helper did not report ready in time.");
        this.stop();
        return false;
      }
      this.ready = true;
      this.logger.info("uinput injection ready (native, no external tools).");
      return true;
    } catch (error) {
      this.logger.error("Failed to start uinput helper:", error);
      return false;
    }
  }

  /** True when the combo's key names all map to evdev codes. */
  static mapCombo(names: string[]): UinputCombo | null {
    if (names.length === 0) return null;
    // Convention (matches ydotool/xdotool parsing): the LAST token is the
    // main key; everything before it are modifiers held down first.
    const down: number[] = [];
    for (const name of names.slice(0, -1)) {
      const code = EVDEV_KEY_CODES[name.toLowerCase()];
      if (code === undefined) return null;
      down.push(code);
    }
    const press =
      EVDEV_KEY_CODES[names[names.length - 1].toLowerCase()] ?? -1;
    if (press === -1) return null;
    // Up order: main key first, then modifiers LIFO.
    const up = [press, ...[...down].reverse()];
    return { down, press, up };
  }

  /**
   * Send one combo (down modifiers → press → release, EV_SYN after each
   * event). Starts the helper on first use. Returns false (and lets the
   * caller fall back) if anything is unavailable or the helper has died.
   */
  async sendCombo(combo: UinputCombo): Promise<boolean> {
    if (!(await this.ensureStarted()) || !this.child || !this.ready) {
      return false;
    }
    try {
      const send = (code: number, value: number) =>
        this.child!.stdin.write(
          JSON.stringify({ type: "key", code, value }) + "\n",
        );
      for (const code of combo.down) send(code, 1);
      send(combo.press, 1);
      send(combo.press, 0);
      for (const code of combo.up) {
        if (code !== combo.press) send(code, 0);
      }
      return true;
    } catch (error) {
      // EPIPE means the helper died — drop readiness; caller falls back.
      this.ready = false;
      this.logger.error("uinput combo failed:", error);
      return false;
    }
  }

  stop(): void {
    if (this.child) {
      try {
        this.child.stdin.write("close\n");
      } catch {
        // best effort
      }
      this.child.kill();
      this.child = null;
    }
    this.ready = false;
  }
}
