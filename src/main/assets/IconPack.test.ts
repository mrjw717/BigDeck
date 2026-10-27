// ============================================================================
// IconPackManager — unit tests
//
// Packs are built programmatically in a tmp dir, mirroring the REAL Elgato
// .sdIconPack structure (manifest.json + icons.json + icons/*.svg — see
// docs/ICON-PACKS.md), so the tests decode exactly what ships in the wild.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { IconPackManager } from "./IconPack";
import type { Logger } from "../utils/Logger";

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

const MIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144"><path d="M0 0h144v144H0z" fill="white"/></svg>';

/** Write a pack in the exact on-disk shape KeyCreator ships. */
async function writePack(
  root: string,
  id: string,
  opts: {
    manifest?: Record<string, unknown> | null;
    icons?: Array<{ path: string; name?: string; tags?: string[] }> | null;
    files?: Record<string, string>;
  } = {},
): Promise<string> {
  const dir = path.join(root, id);
  await fsp.mkdir(path.join(dir, "icons"), { recursive: true });
  if (opts.manifest !== null) {
    await fsp.writeFile(
      path.join(dir, "manifest.json"),
      JSON.stringify(
        opts.manifest ?? {
          Name: "Test Pack",
          Version: "1.0.0",
          Description: "A test pack",
          Author: "BigDeck Test",
          Icon: "icon.svg",
          pinned: "true",
          canhide: "true",
        },
      ),
    );
  }
  if (opts.icons !== null) {
    await fsp.writeFile(
      path.join(dir, "icons.json"),
      JSON.stringify(
        opts.icons ?? [
          { path: "IconAdd.svg", name: "Add icon (Outlined)", tags: ["add", "plus"] },
          { path: "IconRemove.svg", name: "Remove icon (Outlined)", tags: ["remove"] },
        ],
      ),
    );
  }
  await fsp.writeFile(path.join(dir, "icons", "IconAdd.svg"), MIN_SVG);
  await fsp.writeFile(path.join(dir, "icons", "IconRemove.svg"), MIN_SVG);
  await fsp.writeFile(path.join(dir, "icon.svg"), MIN_SVG);
  for (const [rel, content] of Object.entries(opts.files ?? {})) {
    const target = path.join(dir, rel);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, content);
  }
  return dir;
}

let tmp: string;
let packsDir: string;
let manager: IconPackManager;

beforeEach(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "iconpacks-"));
  packsDir = path.join(tmp, "iconpacks");
  manager = new IconPackManager({ logger: makeLogger().logger, packsDir });
});

afterEach(async () => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("listIconPacks", () => {
  it("lists installed packs with parsed manifest fields", async () => {
    await writePack(packsDir, "com.test.white.sdIconPack", {
      manifest: {
        Name: "Elgato Icons (White)",
        Version: "2.0.0",
        Description: "White icons",
        Author: "Elgato Systems",
        Icon: "icon.svg",
        pinned: "true",
        canhide: "true",
      },
    });
    await writePack(packsDir, "com.test.black.sdIconPack", {
      manifest: { Name: "Elgato Icons (Black)", Version: "2.0.0", pinned: false },
    });

    const packs = await manager.listIconPacks();
    expect(packs.map((p) => p.id)).toEqual([
      "com.test.black.sdIconPack",
      "com.test.white.sdIconPack",
    ]);

    const white = packs[1];
    expect(white).toMatchObject({
      id: "com.test.white.sdIconPack",
      name: "Elgato Icons (White)",
      version: "2.0.0",
      description: "White icons",
      author: "Elgato Systems",
      pinned: true,
      canHide: true,
      iconCount: 2,
    });
    expect(white.iconPath).toBe(path.join(packsDir, "com.test.white.sdIconPack", "icon.svg"));

    // Manifest fields absent → derived defaults (KeyCreator's manifest uses
    // string "true"/"false"; a real boolean false must not become true).
    expect(packs[0]).toMatchObject({ pinned: false, canHide: false, description: null });
  });

  it("skips directories without a readable manifest.json (warns, never throws)", async () => {
    await fsp.mkdir(path.join(packsDir, "com.elgato.custom.sdIconPack"), { recursive: true });
    await writePack(packsDir, "com.test.ok.sdIconPack");

    const packs = await manager.listIconPacks();
    expect(packs.map((p) => p.id)).toEqual(["com.test.ok.sdIconPack"]);
  });

  it("returns [] when the packs dir does not exist", async () => {
    expect(await manager.listIconPacks()).toEqual([]);
  });
});

describe("listIcons", () => {
  it("returns icons.json entries with tags and names", async () => {
    await writePack(packsDir, "com.test.pack.sdIconPack");
    expect(await manager.listIcons("com.test.pack.sdIconPack")).toEqual([
      { id: "IconAdd.svg", name: "Add icon (Outlined)", tags: ["add", "plus"] },
      { id: "IconRemove.svg", name: "Remove icon (Outlined)", tags: ["remove"] },
    ]);
  });

  it("falls back to the path as name and [] as tags when absent", async () => {
    await writePack(packsDir, "com.test.min.sdIconPack", {
      icons: [{ path: "icon.svg" }],
    });
    expect(await manager.listIcons("com.test.min.sdIconPack")).toEqual([
      { id: "icon.svg", name: "icon.svg", tags: [] },
    ]);
  });

  it("returns [] for unknown packs and malformed icons.json", async () => {
    await writePack(packsDir, "com.test.broken.sdIconPack", {
      icons: [{ path: "IconAdd.svg" }],
      files: { "icons.json": "{not json" },
    });
    await writePack(packsDir, "com.test.noindex.sdIconPack", { icons: null });

    expect(await manager.listIcons("com.test.missing.sdIconPack")).toEqual([]);
    expect(await manager.listIcons("com.test.broken.sdIconPack")).toEqual([]);
    expect(await manager.listIcons("com.test.noindex.sdIconPack")).toEqual([]);
  });

  it("rejects path-traversal pack ids", async () => {
    expect(await manager.listIcons("../outside")).toEqual([]);
    expect(await manager.listIcons("a/b")).toEqual([]);
  });
});

describe("getIconSvgOrFile", () => {
  beforeEach(async () => {
    await writePack(packsDir, "com.test.pack.sdIconPack");
  });

  it("returns the file path, raw SVG text and a data URL for .svg icons", async () => {
    const icon = await manager.getIconSvgOrFile("com.test.pack.sdIconPack", "IconAdd.svg");
    expect(icon).not.toBeNull();
    expect(icon!.file).toBe(
      path.join(packsDir, "com.test.pack.sdIconPack", "icons", "IconAdd.svg"),
    );
    expect(icon!.svg).toBe(MIN_SVG);
    expect(icon!.dataUrl).toBe(
      `data:image/svg+xml;base64,${Buffer.from(MIN_SVG).toString("base64")}`,
    );
  });

  it("returns null for missing icons and rejects traversal ids", async () => {
    expect(
      await manager.getIconSvgOrFile("com.test.pack.sdIconPack", "IconNope.svg"),
    ).toBeNull();
    expect(
      await manager.getIconSvgOrFile("com.test.pack.sdIconPack", "../../manifest.json"),
    ).toBeNull();
    expect(await manager.getIconSvgOrFile("com.test.missing.sdIconPack", "IconAdd.svg")).toBeNull();
  });

  it("serves non-SVG images via dataUrl with svg text null", async () => {
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await fsp.writeFile(
      path.join(packsDir, "com.test.pack.sdIconPack", "icons", "pixel.png"),
      png1x1,
    );
    const icon = await manager.getIconSvgOrFile("com.test.pack.sdIconPack", "pixel.png");
    expect(icon!.svg).toBeNull();
    expect(icon!.dataUrl).toBe(`data:image/png;base64,${png1x1.toString("base64")}`);
  });
});

describe("installFromFile / importAllFrom", () => {
  it("copies a pack dir into packsDir and replaces an existing install", async () => {
    const source = await writePack(tmp, "com.test.pack.sdIconPack");
    const pack = await manager.installFromFile(source);

    expect(pack.id).toBe("com.test.pack.sdIconPack");
    expect(pack.iconCount).toBe(2);
    expect(fs.existsSync(path.join(packsDir, "com.test.pack.sdIconPack", "icons.json"))).toBe(
      true,
    );

    // Reinstall replaces in place (not nest, not merge).
    await fsp.writeFile(path.join(source, "icons.json"), JSON.stringify([{ path: "only.svg" }]));
    await fsp.rm(path.join(source, "icons", "IconAdd.svg"));
    await fsp.writeFile(path.join(source, "icons", "only.svg"), MIN_SVG);
    const repacked = await manager.installFromFile(source);
    expect(repacked.iconCount).toBe(1);
    expect(
      fs.existsSync(path.join(packsDir, "com.test.pack.sdIconPack", "icons", "IconAdd.svg")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(packsDir, "com.test.pack.sdIconPack", "icons", "only.svg")),
    ).toBe(true);
  });

  it("refuses sources that are not .sdIconPack directories", async () => {
    await expect(manager.installFromFile(path.join(tmp, "pack"))).rejects.toThrow(
      /not an .sdIconPack/,
    );
  });

  it("importAllFrom imports new packs, skips installed ones, ignores other entries", async () => {
    const source = path.join(tmp, "static");
    await writePack(source, "com.test.a.sdIconPack");
    await writePack(source, "com.test.b.sdIconPack");
    await fsp.mkdir(path.join(source, "icons"), { recursive: true }); // decoy, not a pack
    await fsp.writeFile(path.join(source, "defaults.json"), "{}");

    const first = await manager.importAllFrom(source);
    expect(first.imported.sort()).toEqual([
      "com.test.a.sdIconPack",
      "com.test.b.sdIconPack",
    ]);
    expect(first.skipped).toEqual([]);
    expect(first.failed).toEqual([]);

    // Second run: everything already installed → skipped, files untouched.
    await fsp.writeFile(
      path.join(packsDir, "com.test.a.sdIconPack", "marker.txt"),
      "user-edit",
    );
    const second = await manager.importAllFrom(source);
    expect(second.imported).toEqual([]);
    expect(second.skipped.sort()).toEqual(["com.test.a.sdIconPack", "com.test.b.sdIconPack"]);
    expect(
      fs.readFileSync(path.join(packsDir, "com.test.a.sdIconPack", "marker.txt"), "utf-8"),
    ).toBe("user-edit");
  });

  it("importAllFrom reports broken packs as failed and removes the bad copy", async () => {
    const source = path.join(tmp, "static");
    await fsp.mkdir(path.join(source, "com.test.broken.sdIconPack"), { recursive: true });

    const result = await manager.importAllFrom(source);
    expect(result.imported).toEqual([]);
    expect(result.failed).toEqual([
      { name: "com.test.broken.sdIconPack", error: "no readable manifest.json" },
    ]);
    expect(fs.existsSync(path.join(packsDir, "com.test.broken.sdIconPack"))).toBe(false);
  });

  it("importAllFrom imports nothing (without throwing) from a missing dir", async () => {
    const result = await manager.importAllFrom(path.join(tmp, "does-not-exist"));
    expect(result).toEqual({ imported: [], skipped: [], failed: [] });
  });
});
