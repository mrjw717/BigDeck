// ============================================================================
// ElgatoProfileImporter — end-to-end import tests on REAL Elgato files
//
// Runs the full pipeline (unzip → parse → convert → ProfileManager save →
// asset copy) against the fixture zips. electron-store is replaced with an
// in-memory fake (same pattern as ProfileManager.test.ts) so no Electron is
// needed; assets land in a temp directory.
//
// Expected conversions are derived from the fixture contents (verified by
// inspecting each zip's manifests):
// - XL_Sample: fullest serial MKJ… = 32 keypad actions → 1 backtoparent
//   skipped, 1 hotkey (⌃⌘Space) + 30 text macros imported; 8x4 → "xl".
// - StreamDeckPlus_macDefault: chosen serial L7PC… = 6 keypad actions
//   (4 openchild skipped + 2 hotkeys imported) and 4 encoder actions
//   (warned, not imported).
// - StreamDeckMini_macDefault: 6 keypad actions, 1 website imported, rest
//   tutorials → 3x2 → "mini".
// - StreamDeck_macDefault: 15 keypad actions (backtoparent + 14 text) →
//   5x3 → "original".
// ============================================================================

import { describe, expect, it, vi } from "vitest";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import type { Logger } from "../../utils/Logger";

// Capture FakeStore instances so tests can read persisted state.
const hoisted = vi.hoisted(() => ({
  instances: [] as Array<{ data: Map<string, unknown> }>,
}));

vi.mock("electron-store", () => {
  class FakeStore {
    readonly data: Map<string, unknown>;
    constructor(opts?: { defaults?: Record<string, unknown> }) {
      this.data = new Map(Object.entries(opts?.defaults ?? {}));
      hoisted.instances.push(this);
    }
    get(key: string, fallback?: unknown): unknown {
      return this.data.has(key) ? this.data.get(key) : fallback;
    }
    set(key: string, value: unknown): void {
      this.data.set(key, value);
    }
  }
  return { default: FakeStore };
});

import { ProfileManager } from "../ProfileManager";
import { ElgatoProfileImporter } from "./ElgatoProfileImporter";
import type { MacroAction } from "../../../shared/types";

const FIXTURES = fileURLToPath(new URL("./__fixtures__/", import.meta.url));

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

function fixture(name: string): string {
  return path.join(FIXTURES, name);
}

async function importFixture(zipName: string) {
  const profileManager = new ProfileManager(silentLogger);
  const importer = new ElgatoProfileImporter(profileManager, silentLogger);
  const assetsDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), "bigdeck-elgato-assets-"),
  );
  const report = await importer.importFile(fixture(zipName), { assetsDir });
  return { report, profileManager, assetsDir };
}

/** Extraction dirs from the parser (assets dirs use a longer prefix). */
async function extractionTempDirs(): Promise<string[]> {
  return (await fsp.readdir(os.tmpdir())).filter(
    (n) =>
      n.startsWith("bigdeck-elgato-") && !n.startsWith("bigdeck-elgato-assets"),
  );
}

describe("ElgatoProfileImporter (real fixtures)", () => {
  it("imports the XL sample: 31 keys, xl device, images copied, profile persisted", async () => {
    const { report, profileManager, assetsDir } = await importFixture(
      "XL_Sample.streamDeckProfile",
    );

    expect(report.ok).toBe(true);
    expect(report.deviceType).toBe("xl");
    expect(report.profileName).toBe("Default Profile (Elgato)");
    expect(report.importedKeys).toBe(31);
    expect(report.profileId).toBeTruthy();
    expect(report.errors).toEqual([]);

    // The only skip: the back-to-parent button at key 0.
    expect(report.skippedKeys).toHaveLength(1);
    expect(report.skippedKeys[0]).toMatchObject({
      keyIndex: 0,
      uuid: "com.elgato.streamdeck.profile.backtoparent",
    });

    // Persisted through ProfileManager with a dense 32-key page.
    const profile = profileManager.getProfile(report.profileId!);
    expect(profile).not.toBeNull();
    expect(profile!.pages).toHaveLength(1);
    expect(profile!.pages[0].keys).toHaveLength(32);

    // ⌃⌘Space emoji-picker hotkey at col 1, row 0 → keyIndex 1.
    const hotkeyKey = profile!.pages[0].keys.find((k) => k.keyIndex === 1);
    expect(hotkeyKey?.action).toMatchObject({
      type: "keyboard-shortcut",
      keys: ["space"],
      modifiers: ["ctrl", "super"],
    });

    // Text action at col 0, row 1 → keyIndex 8 → macro typing 👎.
    const textKey = profile!.pages[0].keys.find((k) => k.keyIndex === 8);
    const macro = textKey?.action as MacroAction;
    expect(macro.type).toBe("macro");
    expect(macro.steps[0]).toEqual({ type: "text", value: "👎" });

    // Every image layer source exists in the asset dir (31 PNGs).
    const profileAny = profile!;
    const sources = profileAny.pages[0].keys.flatMap((k) =>
      (k.layers ?? []).filter((l) => l.type === "image").map((l) => l.source),
    );
    expect(sources.length).toBe(31);
    for (const source of sources) {
      const stat = await fsp.stat(path.join(assetsDir, source as string));
      expect(stat.size).toBeGreaterThan(0);
    }

    await fsp.rm(assetsDir, { recursive: true, force: true });
  });

  it("imports the Plus default profile: plus layout, encoder actions warned, openchild skipped", async () => {
    const { report } = await importFixture("StreamDeckPlus_macDefault.streamDeckProfile");

    expect(report.ok).toBe(true);
    expect(report.deviceType).toBe("plus");
    expect(report.importedKeys).toBe(2); // two ⌘-digit hotkeys
    expect(report.skippedKeys).toHaveLength(4); // openchild x4
    for (const skip of report.skippedKeys) {
      expect(skip.uuid).toBe("com.elgato.streamdeck.profile.openchild");
    }
    expect(report.warnings.join(" ")).toMatch(/4 encoder\/dial action/);
  });

  it("imports the Mini default profile: mini layout, tutorials skipped as unknown", async () => {
    const { report } = await importFixture("StreamDeckMini_macDefault.streamDeckProfile");

    expect(report.ok).toBe(true);
    expect(report.deviceType).toBe("mini");
    expect(report.importedKeys).toBe(1); // the website shortcut
    // backtoparent + 4 tutorial actions
    expect(report.skippedKeys).toHaveLength(5);
    expect(
      report.skippedKeys.filter((s) => s.reason.includes("unknown action UUID")),
    ).toHaveLength(4);
  });

  it("imports the Stream Deck (15-key) default profile: original layout, 14 text macros", async () => {
    const { report } = await importFixture("StreamDeck_macDefault.streamDeckProfile");

    expect(report.ok).toBe(true);
    expect(report.deviceType).toBe("original");
    expect(report.importedKeys).toBe(14);
    expect(report.skippedKeys).toHaveLength(1); // backtoparent
  });

  it("reports failure (ok=false) instead of throwing for a non-profile file", async () => {
    const bogus = path.join(
      os.tmpdir(),
      `bigdeck-import-bogus-${Date.now()}.streamDeckProfile`,
    );
    await fsp.writeFile(bogus, "definitely not a zip");
    try {
      const profileManager = new ProfileManager(silentLogger);
      const importer = new ElgatoProfileImporter(profileManager, silentLogger);
      const assetsDir = await fsp.mkdtemp(
        path.join(os.tmpdir(), "bigdeck-elgato-assets-"),
      );
      const report = await importer.importFile(bogus, { assetsDir });
      expect(report.ok).toBe(false);
      expect(report.profileId).toBeNull();
      expect(report.errors.join(" ")).toMatch(/not a readable ZIP/);
      expect(profileManager.getProfiles()).toHaveLength(0);
      await fsp.rm(assetsDir, { recursive: true, force: true });
    } finally {
      await fsp.rm(bogus, { force: true });
    }
  });

  it("cleans up its extraction temp directories", async () => {
    const before = new Set(await extractionTempDirs());
    const { assetsDir } = await importFixture(
      "StreamDeckMini_macDefault.streamDeckProfile",
    );
    const after = await extractionTempDirs();
    // Only pre-existing dirs may remain (parallel tests); none new.
    for (const name of after) {
      expect(before.has(name)).toBe(true);
    }
    await fsp.rm(assetsDir, { recursive: true, force: true });
  });
});
