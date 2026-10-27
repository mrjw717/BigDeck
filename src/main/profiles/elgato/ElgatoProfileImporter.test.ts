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
// - Discord_XL: the real Discord Essentials XL profile — 10 keypad actions
//   (8 com.elgato.discord.* → SD-plugin actions, 1 Windows-authored hotkey
//   skipped, 1 website), sparse 6x3 extent, "XL" in the name → "xl".
// ============================================================================

import { describe, expect, it, vi } from "vitest";
import fsp from "fs/promises";
import os from "os";
import path from "path";
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

const FIXTURES = path.join(__dirname, "__fixtures__");

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

function fixture(name: string): string {
  return path.join(FIXTURES, name);
}

async function importFixture(
  zipName: string,
  options: Partial<Parameters<ElgatoProfileImporter["importFile"]>[1]> = {},
) {
  const profileManager = new ProfileManager(silentLogger);
  const importer = new ElgatoProfileImporter(profileManager, silentLogger);
  const assetsDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), "bigdeck-elgato-assets-"),
  );
  const report = await importer.importFile(fixture(zipName), {
    assetsDir,
    ...options,
  });
  return { report, profileManager, assetsDir };
}

/** Stored image layers carry bigdeck-asset:// URLs — decode to file names. */
function assetFileName(source: unknown): string {
  return decodeURIComponent(String(source).replace("bigdeck-asset://", ""));
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

    // Every image layer source exists in the asset dir (31 PNGs), referenced
    // through the bigdeck-asset:// URL form the renderer/hardware resolve.
    const profileAny = profile!;
    const sources = profileAny.pages[0].keys.flatMap((k) =>
      (k.layers ?? []).filter((l) => l.type === "image").map((l) => l.source),
    );
    expect(sources.length).toBe(31);
    for (const source of sources) {
      expect(String(source)).toMatch(/^bigdeck-asset:\/\//);
      const stat = await fsp.stat(path.join(assetsDir, assetFileName(source)));
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

  it("imports the Mini default profile: mini layout, tutorials as SD-plugin actions", async () => {
    const { report } = await importFixture("StreamDeckMini_macDefault.streamDeckProfile");

    expect(report.ok).toBe(true);
    expect(report.deviceType).toBe("mini");
    // The website shortcut + 4 com.elgato.tutorial.* actions (imported as
    // SD-plugin actions — com.elgato.tutorial is not installed here).
    expect(report.importedKeys).toBe(5);
    expect(report.skippedKeys).toHaveLength(1); // backtoparent
    expect(report.skippedKeys[0].uuid).toBe(
      "com.elgato.streamdeck.profile.backtoparent",
    );
    expect(report.warnings.join(" ")).toMatch(
      /imported as SD plugin action \(plugin 'com\.elgato\.tutorial' not installed yet\)/,
    );
  });

  it("imports the Discord XL profile: xl via name, Discord keys as SD-plugin actions", async () => {
    const { report, profileManager, assetsDir } = await importFixture(
      "Discord_XL.streamDeckProfile",
    );

    expect(report.ok).toBe(true);
    // Sparse 6x3 filled extent matches no footprint; the "XL" name decides.
    expect(report.deviceType).toBe("xl");
    expect(report.profileName).toBe("Discord XL (Elgato)");
    // 8 com.elgato.discord.* → SD-plugin actions + 1 website. The quick
    // switcher hotkey is Windows-authored (VKeyCode 75 = Windows K, not a
    // macOS virtual keycode) and is skipped with a report entry.
    expect(report.importedKeys).toBe(9);
    expect(report.skippedKeys).toHaveLength(1);
    expect(report.skippedKeys[0]).toMatchObject({
      keyIndex: 18,
      uuid: "com.elgato.streamdeck.system.hotkey",
    });
    expect(report.skippedKeys[0].reason).toMatch(/no mappable macOS VKeyCode/);

    // Persisted with a dense 32-key page; mute sits at (0,0) → keyIndex 0,
    // notifs at (0,2) → keyIndex 16 (identity on the XL grid).
    const profile = profileManager.getProfile(report.profileId!);
    expect(profile!.pages[0].keys).toHaveLength(32);
    const mute = profile!.pages[0].keys.find((k) => k.keyIndex === 0);
    expect(mute?.action).toMatchObject({
      type: "sdplugin",
      pluginUUID: "com.elgato.discord",
      actionUUID: "com.elgato.discord.mute",
    });
    expect(
      profile!.pages[0].keys.find((k) => k.keyIndex === 16)?.action,
    ).toMatchObject({
      type: "sdplugin",
      actionUUID: "com.elgato.discord.notifications",
    });

    // 5 multi-state warnings + 8 "not installed yet" notes + 1 unmappable
    // (Windows-authored) hotkey keycode note.
    expect(report.warnings).toHaveLength(14);
    expect(report.warnings.join(" ")).toMatch(/2 states/);
    expect(report.warnings.join(" ")).toMatch(/VKeyCode 75/);
    expect(report.warnings.join(" ")).toMatch(
      /imported as SD plugin action \(plugin 'com\.elgato\.discord' not installed yet\)/,
    );

    // Imported button art: 10 image layers, all resolving to real files.
    const sources = profile!.pages[0].keys.flatMap((k) =>
      (k.layers ?? []).filter((l) => l.type === "image").map((l) => l.source),
    );
    expect(sources).toHaveLength(10);
    for (const source of sources) {
      const stat = await fsp.stat(path.join(assetsDir, assetFileName(source)));
      expect(stat.size).toBeGreaterThan(0);
    }
    expect(sources.some((s) => String(s).includes("elgato-dmute.png"))).toBe(true);

    await fsp.rm(assetsDir, { recursive: true, force: true });
  });

  it("resolves the plugin boundary for dotted action UUIDs via the installed-plugin list", async () => {
    // com.elgato.discord.pushto.talk would naive-split to
    // com.elgato.discord.pushto; the installed manifest knows better.
    const { report, profileManager } = await importFixture(
      "Discord_XL.streamDeckProfile",
      { installedSdPlugins: ["com.elgato.discord"] },
    );

    expect(report.ok).toBe(true);
    const profile = profileManager.getProfile(report.profileId!)!;
    const actions = profile.pages[0].keys.flatMap((k) => (k.action ? [k.action] : []))
      .filter((a) => a.type === "sdplugin");
    expect(actions).toHaveLength(8);
    for (const action of actions) {
      expect(action.pluginUUID).toBe("com.elgato.discord");
    }
    // Installed → no "not installed yet" notes; 5 multi-state + the hotkey
    // keycode note.
    expect(report.warnings).toHaveLength(6);
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
