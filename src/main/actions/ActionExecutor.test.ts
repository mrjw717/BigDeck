// ============================================================================
// ActionExecutor — Linux action execution tests
//
// Guards the "hardware press does nothing" regression from the Wayland
// hardware test: keyboard-shortcut actions used to die silently when no
// injection tool was installed, launch-app lost spawn errors, and MPRIS
// commands targeted a bus name no player owns. Each test pins one backend
// decision of the executor with all system tools mocked.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// child_process is fully mocked: `which` probes drive tool availability,
// execFile carries the actual ydotool/wtype invocations under test.
const cp = vi.hoisted(() => ({
  exec: vi.fn(),
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("child_process", () => ({
  exec: cp.exec,
  execFile: cp.execFile,
  spawn: cp.spawn,
}));

// uiohook-napi loads a native addon — stub it out for unit tests.
vi.mock("uiohook-napi", () => ({
  uIOhook: { on: vi.fn(), start: vi.fn() },
}));

// "fs" (sync) backs UinputInjector's /dev/uinput capability check — force it
// to report no write access so tests never spawn the real python3 helper.
vi.mock("fs", () => ({
  default: {
    accessSync: vi.fn(() => {
      throw new Error("EACCES (mocked)");
    }),
    constants: { W_OK: 2 },
  },
  accessSync: vi.fn(() => {
    throw new Error("EACCES (mocked)");
  }),
  constants: { W_OK: 2 },
}));

// fs/promises backs launch-app path checks and .desktop discovery.
const fsMocks = vi.hoisted(() => ({
  access: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  access: fsMocks.access,
  constants: { F_OK: 0, W_OK: 2, X_OK: 1 },
}));

import { ActionExecutor } from "./ActionExecutor";
import { UinputInjector } from "./UinputInjector";
import { formatClockTime } from "./ActionExecutor";
import type { ActionTickService } from "./ActionTickService";
import type { Logger } from "../utils/Logger";
import type { Action } from "../../shared/types";

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as Logger;

/**
 * Structural stand-in for the tick registry: records registrations so
 * timer/clock tests can drive the render closures directly. Cast through
 * unknown (ActionTickService has private state, making it nominally typed).
 */
function makeFakeTickService() {
  const entries = new Map<string, any>();
  const registered: any[] = [];
  const unregistered: Array<{ keyId: string; restore: boolean }> = [];
  const fake = {
    register: (entry: any) => {
      entries.set(entry.keyId, entry);
      registered.push(entry);
    },
    unregister: async (keyId: string, restore = true) => {
      entries.delete(keyId);
      unregistered.push({ keyId, restore });
    },
    has: (keyId: string) => entries.has(keyId),
    kindOf: (keyId: string) => entries.get(keyId)?.kind,
    listKeys: () =>
      [...entries.values()].map(({ keyId, deviceId, keyIndex, kind }) => ({
        keyId,
        deviceId,
        keyIndex,
        kind,
      })),
    stop: () => entries.clear(),
  };
  return {
    fake,
    registered,
    unregistered,
    service: fake as unknown as ActionTickService,
  };
}

/** Stub the `which <tool>` probes; any other shell command rejects. */
function mockWhich(tools: string[]): void {
  cp.exec.mockImplementation(
    (cmd: string, cb: (err: unknown, out?: { stdout: string }) => void) => {
      if (cmd.startsWith("which ")) {
        const tool = cmd.slice("which ".length).trim();
        if (tools.includes(tool)) {
          cb(null, { stdout: `/usr/bin/${tool}\n` });
        } else {
          cb(new Error(`not found: ${tool}`));
        }
        return;
      }
      cb(new Error(`unhandled exec command in test: ${cmd}`));
    },
  );
}

/** Answer a specific shell command with stdout (e.g. gdbus ListNames). */
function mockCommand(prefix: string, stdout: string): void {
  const prev = cp.exec.getMockImplementation();
  cp.exec.mockImplementation(
    (cmd: string, cb: (err: unknown, out?: { stdout: string }) => void) => {
      if (cmd.startsWith(prefix)) {
        cb(null, { stdout });
        return;
      }
      (prev as NonNullable<typeof prev>)(cmd, cb);
    },
  );
}

function spawnStub() {
  return { on: vi.fn(), unref: vi.fn() };
}

function makeAction(partial: Partial<Action> & { type: Action["type"] }): Action {
  return {
    id: `action-${Math.random().toString(36).slice(2)}`,
    name: "Test Action",
    ...partial,
  } as Action;
}

describe("ActionExecutor", () => {
  let executor: ActionExecutor;

  beforeEach(() => {
    executor = new ActionExecutor(logger);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("keyboard-shortcut (Wayland)", () => {
    beforeEach(() => {
      vi.stubEnv("WAYLAND_DISPLAY", "wayland-0");
      vi.stubEnv("XDG_SESSION_TYPE", "wayland");
    });

    it("fails loudly with an install hint when no injection tool exists", async () => {
      mockWhich([]);

      await executor.executeAction(
        makeAction({ type: "keyboard-shortcut", keys: ["a"], modifiers: ["ctrl"] }),
      );

      expect(cp.execFile).not.toHaveBeenCalled();
      expect(cp.spawn).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("neither ydotool nor wtype is installed"),
      );
      // The summary line names the action type so hardware tests are
      // diagnosable from bigdeck.log alone.
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: keyboard-shortcut"),
      );
    });

    it("sends modifier+key codes through ydotool when available", async () => {
      mockWhich(["ydotool"]);
      // promisify(execFile) appends a nodeback — respond through it.
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown, out?: { stdout: string }) => void)
          | undefined;
        cb?.(null, { stdout: "" });
      });

      await executor.executeAction(
        makeAction({ type: "keyboard-shortcut", keys: ["a"], modifiers: ["ctrl"] }),
      );

      // ctrl down (29), a tap (30), ctrl up (29) — promisify(execFile)
      // appends the nodeback as a trailing argument.
      expect(cp.execFile).toHaveBeenCalledWith(
        "ydotool",
        ["key", "29:1", "30:1", "30:0", "29:0"],
        expect.any(Function),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: keyboard-shortcut"),
      );
    });

    it("falls back to wtype when ydotool is not installed", async () => {
      mockWhich(["wtype"]);
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown, out?: { stdout: string }) => void)
          | undefined;
        cb?.(null, { stdout: "" });
      });

      await executor.executeAction(
        makeAction({ type: "keyboard-shortcut", keys: ["a"], modifiers: ["ctrl"] }),
      );

      expect(cp.execFile).toHaveBeenCalledWith(
        "wtype",
        ["-M", "ctrl", "-P", "a", "-p", "a", "-m", "ctrl"],
        expect.any(Function),
      );
    });

    it("falls back to wtype when ydotool is installed but FAILS (daemon down)", async () => {
      // Regression: ydotool present-but-broken used to `return false`
      // immediately, so wtype never got its turn (2026-10-25 hardware test).
      mockWhich(["ydotool", "wtype"]);
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const tool = callArgs[0];
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown, out?: { stdout: string }) => void)
          | undefined;
        if (tool === "ydotool") {
          // Daemon not running: ydotool client exits non-zero.
          cb?.(new Error("failed to connect to socket"), { stdout: "" });
        } else {
          cb?.(null, { stdout: "" });
        }
      });

      await executor.executeAction(
        makeAction({ type: "keyboard-shortcut", keys: ["a"], modifiers: ["ctrl"] }),
      );

      // The failed ydotool attempt...
      expect(cp.execFile).toHaveBeenCalledWith(
        "ydotool",
        expect.any(Array),
        expect.any(Function),
      );
      // ...must be followed by the wtype attempt.
      expect(cp.execFile).toHaveBeenCalledWith(
        "wtype",
        ["-M", "ctrl", "-P", "a", "-p", "a", "-m", "ctrl"],
        expect.any(Function),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: keyboard-shortcut"),
      );
    });
  });

  describe("keyboard-shortcut (X11)", () => {
    beforeEach(() => {
      vi.stubEnv("WAYLAND_DISPLAY", "");
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
    });

    it("uses xdotool with the + separated combo syntax", async () => {
      mockWhich(["xdotool"]);
      cp.exec.mockImplementation(
        (cmd: string, cb: (err: unknown, out?: { stdout: string }) => void) => {
          if (cmd.startsWith("which ")) {
            cb(null, { stdout: "/usr/bin/xdotool\n" });
            return;
          }
          expect(cmd).toBe("xdotool key ctrl+a");
          cb(null, { stdout: "" });
        },
      );

      await executor.executeAction(
        makeAction({ type: "keyboard-shortcut", keys: ["a"], modifiers: ["ctrl"] }),
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: keyboard-shortcut"),
      );
    });
  });

  describe("launch-app", () => {
    beforeEach(() => {
      // Force the X11 branch out of the picture — launch-app is session
      // independent (plain child process).
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
    });

    it("spawns a PATH-resolved command with args, detached", async () => {
      mockWhich(["firefox"]);
      const stub = spawnStub();
      cp.spawn.mockReturnValue(stub);

      await executor.executeAction(
        makeAction({
          type: "launch-app",
          command: "firefox",
          args: ["--new-window"],
        }),
      );

      expect(cp.spawn).toHaveBeenCalledWith(
        "firefox",
        ["--new-window"],
        expect.objectContaining({ detached: true }),
      );
      expect(stub.unref).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: launch-app"),
      );
    });

    it("falls back to gtk-launch when only a desktop entry exists", async () => {
      mockWhich(["gtk-launch"]); // "steam" itself is NOT on PATH
      cp.spawn.mockReturnValue(spawnStub());
      // Only the system applications dir has the entry.
      fsMocks.access.mockImplementation(
        (p: string) =>
          p === "/usr/share/applications/steam.desktop"
            ? Promise.resolve()
            : Promise.reject(new Error("ENOENT")),
      );

      await executor.executeAction(
        makeAction({ type: "launch-app", command: "steam" }),
      );

      expect(cp.spawn).toHaveBeenCalledWith(
        "gtk-launch",
        ["steam.desktop"],
        expect.objectContaining({ detached: true }),
      );
    });

    it("reports a clear failure when nothing can resolve the command", async () => {
      mockWhich([]);
      fsMocks.access.mockRejectedValue(new Error("ENOENT"));

      await executor.executeAction(
        makeAction({ type: "launch-app", command: "definitely-not-installed" }),
      );

      expect(cp.spawn).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Cannot launch app \"definitely-not-installed\""),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: launch-app"),
      );
    });
  });

  describe("open-url", () => {
    it("opens through xdg-open on Linux", async () => {
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
      mockWhich(["xdg-open"]);
      cp.spawn.mockReturnValue(spawnStub());

      await executor.executeAction(
        makeAction({ type: "open-url", url: "https://example.com" }),
      );

      expect(cp.spawn).toHaveBeenCalledWith(
        "xdg-open",
        ["https://example.com"],
        expect.objectContaining({ detached: true }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: open-url"),
      );
    });
  });

  describe("multimedia", () => {
    beforeEach(() => {
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
    });

    it("sends MPRIS commands to a discovered player bus via dbus-send", async () => {
      // No playerctl, no xdotool/ydotool — the D-Bus path must carry it.
      mockWhich(["dbus-send", "gdbus"]);
      // gdbus ListNames answer with a running VLC instance.
      mockCommand(
        "gdbus call",
        "(['org.freedesktop.DBus', 'org.mpris.MediaPlayer2.vlc', 'org.gnome.Shell'],)",
      );
      // dbus-send goes through execAsync too — let it succeed.
      const prev = cp.exec.getMockImplementation();
      cp.exec.mockImplementation(
        (cmd: string, cb: (err: unknown, out?: { stdout: string }) => void) => {
          if (cmd.startsWith("dbus-send")) {
            cb(null, { stdout: "" });
            return;
          }
          (prev as NonNullable<typeof prev>)(cmd, cb);
        },
      );

      await executor.executeAction(
        makeAction({ type: "multimedia", mediaCommand: "play-pause" }),
      );

      expect(cp.exec).toHaveBeenCalledWith(
        expect.stringContaining(
          "--dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.PlayPause",
        ),
        expect.any(Function),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Media control via MPRIS (org.mpris.MediaPlayer2.vlc)"),
      );
    });

    it("fails with an install hint when no multimedia backend works", async () => {
      mockWhich([]);
      // gdbus itself missing → no players discoverable.
      cp.exec.mockImplementation(
        (cmd: string, cb: (err: unknown) => void) => cb(new Error("missing")),
      );

      await executor.executeAction(
        makeAction({ type: "multimedia", mediaCommand: "play-pause" }),
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("No working multimedia control found"),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: multimedia"),
      );
    });
  });

  describe("macro (Wayland text typing)", () => {
    it("does NOT use xdotool for text steps on Wayland", async () => {
      vi.stubEnv("WAYLAND_DISPLAY", "wayland-0");
      vi.stubEnv("XDG_SESSION_TYPE", "wayland");
      mockWhich([]); // no wtype, no ydotool, no xdotool

      await executor.executeAction(
        makeAction({
          type: "macro",
          steps: [{ type: "text", value: "hello" }],
        }),
      );

      // Regression: the old code shelled out to xdotool (X11-only) even on
      // Wayland. Now the Wayland branch requires wtype/ydotool and says so.
      expect(cp.exec).not.toHaveBeenCalledWith(
        expect.stringContaining("xdotool type"),
        expect.any(Function),
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("neither wtype nor ydotool is installed"),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: macro"),
      );
    });
  });

  describe("system-sleep", () => {
    it("runs systemctl suspend when available", async () => {
      mockWhich(["systemctl"]);
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown, out?: { stdout: string }) => void)
          | undefined;
        cb?.(null, { stdout: "" });
      });

      await executor.executeAction(makeAction({ type: "system-sleep" }));

      expect(cp.execFile).toHaveBeenCalledWith(
        "systemctl",
        ["suspend"],
        expect.any(Function),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: system-sleep"),
      );
    });

    it("fails with guidance when systemctl is missing", async () => {
      mockWhich([]);

      await executor.executeAction(makeAction({ type: "system-sleep" }));

      expect(cp.execFile).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("systemctl is not available"),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: system-sleep"),
      );
    });

    it("surfaces a suspend failure (polkit/sleep-target) as a failed action", async () => {
      mockWhich(["systemctl"]);
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown) => void)
          | undefined;
        cb?.(new Error("Operation not permitted"));
      });

      await executor.executeAction(makeAction({ type: "system-sleep" }));

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("systemctl suspend failed"),
        expect.any(Error),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: system-sleep"),
      );
    });
  });

  describe("close-app (X11)", () => {
    beforeEach(() => {
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
    });

    it("closes every wmctrl window whose title matches the target", async () => {
      const closed: string[] = [];
      cp.exec.mockImplementation(
        (cmd: string, cb: (err: unknown, out?: { stdout: string }) => void) => {
          if (cmd === "which wmctrl") {
            cb(null, { stdout: "/usr/bin/wmctrl\n" });
            return;
          }
          if (cmd === "wmctrl -l") {
            cb(null, {
              stdout:
                "0x01 0 host Firefox\n" +
                "0x02 0 host Some Firefox prefs\n" +
                "0x03 0 host Terminal",
            });
            return;
          }
          if (cmd.startsWith("wmctrl -ic ")) {
            closed.push(cmd.slice("wmctrl -ic ".length));
            cb(null, { stdout: "" });
            return;
          }
          cb(new Error(`not found / unhandled: ${cmd}`));
        },
      );

      await executor.executeAction(
        makeAction({ type: "close-app", target: "firefox" }),
      );

      expect(closed.sort()).toEqual(["0x01", "0x02"]);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Closed 2 window(s) matching "firefox"'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: close-app"),
      );
    });

    it("falls back to pkill SIGTERM when no window title matches", async () => {
      mockWhich(["wmctrl", "pkill"]);
      // wmctrl -l answers through the which-aware mock; pkill goes via execFile.
      mockCommand("wmctrl -l", "0x01 0 host Terminal");
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown, out?: { stdout: string }) => void)
          | undefined;
        cb?.(null, { stdout: "" });
      });

      await executor.executeAction(
        makeAction({ type: "close-app", target: "code" }),
      );

      expect(cp.execFile).toHaveBeenCalledWith(
        "pkill",
        ["-TERM", "-x", "code"],
        expect.any(Function),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Sent SIGTERM to process "code"'),
      );
    });
  });

  describe("close-app (Wayland)", () => {
    beforeEach(() => {
      vi.stubEnv("WAYLAND_DISPLAY", "wayland-0");
      vi.stubEnv("XDG_SESSION_TYPE", "wayland");
    });

    it("skips the X11 wmctrl path and signals the process directly", async () => {
      mockWhich(["pkill"]);
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown, out?: { stdout: string }) => void)
          | undefined;
        cb?.(null, { stdout: "" });
      });

      await executor.executeAction(
        makeAction({ type: "close-app", target: "firefox" }),
      );

      expect(cp.exec).not.toHaveBeenCalledWith("wmctrl -l", expect.anything());
      expect(cp.execFile).toHaveBeenCalledWith(
        "pkill",
        ["-TERM", "-x", "firefox"],
        expect.any(Function),
      );
    });

    it("reports a truthful failure when pkill matches nothing", async () => {
      mockWhich(["pkill"]);
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown) => void)
          | undefined;
        cb?.(new Error("no process matched"));
      });

      await executor.executeAction(
        makeAction({ type: "close-app", target: "ghost" }),
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No running process named "ghost"'),
        expect.anything(),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: close-app"),
      );
    });

    it("fails with install hints when neither wmctrl nor pkill exists", async () => {
      mockWhich([]);

      await executor.executeAction(
        makeAction({ type: "close-app", target: "firefox" }),
      );

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("neither wmctrl (X11) nor pkill is installed"),
      );
    });
  });

  it("close-app rejects an empty target before touching any tool", async () => {
    delete process.env.WAYLAND_DISPLAY;
    vi.stubEnv("XDG_SESSION_TYPE", "x11");
    mockWhich(["wmctrl", "pkill"]);

    await executor.executeAction(makeAction({ type: "close-app", target: "  " }));

    expect(cp.exec).not.toHaveBeenCalled();
    expect(cp.execFile).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No target provided for close-app"),
    );
  });

  describe("key-brightness", () => {
    it("routes through the onKeyBrightness callback with the origin device", async () => {
      const handler = vi.fn().mockResolvedValue(true);
      executor.onKeyBrightness = handler;

      await executor.executeAction(
        makeAction({ type: "key-brightness", brightness: 75 }),
        { deviceId: "dev-1", keyIndex: 3 },
      );

      expect(handler).toHaveBeenCalledWith("dev-1", 75);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: key-brightness"),
      );
    });

    it("passes null deviceId when triggered without device context", async () => {
      const handler = vi.fn().mockResolvedValue(true);
      executor.onKeyBrightness = handler;

      await executor.executeAction(
        makeAction({ type: "key-brightness", brightness: 10 }),
      );

      expect(handler).toHaveBeenCalledWith(null, 10);
    });

    it("logs a failure when the handler applies to no device", async () => {
      executor.onKeyBrightness = vi.fn().mockResolvedValue(false);

      await executor.executeAction(
        makeAction({ type: "key-brightness", brightness: 10 }),
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: key-brightness"),
      );
    });

    it("warns when no handler is registered", async () => {
      await executor.executeAction(
        makeAction({ type: "key-brightness", brightness: 10 }),
      );

      expect(cp.execFile).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("No onKeyBrightness handler registered"),
      );
    });
  });

  describe("executeAction logging", () => {
    it("logs start and success lines with the action type", async () => {
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
      mockWhich(["xdg-open"]);
      cp.spawn.mockReturnValue(spawnStub());

      await executor.executeAction(
        makeAction({ type: "open-url", url: "https://example.com", name: "Docs" }),
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action executing: open-url - Docs"),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: open-url - Docs"),
      );
    });

    it("logs a failure line for unknown action types", async () => {
      await executor.executeAction({
        id: "x",
        name: "Mystery",
        type: "does-not-exist",
      } as unknown as Action);

      expect(logger.warn).toHaveBeenCalledWith("Unknown action type: does-not-exist");
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: does-not-exist"),
      );
    });
  });

  describe("keyboard injection diagnostics", () => {
    it("reports the Wayland session and per-backend availability", async () => {
      vi.stubEnv("WAYLAND_DISPLAY", "wayland-0");
      vi.stubEnv("XDG_SESSION_TYPE", "wayland");
      mockWhich(["wtype"]);
      vi.spyOn(UinputInjector, "isEnvironmentCapable").mockReturnValue(true);

      const status = await executor.getKeyboardInjectionStatus();

      expect(status.session).toBe("wayland");
      const byName = Object.fromEntries(
        status.backends.map((b) => [b.name, b]),
      );
      expect(byName.uinput.available).toBe(true);
      expect(byName.ydotool.available).toBe(false);
      expect(byName.wtype.available).toBe(true);
      expect(byName.xdotool.available).toBe(false);
      // Unavailable backends carry a human-readable detail for the card.
      expect(byName.ydotool.detail).toContain("not installed");
    });

    it("reports the X11 session and marks uinput incapable without /dev/uinput", async () => {
      // The file-level fs mock makes /dev/uinput inaccessible; the static
      // spy flips the capability back on for the Wayland test above only.
      vi.stubEnv("WAYLAND_DISPLAY", "");
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
      mockWhich([]);

      const status = await executor.getKeyboardInjectionStatus();

      expect(status.session).toBe("x11");
      const byName = Object.fromEntries(
        status.backends.map((b) => [b.name, b]),
      );
      expect(byName.uinput.available).toBe(false);
      expect(byName.uinput.detail).toContain("udev");
      expect(byName.xdotool.available).toBe(false);
    });

    it("testKeyboardInjection taps ctrl through the real chain (wtype success)", async () => {
      vi.stubEnv("WAYLAND_DISPLAY", "wayland-0");
      vi.stubEnv("XDG_SESSION_TYPE", "wayland");
      mockWhich(["wtype"]);
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown, out?: { stdout: string }) => void)
          | undefined;
        cb?.(null, { stdout: "" });
      });

      await expect(executor.testKeyboardInjection()).resolves.toBe(true);

      // A lone modifier: no -M hold needed, just press+release "ctrl".
      expect(cp.execFile).toHaveBeenCalledWith(
        "wtype",
        ["-P", "ctrl", "-p", "ctrl"],
        expect.any(Function),
      );
    });

    it("testKeyboardInjection resolves false when no backend can carry the tap", async () => {
      vi.stubEnv("WAYLAND_DISPLAY", "");
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
      mockWhich([]);

      await expect(executor.testKeyboardInjection()).resolves.toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("neither xdotool nor ydotool is installed"),
      );
    });
  });

  describe("soundboard", () => {
    beforeEach(() => {
      delete process.env.WAYLAND_DISPLAY;
      vi.stubEnv("XDG_SESSION_TYPE", "x11");
      fsMocks.access.mockResolvedValue(undefined);
    });

    it("plays through paplay with the configured volume", async () => {
      mockWhich(["paplay"]);
      cp.spawn.mockReturnValue(spawnStub());

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/ding.wav", volume: 80 }),
      );

      expect(cp.spawn).toHaveBeenCalledWith(
        "paplay",
        ["--volume=80", "/home/me/ding.wav"],
        expect.objectContaining({ detached: true }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Playing sound via paplay"),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: soundboard"),
      );
    });

    it("falls back to pw-play (native volume, no flag) when paplay is missing", async () => {
      mockWhich(["pw-play"]);
      cp.spawn.mockReturnValue(spawnStub());

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/ding.wav" }),
      );

      expect(cp.spawn).toHaveBeenCalledWith(
        "pw-play",
        ["/home/me/ding.wav"],
        expect.anything(),
      );
    });

    it("uses ffplay's -volume flag when only ffmpeg is installed", async () => {
      mockWhich(["ffplay"]);
      cp.spawn.mockReturnValue(spawnStub());

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/ding.wav", volume: 45 }),
      );

      expect(cp.spawn).toHaveBeenCalledWith(
        "ffplay",
        ["-nodisp", "-autoexit", "-loglevel", "quiet", "-volume", "45", "/home/me/ding.wav"],
        expect.anything(),
      );
    });

    it("falls through to cvlc when everything else is missing", async () => {
      mockWhich(["cvlc"]);
      cp.spawn.mockReturnValue(spawnStub());

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/ding.wav", volume: 50 }),
      );

      expect(cp.spawn).toHaveBeenCalledWith(
        "cvlc",
        ["--play-and-exit", "--gain", "0.50", "/home/me/ding.wav"],
        expect.anything(),
      );
    });

    it("fails with an install hint when no audio backend exists", async () => {
      mockWhich([]);
      fsMocks.access.mockResolvedValue(undefined); // file exists, backends missing

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/ding.wav" }),
      );

      expect(fsMocks.access).toHaveBeenCalled();
      expect(cp.spawn).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("none of paplay, pw-play, ffplay or cvlc is installed"),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: soundboard"),
      );
    });

    it("rejects a missing sample file before probing any backend", async () => {
      mockWhich(["paplay"]);
      fsMocks.access.mockRejectedValue(new Error("ENOENT"));

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/gone/ding.wav" }),
      );

      expect(cp.spawn).not.toHaveBeenCalled();
      expect(cp.exec).not.toHaveBeenCalledWith("which paplay", expect.anything());
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('file not found at "/gone/ding.wav"'),
      );
    });

    it("restarts (SIGTERMs the previous child) when the same sample is pressed again", async () => {
      mockWhich(["paplay"]);
      const first = { ...spawnStub(), kill: vi.fn() };
      const second = { ...spawnStub(), kill: vi.fn() };
      cp.spawn.mockReturnValueOnce(first).mockReturnValueOnce(second);

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/ding.wav" }),
      );
      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/ding.wav" }),
      );

      expect(cp.spawn).toHaveBeenCalledTimes(2);
      expect(first.kill).toHaveBeenCalledWith("SIGTERM");
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("restart"),
      );
    });

    it("overlaps different samples (no restart across different paths)", async () => {
      mockWhich(["paplay"]);
      const first = { ...spawnStub(), kill: vi.fn() };
      const second = { ...spawnStub(), kill: vi.fn() };
      cp.spawn.mockReturnValueOnce(first).mockReturnValueOnce(second);

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/a.wav" }),
      );
      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/b.wav" }),
      );

      expect(first.kill).not.toHaveBeenCalled();
      expect(cp.spawn).toHaveBeenCalledTimes(2);
    });

    it("soundboard.stop SIGTERMs every playing child", async () => {
      mockWhich(["paplay"]);
      const a = { ...spawnStub(), kill: vi.fn() };
      const b = { ...spawnStub(), kill: vi.fn() };
      cp.spawn.mockReturnValueOnce(a).mockReturnValueOnce(b);

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/a.wav" }),
      );
      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "/home/me/b.wav" }),
      );
      await executor.executeAction(makeAction({ type: "soundboard.stop" }));

      expect(a.kill).toHaveBeenCalledWith("SIGTERM");
      expect(b.kill).toHaveBeenCalledWith("SIGTERM");
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("stopped 2 playing sample(s)"),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: soundboard.stop"),
      );
    });

    it("soundboard.stop succeeds truthfully when nothing is playing", async () => {
      mockWhich([]);

      await executor.executeAction(makeAction({ type: "soundboard.stop" }));

      expect(cp.spawn).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Action succeeded: soundboard.stop"),
      );
    });

    it("rejects an empty sample path before touching any tool", async () => {
      mockWhich(["paplay"]);

      await executor.executeAction(
        makeAction({ type: "soundboard", samplePath: "  " }),
      );

      expect(cp.exec).not.toHaveBeenCalled();
      expect(cp.spawn).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("No audio file selected"),
      );
    });
  });

  describe("timer", () => {
    const origin = { deviceId: "dev-1", keyIndex: 3, deviceType: "original" as const };

    it("starts a countdown registered on the pressed key", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(
        makeAction({ type: "timer", minutes: 5, seconds: 30 }),
        origin,
      );

      expect(tick.registered).toHaveLength(1);
      const reg = tick.registered[0];
      expect(reg.keyId).toBe("dev-1:3");
      expect(reg.deviceId).toBe("dev-1");
      expect(reg.keyIndex).toBe(3);
      expect(reg.kind).toBe("timer");
      expect(reg.intervalMs).toBe(1000);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("timer on dev-1:3: started (5m 30s"),
      );
    });

    it("renders MM:SS frames while counting down", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(
        makeAction({ type: "timer", minutes: 5, seconds: 0 }),
        origin,
      );
      const frame = await tick.registered[0].render();
      expect(Buffer.isBuffer(frame)).toBe(true);
    });

    it("pressing again stops the timer and restores the key (default)", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(
        makeAction({ type: "timer", minutes: 1 }),
        origin,
      );
      await exec.executeAction(
        makeAction({ type: "timer", minutes: 1 }),
        origin,
      );

      expect(tick.registered).toHaveLength(1);
      expect(tick.unregistered).toEqual([
        { keyId: "dev-1:3", restore: true },
      ]);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("timer on dev-1:3: stopped"),
      );
    });

    it("pressAgain=restart re-registers instead of stopping", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);
      const action = () =>
        makeAction({ type: "timer", minutes: 1, pressAgain: "restart" });

      await exec.executeAction(action(), origin);
      await exec.executeAction(action(), origin);

      expect(tick.registered).toHaveLength(2);
      expect(tick.unregistered).toHaveLength(0);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("restarted (1m 0s)"),
      );
    });

    it("fires the completion action once and hands the key back at zero", async () => {
      mockWhich(["systemctl"]);
      cp.execFile.mockImplementation((...callArgs: unknown[]) => {
        const cb = callArgs.find((a) => typeof a === "function") as
          | ((err: unknown, out?: { stdout: string }) => void)
          | undefined;
        cb?.(null, { stdout: "" });
      });

      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(
        makeAction({
          type: "timer",
          minutes: 0,
          seconds: 1,
          onCompleteAction: makeAction({ type: "system-sleep" }),
        }),
        origin,
      );

      const entry = tick.registered[0];
      const first = await entry.render();
      expect(Buffer.isBuffer(first)).toBe(true); // 00:01

      // Time travel past the deadline: the render reports "finished".
      const nowSpy = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 5000);
      const finished = await entry.render();
      nowSpy.mockRestore();

      expect(finished).toBeNull();
      // The chained action is fired without blocking the tick loop — give
      // its microtask chain (which probe → systemctl) room to settle.
      await new Promise((resolve) => setTimeout(resolve, 10));
      // The chained action went through the real pipeline (systemctl suspend).
      expect(cp.execFile).toHaveBeenCalledWith(
        "systemctl",
        ["suspend"],
        expect.any(Function),
      );
    });

    it("rejects a zero duration", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(
        makeAction({ type: "timer", minutes: 0, seconds: 0 }),
        origin,
      );

      expect(tick.registered).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("zero duration"),
      );
    });

    it("rejects presses without a device origin (cannot render anywhere)", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(makeAction({ type: "timer", minutes: 1 }));

      expect(tick.registered).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("needs a device key origin"),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Action failed: timer"),
      );
    });

    it("takes the key over from a clock when started on the same key", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(
        makeAction({ type: "clock" }),
        origin,
      );
      await exec.executeAction(
        makeAction({ type: "timer", minutes: 2 }),
        origin,
      );

      expect(tick.unregistered).toEqual([
        { keyId: "dev-1:3", restore: true },
      ]);
      expect(tick.registered.map((r) => r.kind)).toEqual(["clock", "timer"]);
    });
  });

  describe("clock", () => {
    const origin = { deviceId: "dev-1", keyIndex: 1, deviceType: "original" as const };

    it("registers a self-updating clock on the pressed key", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(makeAction({ type: "clock" }), origin);

      expect(tick.registered).toHaveLength(1);
      const reg = tick.registered[0];
      expect(reg.keyId).toBe("dev-1:1");
      expect(reg.kind).toBe("clock");
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("clock live on dev-1:1 (24h)"),
      );
    });

    it("re-renders when the minute changes and memoizes unchanged minutes", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);
      await exec.executeAction(makeAction({ type: "clock" }), origin);
      const render = tick.registered[0].render;

      const base = new Date(2026, 9, 27, 12, 0, 0).getTime();
      const nowSpy = vi.spyOn(Date, "now").mockReturnValue(base);
      const frame1 = await render();
      // Same minute → memoized (identical buffer, DeviceManager hash-skips).
      nowSpy.mockReturnValue(base + 30_000);
      const frame1again = await render();
      // Next minute → new frame.
      nowSpy.mockReturnValue(base + 90_000);
      const frame2 = await render();
      nowSpy.mockRestore();

      expect(frame1again).toBe(frame1);
      expect(frame2).not.toBe(frame1);
    });

    it("showSeconds upgrades the display text with :SS", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);
      await exec.executeAction(
        makeAction({ type: "clock", showSeconds: true }),
        origin,
      );

      const nowSpy = vi
        .spyOn(Date, "now")
        .mockReturnValue(new Date(2026, 9, 27, 8, 5, 9).getTime());
      const frame = await tick.registered[0].render();
      nowSpy.mockRestore();
      expect(Buffer.isBuffer(frame)).toBe(true);
    });

    it("rejects presses without a device origin", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      await exec.executeAction(makeAction({ type: "clock" }));

      expect(tick.registered).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("needs a device key origin"),
      );
    });

    it("syncClocks registers page clocks and stops clocks that left the page", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);

      const clockKey = {
        id: "k1",
        keyIndex: 2,
        action: { type: "clock", id: "c1", name: "Clock" },
      };
      await exec.syncClocks("dev-1", "original", {
        id: "p1",
        name: "P",
        keys: [clockKey as any],
      } as any);
      expect(tick.registered).toHaveLength(1);
      expect(tick.registered[0].keyId).toBe("dev-1:2");

      // Same page again: refresh (re-register), no removals.
      await exec.syncClocks("dev-1", "original", {
        id: "p1",
        name: "P",
        keys: [clockKey as any],
      } as any);
      expect(tick.unregistered).toHaveLength(0);

      // Clock removed from the page → its display stops.
      await exec.syncClocks("dev-1", "original", {
        id: "p1",
        name: "P",
        keys: [],
      } as any);
      expect(tick.unregistered).toEqual([
        { keyId: "dev-1:2", restore: true },
      ]);
    });

    it("syncClocks never touches running timers", async () => {
      const tick = makeFakeTickService();
      const exec = new ActionExecutor(logger, tick.service);
      const origin = { deviceId: "dev-1", keyIndex: 4, deviceType: "original" as const };

      await exec.executeAction(
        makeAction({ type: "timer", minutes: 3 }),
        origin,
      );
      await exec.syncClocks("dev-1", "original", {
        id: "p1",
        name: "P",
        keys: [],
      } as any);

      expect(tick.unregistered).toHaveLength(0);
      expect(tick.registered[0].kind).toBe("timer");
    });
  });

  describe("formatClockTime", () => {
    it("formats 24h zero-padded by default", () => {
      expect(formatClockTime(new Date(2026, 0, 1, 9, 5), true, false)).toBe("09:05");
      expect(formatClockTime(new Date(2026, 0, 1, 23, 59), true, false)).toBe("23:59");
    });

    it("formats 12h with AM/PM and no leading zero on the hour", () => {
      expect(formatClockTime(new Date(2026, 0, 1, 0, 5), false, false)).toBe("12:05 AM");
      expect(formatClockTime(new Date(2026, 0, 1, 14, 5), false, false)).toBe("2:05 PM");
    });

    it("appends seconds when enabled", () => {
      expect(formatClockTime(new Date(2026, 0, 1, 9, 5, 7), true, true)).toBe("09:05:07");
      expect(formatClockTime(new Date(2026, 0, 1, 15, 2, 42), false, true)).toBe("3:02:42 PM");
    });
  });
});
