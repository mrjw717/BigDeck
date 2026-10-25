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
} from "./SDPluginProcess";
import type { Logger } from "../../utils/Logger";

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

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
    // base 30ms doubling: several crash→respawn cycles within ~400ms
    await new Promise((r) => setTimeout(r, 400));
    const stopped = new Promise<void>((resolve) => proc.on("exit", () => resolve()));
    proc.stop();
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

  it("reports unsupported instead of failing for HTML codepaths", () => {
    const proc = new SDPluginProcess(
      { pluginUUID: "u", pluginName: "html", codePath: "/nowhere/index.html", port: 1, info: {}, respawn: false },
      silentLogger,
    );
    expect(proc.start()).toBe(false);
    expect(proc.getStatus()).toBe("unsupported");
  });
});
