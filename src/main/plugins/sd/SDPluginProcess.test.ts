// ============================================================================
// SDPluginProcess — spawn argv, launcher resolution, supervision tests
//
// The argv layout is part of the recovered wire contract
// (docs/SDPLUGIN-COMPAT.md, FUN_1006c3c94) — any change here breaks every
// real Stream Deck plugin, so it is pinned by tests.
//
// The launcher tests run against this test file's own path (never executable)
// and a genuinely executable temp script, so no assumption is made about the
// repository's file modes.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  buildSpawnArgs,
  resolveLauncher,
  SDPluginProcess,
  KILL_GRACE_MS,
} from "./SDPluginProcess";
import type { Logger } from "../../utils/Logger";

// Fixtures live next to this file. `__dirname` is shimmed by vitest's module
// runner and native under the CommonJS main-process build; the cwd fallback
// covers any environment that provides neither.
const FIXTURES = path.join(
  typeof __dirname !== "undefined"
    ? __dirname
    : path.join(process.cwd(), "src/main/plugins/sd"),
  "__fixtures__",
);

function arglessLogger(): Logger {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  } as unknown as Logger;
}

const silentLogger: Logger = arglessLogger();

/** Poll until `fn` returns truthy (child processes and WS I/O are async). */
function waitFor<T>(fn: () => T | undefined | null | false, timeoutMs = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      let value: T | undefined | null | false;
      try {
        value = fn();
      } catch (err) {
        reject(err);
        return;
      }
      if (value) {
        resolve(value as T);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("waitFor: timed out"));
        return;
      }
      setTimeout(tick, 25);
    };
    tick();
  });
}

describe("buildSpawnArgs", () => {
  it("matches the spec argv: -port, -pluginUUID, -registerEvent, URL-encoded -info", () => {
    const info = {
      application: { language: "en", platform: "linux", version: "1.0.0" },
      devices: [],
      pluginUUID: "com.bigdeck.test.fake",
      registerEvent: "registerPlugin",
    };

    const args = buildSpawnArgs(4321, "com.bigdeck.test.fake", info);

    expect(args).toEqual([
      "-port",
      "4321",
      "-pluginUUID",
      "com.bigdeck.test.fake",
      "-registerEvent",
      "registerPlugin",
      "-info",
      encodeURIComponent(JSON.stringify(info)),
    ]);
  });

  it("URL-encodes the -info JSON so spaces/specials survive the exec boundary", () => {
    const info = { application: { platform: "linux" } };
    const args = buildSpawnArgs(1, "uuid", info);
    const raw = decodeURIComponent(args[args.length - 1]);
    expect(JSON.parse(raw)).toEqual(info);
  });
});

describe("resolveLauncher", () => {
  it("runs executable files directly (native plugins)", () => {
    const launcher = resolveLauncher("/plugins/p.sdPlugin/bin/native", {
      isExecutable: () => true,
    });
    expect(launcher).toEqual({ file: "/plugins/p.sdPlugin/bin/native", args: [], env: {} });
  });

  it("launches .js via node without forcing ELECTRON_RUN_AS_NODE outside Electron", () => {
    const launcher = resolveLauncher("/plugins/p.sdPlugin/plugin.js", {
      isExecutable: () => false,
      nodeBin: "/usr/bin/node",
    });
    // When vitest runs under plain node, process.versions.electron is
    // undefined and no env override is needed.
    if (process.versions.electron) {
      expect(launcher?.env.ELECTRON_RUN_AS_NODE).toBe("1");
    } else {
      expect(launcher).toEqual({
        file: "/usr/bin/node",
        args: ["/plugins/p.sdPlugin/plugin.js"],
        env: {},
      });
    }
  });

  it("maps .py to python3 and .sh to bash (file need not be +x)", () => {
    expect(resolveLauncher("/p/plugin.py", { isExecutable: () => false })?.file).toBe("python3");
    expect(resolveLauncher("/p/plugin.py3", { isExecutable: () => false })?.file).toBe("python3");
    expect(resolveLauncher("/p/plugin.sh", { isExecutable: () => false })?.file).toBe("bash");
  });

  it("returns null for browser-hosted HTML plugins (unsupported in v1)", () => {
    expect(
      resolveLauncher("/p/index.html", { isExecutable: () => false }),
    ).toBeNull();
  });

  it("returns null for unknown non-executable formats", () => {
    expect(
      resolveLauncher("/p/blob.weird", { isExecutable: () => false }),
    ).toBeNull();
  });
});

describe("SDPluginProcess", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdproc-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("spawns a script with the spec argv and reports a clean exit", async () => {
    const script = path.join(dir, "args.js");
    // Record argv to a file, then exit 0. Verifies the child actually got
    // the spec flags (not just that we computed them).
    fs.writeFileSync(
      script,
      `
        const fs = require("fs");
        function arg(name) {
          const i = process.argv.indexOf(name);
          return i >= 0 ? process.argv[i + 1] : undefined;
        }
        fs.writeFileSync(${JSON.stringify(path.join(dir, "argv.json"))}, JSON.stringify({
          port: arg("-port"),
          pluginUUID: arg("-pluginUUID"),
          registerEvent: arg("-registerEvent"),
          info: JSON.parse(decodeURIComponent(arg("-info"))),
        }));
        process.exit(0);
      `,
    );

    const info = { pluginUUID: "com.bigdeck.test.fake", registerEvent: "registerPlugin" };
    const proc = new SDPluginProcess(
      { pluginUUID: "com.bigdeck.test.fake", pluginName: "test", codePath: script, port: 5555, info, respawn: false },
      silentLogger,
    );

    const exitCode = new Promise<number | null>((resolve) => {
      proc.on("exit", (code) => resolve(code as number | null));
    });

    expect(proc.start()).toBe(true);
    expect(await exitCode).toBe(0);
    expect(proc.getStatus()).toBe("stopped");

    const recorded = JSON.parse(
      fs.readFileSync(path.join(dir, "argv.json"), "utf-8"),
    );
    expect(recorded).toEqual({
      port: "5555",
      pluginUUID: "com.bigdeck.test.fake",
      registerEvent: "registerPlugin",
      info,
    });
  });

  it("captures stderr into the logger", async () => {
    const script = path.join(dir, "noisy.js");
    fs.writeFileSync(script, `console.error("boom-line"); process.exit(0);`);

    const lines: string[] = [];
    const capturing: Logger = {
      ...silentLogger,
      error: (msg: string) => lines.push(String(msg)),
    } as unknown as Logger;

    const proc = new SDPluginProcess(
      { pluginUUID: "u", pluginName: "noisy", codePath: script, port: 1, info: {}, respawn: false },
      capturing,
    );
    proc.start();
    await new Promise<void>((resolve) => proc.on("exit", () => resolve()));

    expect(lines.some((l) => l.includes("boom-line"))).toBe(true);
  });

  it("marks non-zero exits as crashed and does not respawn when disabled", async () => {
    const script = path.join(dir, "crash.js");
    fs.writeFileSync(script, `process.exit(7);`);

    const proc = new SDPluginProcess(
      { pluginUUID: "u", pluginName: "crashy", codePath: script, port: 1, info: {}, respawn: false },
      silentLogger,
    );
    const exited = new Promise<void>((resolve) => proc.on("exit", () => resolve()));
    proc.start();
    await exited;

    expect(proc.getStatus()).toBe("crashed");
    // Give any (disabled) respawn logic time to misbehave.
    await new Promise((r) => setTimeout(r, 150));
    expect(proc.getStatus()).toBe("crashed");
  });

  it("respawns with backoff when enabled", async () => {
    const script = path.join(dir, "crash.js"); // same always-crashing script
    const proc = new SDPluginProcess(
      {
        pluginUUID: "u",
        pluginName: "respawner",
        codePath: script,
        port: 1,
        info: {},
        respawn: true,
        respawnBaseDelayMs: 30,
        respawnMaxDelayMs: 200,
      },
      silentLogger,
    );

    let exits = 0;
    proc.on("exit", () => {
      exits += 1;
    });

    proc.start();
    // base 30ms doubling: wait (bounded) for several crash→respawn cycles
    // instead of a fixed sleep — process starts take variable time under load.
    const deadline = Date.now() + 8000;
    while (exits < 3 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 25));
    }
    // stop() early-returns when the process is in the crash→respawn gap
    // (no live child), in which case there will be no further exit event —
    // only wait for one if a child is actually running.
    proc.stop();
    const stopped =
      proc.getStatus() === "stopped"
        ? Promise.resolve()
        : new Promise<void>((resolve) => proc.on("exit", () => resolve()));
    await stopped;
    expect(exits).toBeGreaterThanOrEqual(3);
    expect(proc.getStatus()).toBe("stopped");
  });

  it("stop() terminates the child", async () => {
    const script = path.join(dir, "hang.js");
    fs.writeFileSync(script, `setInterval(() => {}, 1000);`);

    const proc = new SDPluginProcess(
      { pluginUUID: "u", pluginName: "hang", codePath: script, port: 1, info: {}, respawn: false },
      silentLogger,
    );
    const exited = new Promise<void>((resolve) => proc.on("exit", () => resolve()));
    expect(proc.start()).toBe(true);
    expect(proc.getPid()).not.toBeNull();

    proc.stop();
    await exited;
    expect(proc.getStatus()).toBe("stopped");
  });

  it("stop() resolves after SIGKILL escalation when a plugin traps SIGTERM (quit-orphaning regression)", async () => {
    // Fixture ignores SIGTERM — exactly the plugin shape that used to get
    // orphaned at quit, when Electron fired before-quit without awaiting
    // the cleanup and the escalation timer raced app exit.
    const stderrLines: string[] = [];
    const capturing: Logger = {
      ...silentLogger,
      error: (msg: unknown) => stderrLines.push(String(msg)),
    } as unknown as Logger;
    const proc = new SDPluginProcess(
      {
        pluginUUID: "u",
        pluginName: "sigterm-trap",
        codePath: path.join(FIXTURES, "sigterm-trap.js"),
        port: 1,
        info: {},
        respawn: false,
      },
      capturing,
    );

    expect(proc.start()).toBe(true);
    const pid = proc.getPid()!;

    // Wait until the fixture actually INSTALLED its trap: a SIGTERM sent
    // during the child's exec window kills it with the default disposition
    // (fine, but it would not exercise the escalation we are pinning).
    await waitFor(() => stderrLines.find((l) => l.includes("sigterm-trap-ready")));

    // Awaitable: resolves (does not hang) only once the child is truly dead.
    const startedAt = Date.now();
    await proc.stop();
    const elapsed = Date.now() - startedAt;

    // The trap forced the full escalation: SIGTERM at t=0, SIGKILL at the
    // grace boundary. Small slop on the lower bound for clock rounding; the
    // upper bound proves the promise resolved within the escalation window
    // instead of hanging on a plugin that never exits.
    expect(elapsed).toBeGreaterThanOrEqual(KILL_GRACE_MS - 100);
    expect(elapsed).toBeLessThan(KILL_GRACE_MS + 5000);

    // Dead is dead: the pid no longer addresses a live process.
    expect(() => process.kill(pid, 0)).toThrow();
    expect(proc.getStatus()).toBe("stopped");
  });

  it("reports unsupported instead of failing for HTML codepaths", () => {
    const proc = new SDPluginProcess(
      { pluginUUID: "u", pluginName: "html", codePath: "/nowhere/index.html", port: 1, info: {}, respawn: false },
      silentLogger,
    );
    expect(proc.start()).toBe(false);
    expect(proc.getStatus()).toBe("unsupported");
  });
});
