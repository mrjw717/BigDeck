// ============================================================================
// ElgatoProfileParser — tests against REAL Elgato profile files
//
// Fixtures (src/main/profiles/elgato/__fixtures__/):
// - XL_Sample.streamDeckProfile: a real user-exported Stream Deck XL profile
//   holding SIX Profiles/<serial>/ copies of the same profile (as the app
//   produces when synced across devices). The fullest copy (32 keypad
//   actions, 8x4) must win serial selection.
// - StreamDeck_mac / StreamDeckPlus_mac / StreamDeckMini_macDefault: official
//   DefaultProfiles shipped inside the Stream Deck 7.6 app bundle.
// ============================================================================

import { describe, expect, it } from "vitest";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import {
  ElgatoProfileParseError,
  cleanupElgatoBundle,
  parseElgatoCoordinate,
  parseElgatoProfile,
} from "./ElgatoProfileParser";

const FIXTURES = fileURLToPath(new URL("./__fixtures__/", import.meta.url));

function fixture(name: string): string {
  return path.join(FIXTURES, name);
}

describe("parseElgatoCoordinate", () => {
  it("parses col,row coordinates", () => {
    expect(parseElgatoCoordinate("0,0")).toEqual({ col: 0, row: 0 });
    expect(parseElgatoCoordinate("7,3")).toEqual({ col: 7, row: 3 });
  });

  it("rejects malformed coordinates", () => {
    expect(parseElgatoCoordinate("7")).toBeNull();
    expect(parseElgatoCoordinate("x,y")).toBeNull();
    expect(parseElgatoCoordinate("-1,2")).toBeNull();
    expect(parseElgatoCoordinate("1,2,3")).toBeNull();
  });
});

describe("parseElgatoProfile (XL user export)", () => {
  it("extracts the file-level name and the fullest serial copy", async () => {
    const bundle = await parseElgatoProfile(fixture("XL_Sample.streamDeckProfile"));
    try {
      expect(bundle.name).toBe("Default Profile");
      // Six device copies; the fullest (32 keypad actions) must be chosen.
      expect(bundle.serial).toBe("MKJ2D9F1JT3PD37S199TIQ5RLCZ");
      const keypads = (bundle.deviceManifest.Controllers ?? []).filter(
        (c) => c.Type === "Keypad",
      );
      const actionCount = keypads.reduce(
        (n, c) => n + Object.keys(c.Actions ?? {}).length,
        0,
      );
      expect(actionCount).toBe(32);
      // Other serials are reported, not silently dropped.
      expect(
        bundle.warnings.some((w) => w.includes("skipped device copy")),
      ).toBe(true);
    } finally {
      await cleanupElgatoBundle(bundle);
    }
  });

  it("extraction dir exists while the bundle is open and is removed on cleanup", async () => {
    const bundle = await parseElgatoProfile(fixture("XL_Sample.streamDeckProfile"));
    try {
      const stat = await fsp.stat(bundle.sdProfileDir);
      expect(stat.isDirectory()).toBe(true);
      // Referenced images must resolve on disk inside the extraction.
      const manifest = bundle.deviceManifest;
      const keypad = (manifest.Controllers ?? []).find(
        (c) => c.Type === "Keypad",
      );
      const withImage = Object.values(keypad?.Actions ?? {}).find(
        (a) => a.States?.[0]?.Image,
      );
      expect(withImage).toBeDefined();
      const imagePath = path.join(
        bundle.serialDir,
        withImage!.States![0].Image!,
      );
      const img = await fsp.stat(imagePath);
      expect(img.isFile()).toBe(true);
      expect(img.size).toBeGreaterThan(0);
    } finally {
      await cleanupElgatoBundle(bundle);
      await expect(fsp.stat(bundle.tempDir)).rejects.toMatchObject({
        code: "ENOENT",
      });
    }
  });
});

describe("parseElgatoProfile (official DefaultProfiles)", () => {
  it("StreamDeck_macDefault → 15-action copy", async () => {
    const bundle = await parseElgatoProfile(
      fixture("StreamDeck_macDefault.streamDeckProfile"),
    );
    try {
      expect(bundle.name).toBe("Default Profile");
      expect(bundle.serial).toBe("EVVR1V274P5R17JP3685T1OW7CZ");
      const keypad = (bundle.deviceManifest.Controllers ?? []).find(
        (c) => c.Type === "Keypad",
      );
      expect(Object.keys(keypad?.Actions ?? {}).length).toBe(15);
    } finally {
      await cleanupElgatoBundle(bundle);
    }
  });

  it("StreamDeckPlus_macDefault → the Encoder-bearing (Plus layout) copy", async () => {
    const bundle = await parseElgatoProfile(
      fixture("StreamDeckPlus_macDefault.streamDeckProfile"),
    );
    try {
      expect(bundle.serial).toBe("L7PC8CE2F907B8T9AMF4C53RMKZ");
      const types = (bundle.deviceManifest.Controllers ?? []).map(
        (c) => c.Type,
      );
      expect(types).toContain("Encoder");
      expect(types).toContain("Keypad");
    } finally {
      await cleanupElgatoBundle(bundle);
    }
  });

  it("StreamDeckMini_macDefault → 6-action copy", async () => {
    const bundle = await parseElgatoProfile(
      fixture("StreamDeckMini_macDefault.streamDeckProfile"),
    );
    try {
      const keypad = (bundle.deviceManifest.Controllers ?? []).find(
        (c) => c.Type === "Keypad",
      );
      expect(Object.keys(keypad?.Actions ?? {}).length).toBe(6);
    } finally {
      await cleanupElgatoBundle(bundle);
    }
  });
});

describe("parseElgatoProfile (invalid input)", () => {
  it("rejects a file that is not a ZIP", async () => {
    const bogus = path.join(os.tmpdir(), `bigdeck-test-notazip-${Date.now()}.streamDeckProfile`);
    await fsp.writeFile(bogus, "this is not a zip file");
    try {
      await expect(parseElgatoProfile(bogus)).rejects.toThrow(
        ElgatoProfileParseError,
      );
    } finally {
      await fsp.rm(bogus, { force: true });
    }
  });

  it("rejects a ZIP without an .sdProfile directory", async () => {
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const zip = promisify(execFile);
    const dir = path.join(os.tmpdir(), `bigdeck-test-emptyzip-${Date.now()}`);
    await fsp.mkdir(path.join(dir, "random-dir"), { recursive: true });
    await fsp.writeFile(path.join(dir, "random-dir", "x.txt"), "no profile here");
    const zipPath = path.join(os.tmpdir(), `bigdeck-test-emptyzip-${Date.now()}.streamDeckProfile`);
    try {
      await zip("zip", ["-qr", zipPath, "."], { cwd: dir });
      await expect(parseElgatoProfile(zipPath)).rejects.toThrow(
        /no \*\.sdProfile directory/,
      );
    } finally {
      await fsp.rm(dir, { recursive: true, force: true });
      await fsp.rm(zipPath, { force: true });
    }
  });
});
