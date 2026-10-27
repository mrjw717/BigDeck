// ============================================================================
// LayoutStore — discovery, import, list/get tests
//
// Uses the real Elgato fixtures (__fixtures__/) copied into a temp store dir,
// mirroring what importFrom() does from a user's Stream Deck installation.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { LayoutStore, type LayoutEntry } from "./LayoutStore";
import type { Logger } from "../utils/Logger";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

function makeLogger() {
  const records: Array<{ level: string; msg: string }> = [];
  const push = (level: string) => (msg: unknown, err?: unknown) =>
    records.push({ level, msg: `${String(msg)}${err ? ` ${String(err)}` : ""}` });
  const logger = {
    debug: push("debug"),
    info: push("info"),
    warn: push("warn"),
    error: push("error"),
  } as unknown as Logger;
  return { logger, records };
}

describe("LayoutStore", () => {
  let tmpDir: string;
  let layoutsDir: string;
  let logger: Logger;
  let records: Array<{ level: string; msg: string }>;
  let store: LayoutStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bigdeck-layoutstore-"));
    layoutsDir = path.join(tmpDir, "layouts");
    const log = makeLogger();
    logger = log.logger;
    records = log.records;
    store = new LayoutStore({ logger, layoutsDir });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("defaultLayoutsDir lives under <userData>/layouts", () => {
    expect(LayoutStore.defaultLayoutsDir("/home/x/.config/app")).toBe(
      path.join("/home/x/.config/app", "layouts"),
    );
  });

  it("discovers installed *.sdLayoutEx packages and serves list/get", async () => {
    for (const name of ["digital_time_17.sdLayoutEx", "pagination_09.sdLayoutEx"]) {
      await fs.cp(path.join(FIXTURES_DIR, name), path.join(layoutsDir, name), {
        recursive: true,
      });
    }

    const discovered = await store.discover();
    expect(discovered).toBe(2);

    const list = store.list();
    expect(list.map((e) => e.id)).toEqual(["digital_time_17", "pagination_09"]);
    const entry = store.get("pagination_09") as LayoutEntry;
    expect(entry.dir).toBe(path.join(layoutsDir, "pagination_09.sdLayoutEx"));
    expect(entry.manifest.elements.map((e) => e.type)).toContain("carousel_page");
    expect(entry.themeIds).toEqual(["green", "blue", "orange"]);
    expect(store.get("missing")).toBeNull();
  });

  it("ignores non-layout directories and skips invalid manifests", async () => {
    await fs.cp(
      path.join(FIXTURES_DIR, "digital_time_17.sdLayoutEx"),
      path.join(layoutsDir, "digital_time_17.sdLayoutEx"),
      { recursive: true },
    );
    await fs.mkdir(path.join(layoutsDir, "not-a-layout"));
    await fs.mkdir(path.join(layoutsDir, "broken.sdLayoutEx"));
    await fs.writeFile(
      path.join(layoutsDir, "broken.sdLayoutEx", "manifest.json"),
      JSON.stringify({ themes: "nope" }),
    );

    expect(await store.discover()).toBe(1);
    expect(records.some((r) => r.level === "warn" && r.msg.includes("broken"))).toBe(true);
    expect(store.list().map((e) => e.id)).toEqual(["digital_time_17"]);
  });

  it("imports a source .sdLayoutEx directory into the store", async () => {
    const source = path.join(tmpDir, "digital_time_08.sdLayoutEx");
    await fs.cp(path.join(FIXTURES_DIR, "digital_time_08.sdLayoutEx"), source, {
      recursive: true,
    });

    const result = await store.importFrom(source);
    expect("entry" in result && result.entry.id).toBe("digital_time_08");

    // Copied package is complete (manifest + fonts tree + OFL licenses).
    const dest = path.join(layoutsDir, "digital_time_08.sdLayoutEx");
    const copied = JSON.parse(
      await fs.readFile(path.join(dest, "manifest.json"), "utf-8"),
    );
    expect(copied.template.id).toBe("digital_time_08");
    expect(await fs.readdir(path.join(dest, "fonts", "Alfa_Slab_One"))).toContain("OFL.txt");

    // Immediately usable without a rediscover.
    expect(store.get("digital_time_08")).not.toBeNull();
  });

  it("rejects invalid source packages without copying anything", async () => {
    const source = path.join(tmpDir, "bad.sdLayoutEx");
    await fs.mkdir(source);
    await fs.writeFile(
      path.join(source, "manifest.json"),
      JSON.stringify({ elements: [{ key: "x", type: "teleport" }] }),
    );

    const result = await store.importFrom(source);
    expect("errors" in result).toBe(true);
    if ("errors" in result) {
      expect(result.errors.some((e) => e.includes("unknown element type"))).toBe(true);
    }
    await expect(fs.readdir(layoutsDir)).rejects.toThrow(); // nothing created
    expect(store.get("bad")).toBeNull();
  });

  it("rejects packages whose manifest.json is unreadable", async () => {
    const source = path.join(tmpDir, "junk.sdLayoutEx");
    await fs.mkdir(source);
    await fs.writeFile(path.join(source, "manifest.json"), "{not json");

    const result = await store.importFrom(source);
    expect("errors" in result && result.errors[0]).toContain("unreadable");
  });

  it("replaces an existing package of the same name on reimport", async () => {
    const source = path.join(tmpDir, "digital_time_17.sdLayoutEx");
    await fs.cp(path.join(FIXTURES_DIR, "digital_time_17.sdLayoutEx"), source, {
      recursive: true,
    });
    await store.importFrom(source);
    expect(await store.discover()).toBe(1);

    // Mutate the source manifest, reimport — the store serves the new bytes.
    const manifestPath = path.join(source, "manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
    manifest.template.id = "digital_time_17";
    manifest.themes.push({
      id: "extra",
      primaryColor: "#123456",
      secondaryColor: "#654321",
      colors: { backgroundColor: "#123456" },
      fonts: {},
    });
    await fs.writeFile(manifestPath, JSON.stringify(manifest));

    const again = await store.importFrom(source);
    expect("entry" in again && again.entry.themeIds).toContain("extra");
    expect(store.list()).toHaveLength(1);
  });

  it("discovers an empty store without error", async () => {
    expect(await store.discover()).toBe(0);
    expect(store.list()).toEqual([]);
  });
});
