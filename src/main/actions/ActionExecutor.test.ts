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

// fs/promises backs launch-app path checks and .desktop discovery.
const fsMocks = vi.hoisted(() => ({
  access: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  access: fsMocks.access,
  constants: { F_OK: 0, W_OK: 2, X_OK: 1 },
}));

import { ActionExecutor } from "./ActionExecutor";
import type { Logger } from "../utils/Logger";
import type { Action } from "../../shared/types";

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as Logger;

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
        ["-M", "ctrl", "-P", "a", "-U", "a", "-m", "ctrl"],
        expect.any(Function),
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
});
