// ============================================================================
// ExamplePluginSeed — seeding tests
//
// The source of truth is the REAL bundled plugin
// (resources/example-plugin/com.bigdeck.examples.sdPlugin): seeding tests
// copy from it, which also pins the product content — a missing or renamed
// example plugin fails these tests instead of silently shipping nothing.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  seedExamplePlugin,
  EXAMPLE_PLUGIN_DIR_NAME,
} from "./ExamplePluginSeed";
import type { Logger } from "../../utils/Logger";

// Repo layout: src/main/plugins/sd → repo root is 4 levels up.
// `__dirname` is shimmed by vitest's module runner and native under the
// CommonJS main-process build; the cwd fallback covers either.
const REPO_ROOT =
  typeof __dirname !== "undefined"
    ? path.join(__dirname, "..", "..", "..", "..")
    : process.cwd();
const EXAMPLE_SOURCE_ROOT = path.join(REPO_ROOT, "resources", "example-plugin");

function makeLogger() {
  const records: Array<{ level: string; msg: string }> = [];
  const push = (level: string) => (msg: unknown) =>
    records.push({ level, msg: String(msg) });
  return {
    logger: {
      debug: push("debug"),
      info: push("info"),
      warn: push("warn"),
      error: push("error"),
    } as unknown as Logger,
    records,
  };
}

let tmp: string;
let pluginsDir: string;
let log: ReturnType<typeof makeLogger>;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sdseed-"));
  pluginsDir = path.join(tmp, "sdplugins");
  log = makeLogger();
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("seedExamplePlugin", () => {
  it("copies the bundled example plugin into an empty plugins dir", async () => {
    const result = await seedExamplePlugin({
      logger: log.logger,
      pluginsDir,
      resourceDirs: [EXAMPLE_SOURCE_ROOT],
    });

    expect(result).toBe("seeded");
    const manifestPath = path.join(pluginsDir, EXAMPLE_PLUGIN_DIR_NAME, "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(path.join(pluginsDir, EXAMPLE_PLUGIN_DIR_NAME, "plugin.js"))).toBe(true);
    expect(log.records.some((r) => r.level === "info")).toBe(true);
  });

  it("skips when the plugin is already installed (user copy wins)", async () => {
    const dest = path.join(pluginsDir, EXAMPLE_PLUGIN_DIR_NAME);
    fs.mkdirSync(dest, { recursive: true });
    // A deliberately MODIFIED installed copy — seeding must not overwrite it.
    fs.writeFileSync(
      path.join(dest, "manifest.json"),
      JSON.stringify({ Name: "User-modified copy" }),
    );

    const result = await seedExamplePlugin({
      logger: log.logger,
      pluginsDir,
      resourceDirs: [EXAMPLE_SOURCE_ROOT],
    });

    expect(result).toBe("already-installed");
    expect(
      JSON.parse(fs.readFileSync(path.join(dest, "manifest.json"), "utf-8")),
    ).toEqual({ Name: "User-modified copy" });
  });

  it("reports a missing seed source without creating anything", async () => {
    const result = await seedExamplePlugin({
      logger: log.logger,
      pluginsDir,
      resourceDirs: [path.join(tmp, "does-not-exist")],
    });

    expect(result).toBe("source-not-found");
    expect(fs.existsSync(pluginsDir)).toBe(false);
    expect(log.records.some((r) => r.level === "warn")).toBe(true);
  });
});
