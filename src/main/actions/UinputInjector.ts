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

# Legacy uinput setup: the kernel requires a struct uinput_user_dev WRITE
# (80-byte name + bus/vendor/product/version + ff_effects_max + 4 abs
# arrays) before UI_DEV_CREATE — without it the device never reaches
# UIST_SETUP_COMPLETE and DEV_CREATE fails with EINVAL.
name = b"BigDeck Virtual Keyboard"
setup = name.ljust(80, b"\\x00")
setup += struct.pack("HHHH", 0x06, 0x0001, 0x0001, 0x0001)  # BUS_VIRTUAL
setup += struct.pack("i", 0)                                # ff_effects_max
setup += b"\\x00" * (64 * 4 * 4)                             # abs arrays
os.write(fd, setup)

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

/** US-layout printable ASCII -> [evdev keycode, needsShift]. */
export const CHAR_KEYS: Record<string, [number, boolean]> = {
  " ": [57, false],
  "\n": [28, false],
  a: [30, false], b: [48, false], c: [46, false], d: [32, false], e: [18, false],
  f: [33, false], g: [34, false], h: [35, false], i: [23, false], j: [36, false],
  k: [37, false], l: [38, false], m: [50, false], n: [49, false], o: [24, false],
  p: [25, false], q: [16, false], r: [19, false], s: [31, false], t: [20, false],
  u: [22, false], v: [47, false], w: [17, false], x: [45, false], y: [21, false],
  z: [44, false],
  "1": [2, false], "2": [3, false], "3": [4, false], "4": [5, false],
  "5": [6, false], "6": [7, false], "7": [8, false], "8": [9, false],
  "9": [10, false], "0": [11, false],
  "-": [12, false], "=": [13, false], "[": [26, false], "]": [27, false],
  ";": [39, false], "'": [40, false], ",": [51, false], ".": [52, false],
  "/": [53, false], "\\": [43, false], "`": [41, false],
  "!": [2, true], "@": [3, true], "#": [4, true], "$": [5, true],
  "%": [6, true], "^": [7, true], "&": [8, true], "*": [9, true],
  "(": [10, true], ")": [11, true], "_": [12, true], "+": [13, true],
  "{": [26, true], "}": [27, true], "|": [43, true], ":": [39, true],
  '"': [40, true], "<": [51, true], ">": [52, true], "?": [53, true],
  "~": [41, true],
  A: [30, true], B: [48, true], C: [46, true], D: [32, true], E: [18, true],
  F: [33, true], G: [34, true], H: [35, true], I: [23, true], J: [36, true],
  K: [37, true], L: [38, true], M: [50, true], N: [49, true], O: [24, true],
  P: [25, true], Q: [16, true], R: [19, true], S: [31, true], T: [20, true],
  U: [22, true], V: [47, true], W: [17, true], X: [45, true], Y: [21, true],
  Z: [44, true],
};

export interface UinputCombo {
  down: number[];
  press: number;
  up: number[];
}

export class UinputInjector {
  private child: ChildProcessWithoutNullStreams | null = null;
  private ready = false;
  private starting: Promise<boolean> | null = null;
  private buffer = "";

  constructor(private logger: Logger) {}

  /** Whether the helper process is up and accepting events (diagnostics). */
  get isReady(): boolean {
    return this.ready;
  }

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
   * Type literal text character-by-character (US layout). Unknown characters
   * are skipped with a warning; returns false only when the helper is not
   * running (caller falls back to wtype/ydotool/xdotool).
   */
  async sendText(text: string): Promise<boolean> {
    if (!(await this.ensureStarted()) || !this.child || !this.ready) {
      return false;
    }
    try {
      const send = (code: number, value: number) =>
        this.child!.stdin.write(
          JSON.stringify({ type: "key", code, value }) + "\n",
        );
      for (const ch of text) {
        const mapped = CHAR_KEYS[ch];
        if (!mapped) {
          this.logger.warn(
            `uinput text: no key mapping for ${JSON.stringify(ch)} — skipped`,
          );
          continue;
        }
        const [code, needsShift] = mapped;
        if (needsShift) send(42, 1); // left shift down
        send(code, 1);
        send(code, 0);
        if (needsShift) send(42, 0); // left shift up
      }
      return true;
    } catch (error) {
      this.ready = false;
      this.logger.error("uinput text typing failed:", error);
      return false;
    }
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
