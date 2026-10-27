// ============================================================================
// ElgatoToBigDeck — converter unit tests
//
// Synthetic Elgato bundles exercise every mapping-table branch without the
// filesystem (importImage is mocked). The hotkey fixtures use REAL Settings
// values taken from a user-exported XL profile (Profiles/8ITTTOI9OT7Q36A6QHW
// JNLN5G8Z/manifest.json) — the ctrl-less ⌘V / ⌘Z entries — so the macOS
// virtual-keycode table is validated against actual Elgato output.
// ============================================================================

import { describe, expect, it, vi } from "vitest";
import type { ElgatoAction, ElgatoController, ElgatoProfileBundle } from "./ElgatoProfileParser";
import {
  MAC_VK_TO_KEY,
  convertElgatoAction,
  convertElgatoProfile,
  convertHotkeySettings,
  classifyOpenPath,
  inferDeviceType,
  inferDeviceTypeFromName,
  normalizeElgatoTitle,
  splitSdPluginUuid,
} from "./ElgatoToBigDeck";
import type { Action, KeyLayer } from "../../../shared/types";

// --- helpers -----------------------------------------------------------------

function makeBundle(
  controllers: ElgatoController[],
  overrides: Partial<ElgatoProfileBundle> = {},
): ElgatoProfileBundle {
  return {
    tempDir: "/tmp/unused",
    sdProfileDir: "/tmp/unused/EA85F679-78E4-4964-8F58-AEC5D386A85D.sdProfile",
    serial: "TESTSERIAL01",
    serialDir:
      "/tmp/unused/EA85F679-78E4-4964-8F58-AEC5D386A85D.sdProfile/Profiles/TESTSERIAL01",
    name: "",
    deviceManifest: { Controllers: controllers },
    fileManifest: {},
    warnings: [],
    ...overrides,
  };
}

function keypad(actions: Record<string, ElgatoAction>): ElgatoController {
  return { Type: "Keypad", Actions: actions };
}

function elgatoAction(partial: Partial<ElgatoAction>): ElgatoAction {
  return { ActionID: "instance-uuid", UUID: "", ...partial };
}

const stubImageImport = async (_p: string, suggested: string) => suggested;

// --- macOS VK table ------------------------------------------------------------

describe("MAC_VK_TO_KEY", () => {
  it("maps the hotkeys found in real Elgato profiles", () => {
    // From the XL sample: escape(53), ⌘Z(6), ⌘V(9), ⇧⌘4(21), space(49)
    expect(MAC_VK_TO_KEY[53]).toBe("escape");
    expect(MAC_VK_TO_KEY[6]).toBe("z");
    expect(MAC_VK_TO_KEY[9]).toBe("v");
    expect(MAC_VK_TO_KEY[21]).toBe("4");
    expect(MAC_VK_TO_KEY[49]).toBe("space");
    expect(MAC_VK_TO_KEY[122]).toBe("f1");
    expect(MAC_VK_TO_KEY[126]).toBe("up");
  });
});

// --- hotkey conversion -----------------------------------------------------------

describe("convertHotkeySettings", () => {
  const warnings: string[] = [];

  it("converts a plain modifier-less key (escape, VKeyCode 53)", () => {
    expect(
      convertHotkeySettings(
        { Hotkeys: [{ VKeyCode: 53, KeyCtrl: false, KeyShift: false, KeyCmd: false }] },
        warnings,
      ),
    ).toEqual({ keys: ["escape"], modifiers: [] });
  });

  it("converts ⌘Z (KeyCmd → super)", () => {
    expect(
      convertHotkeySettings(
        { Hotkeys: [{ VKeyCode: 6, KeyCtrl: false, KeyShift: false, KeyCmd: true }] },
        warnings,
      ),
    ).toEqual({ keys: ["z"], modifiers: ["super"] });
  });

  it("converts ⌘V — the ctrl-less V entry", () => {
    expect(
      convertHotkeySettings(
        { Hotkeys: [{ VKeyCode: 9, KeyCtrl: false, KeyShift: false, KeyCmd: true }] },
        warnings,
      ),
    ).toEqual({ keys: ["v"], modifiers: ["super"] });
  });

  it("converts ⇧⌘4 (multi-modifier)", () => {
    expect(
      convertHotkeySettings(
        { Hotkeys: [{ VKeyCode: 21, KeyCtrl: false, KeyShift: true, KeyCmd: true }] },
        warnings,
      ),
    ).toEqual({ keys: ["4"], modifiers: ["shift", "super"] });
  });

  it("maps KeyOption to alt, KeyAlt to alt, with KeyAlt taking precedence", () => {
    const viaOption = convertHotkeySettings(
      { Hotkeys: [{ VKeyCode: 0, KeyOption: true }] },
      warnings,
    );
    expect(viaOption?.modifiers).toEqual(["alt"]);
    const viaAlt = convertHotkeySettings(
      { Hotkeys: [{ VKeyCode: 0, KeyAlt: true }] },
      warnings,
    );
    expect(viaAlt?.modifiers).toEqual(["alt"]);
    const both = convertHotkeySettings(
      { Hotkeys: [{ VKeyCode: 0, KeyAlt: true, KeyOption: true }] },
      warnings,
    );
    expect(both?.modifiers).toEqual(["alt"]);
  });

  it("skips unused recorder slots (VKeyCode -1)", () => {
    expect(
      convertHotkeySettings(
        {
          Hotkeys: [
            { VKeyCode: -1 },
            { VKeyCode: 6, KeyCmd: true },
            { VKeyCode: -1 },
            { VKeyCode: -1 },
          ],
        },
        warnings,
      ),
    ).toEqual({ keys: ["z"], modifiers: ["super"] });
  });

  it("returns null when every slot is unused", () => {
    expect(convertHotkeySettings({ Hotkeys: [{ VKeyCode: -1 }, { VKeyCode: -1 }] }, warnings)).toBeNull();
    expect(convertHotkeySettings({}, warnings)).toBeNull();
  });

  it("returns null with a warning for unmappable keycodes", () => {
    const localWarnings: string[] = [];
    expect(
      convertHotkeySettings({ Hotkeys: [{ VKeyCode: 90 }] }, localWarnings),
    ).toBeNull();
    expect(localWarnings.join(" ")).toMatch(/VKeyCode 90/);
  });

  it("imports only the first of a multi-key sequence and warns", () => {
    const localWarnings: string[] = [];
    const combo = convertHotkeySettings(
      { Hotkeys: [{ VKeyCode: 6, KeyCmd: true }, { VKeyCode: 0 }] },
      localWarnings,
    );
    expect(combo?.keys).toEqual(["z"]);
    expect(localWarnings.join(" ")).toMatch(/sequential keys/);
  });
});

// --- open-path heuristics ---------------------------------------------------------

describe("classifyOpenPath", () => {
  it("strips Elgato's literal quotes", () => {
    expect(classifyOpenPath('"/Applications/Mail.app"').value).toBe(
      "/Applications/Mail.app",
    );
  });

  it("URLs → open-url", () => {
    expect(classifyOpenPath("https://example.com").type).toBe("open-url");
  });

  it("app bundles/executables → launch-app", () => {
    expect(classifyOpenPath('"/System/Applications/Calculator.app"').type).toBe("launch-app");
    expect(classifyOpenPath("tool.sh").type).toBe("launch-app");
  });

  it("everything else → open-folder", () => {
    expect(classifyOpenPath('"/"').type).toBe("open-folder");
    expect(classifyOpenPath('"/Users/josh/Documents"').type).toBe("open-folder");
  });
});

// --- single-action conversion ------------------------------------------------------

describe("convertElgatoAction", () => {
  const warnings: string[] = [];

  it("website → open-url from Settings.path", () => {
    const result = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.streamdeck.system.website",
        Name: "Website",
        Settings: { openInBrowser: true, path: "https://elgato.com" },
      }),
      warnings,
    );
    expect(result.action).toMatchObject({ type: "open-url", url: "https://elgato.com" });
  });

  it("website accepts the older Url spelling", () => {
    const result = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.streamdeck.system.website",
        Settings: { Url: "https://old.example" },
      }),
      warnings,
    );
    expect(result.action).toMatchObject({ type: "open-url", url: "https://old.example" });
  });

  it("multimedia actionIdx → mediaCommand (icon-verified table)", () => {
    const expected: Array<[number, string]> = [
      [0, "previous"],
      [1, "play-pause"],
      [2, "next"],
      [3, "stop"],
      [4, "mute"],
      [5, "volume-up"],
      [6, "volume-down"],
    ];
    for (const [idx, command] of expected) {
      const result = convertElgatoAction(
        elgatoAction({
          UUID: "com.elgato.streamdeck.system.multimedia",
          Settings: { actionIdx: idx },
        }),
        warnings,
      );
      expect(result.action).toMatchObject({
        type: "multimedia",
        mediaCommand: command,
      });
    }
  });

  it("unknown multimedia actionIdx is rejected", () => {
    const result = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.streamdeck.system.multimedia",
        Settings: { actionIdx: 18 },
      }),
      warnings,
    );
    expect(result.reason).toMatch(/actionIdx 18/);
  });

  it("open .app → launch-app, / → open-folder", () => {
    const app = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.streamdeck.system.open",
        Settings: { path: '"/System/Applications/Mail.app"' },
      }),
      warnings,
    );
    expect(app.action).toMatchObject({
      type: "launch-app",
      command: "/System/Applications/Mail.app",
    });
    const folder = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.streamdeck.system.open",
        Settings: { path: '"/"' },
      }),
      warnings,
    );
    expect(folder.action).toMatchObject({ type: "open-folder", path: "/" });
  });

  it("text → macro with pastedText (+ enter step when isSendingEnter)", () => {
    const plain = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.streamdeck.system.text",
        Settings: { isSendingEnter: false, pastedText: "👎" },
      }),
      warnings,
    );
    expect(plain.action).toMatchObject({
      type: "macro",
      steps: [{ type: "text", value: "👎" }],
    });
    const withEnter = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.streamdeck.system.text",
        Settings: { isSendingEnter: true, pastedText: "hi" },
      }),
      warnings,
    );
    expect(withEnter.action).toMatchObject({
      type: "macro",
      steps: [
        { type: "text", value: "hi" },
        { type: "key", value: "enter" },
      ],
    });
  });

  it("sleep → system-sleep", () => {
    const result = convertElgatoAction(
      elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep", Name: "Sleep" }),
      warnings,
    );
    expect(result.action).toMatchObject({ type: "system-sleep" });
  });

  it("close → close-app with the quoted target stripped", () => {
    const result = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.streamdeck.system.close",
        Settings: { path: '"Firefox"' },
      }),
      warnings,
    );
    expect(result.action).toMatchObject({ type: "close-app", target: "Firefox" });
  });

  it("deliberately-unsupported UUIDs return specific reasons", () => {
    const cases: Array<[string, RegExp]> = [
      ["com.elgato.streamdeck.system.keybrightness", /brightness/],
      ["com.elgato.streamdeck.profile.openchild", /cross-profile/],
      ["com.elgato.streamdeck.profile.backtoparent", /cross-profile/],
      ["com.elgato.streamdeck.page.next", /page navigation/],
      ["com.elgato.streamdeck.page.previous", /page navigation/],
    ];
    for (const [uuid, reason] of cases) {
      const result = convertElgatoAction(elgatoAction({ UUID: uuid }), warnings);
      expect(result.action).toBeUndefined();
      expect(result.reason).toMatch(reason);
    }
  });

  it("unknown UUID → SD-plugin action (UUID minus its last dot-segment)", () => {
    const result = convertElgatoAction(
      elgatoAction({
        UUID: "com.elgato.discord.mute",
        Name: "Mute Mic",
        Settings: { isInMultiAction: false },
      }),
      warnings,
    );
    expect(result.reason).toBeUndefined();
    expect(result.action).toMatchObject({
      type: "sdplugin",
      pluginUUID: "com.elgato.discord",
      actionUUID: "com.elgato.discord.mute",
      settings: { isInMultiAction: false },
      name: "Mute Mic",
    });
  });

  it("installed-plugin prefix wins over the dot-segment guess (longest match)", () => {
    const installed = ["com.elgato.discord"];
    // pushto.talk strips to com.elgato.discord.pushto by last-segment, but
    // the installed manifest knows the real plugin boundary.
    const result = convertElgatoAction(
      elgatoAction({ UUID: "com.elgato.discord.pushto.talk" }),
      warnings,
      installed,
    );
    expect(result.action).toMatchObject({
      type: "sdplugin",
      pluginUUID: "com.elgato.discord",
      actionUUID: "com.elgato.discord.pushto.talk",
    });
  });

  it("malformed UUIDs (no splittable plugin boundary) stay skips", () => {
    const missing = convertElgatoAction(elgatoAction({ UUID: "" }), warnings);
    expect(missing.action).toBeUndefined();
    expect(missing.reason).toMatch(/unknown action UUID/);
    const noDots = convertElgatoAction(
      elgatoAction({ UUID: "justaname" }),
      warnings,
    );
    expect(noDots.action).toBeUndefined();
    expect(noDots.reason).toMatch(/unknown action UUID "justaname"/);
  });
});

// --- title / device inference helpers ------------------------------------------------

describe("normalizeElgatoTitle", () => {
  it("collapses the spacer-newline pattern to single spaces", () => {
    expect(normalizeElgatoTitle("Screen\n\n\n\nShot")).toBe("Screen Shot");
    expect(normalizeElgatoTitle("Undo")).toBe("Undo");
    expect(normalizeElgatoTitle("  padded  ")).toBe("padded");
  });
});

describe("inferDeviceType", () => {
  it("maps filled extents to canonical device types", () => {
    expect(inferDeviceType(8, 4)).toBe("xl");
    expect(inferDeviceType(5, 3)).toBe("original");
    expect(inferDeviceType(3, 2)).toBe("mini");
    expect(inferDeviceType(4, 2)).toBe("plus");
    expect(inferDeviceType(3, 1)).toBe("pedal");
    expect(inferDeviceType(99, 99)).toBeNull();
  });
});

describe("inferDeviceTypeFromName", () => {
  it("recognizes device keywords across real-world name shapes", () => {
    expect(inferDeviceTypeFromName("Discord (XL)")).toBe("xl");
    expect(inferDeviceTypeFromName("StreamDeckXL_macDefault")).toBe("xl");
    expect(inferDeviceTypeFromName("Stream Deck MK.2")).toBe("mk2");
    expect(inferDeviceTypeFromName("My Pedal layout")).toBe("pedal");
  });

  it("returns null for names without a device keyword", () => {
    expect(inferDeviceTypeFromName("Default Profile")).toBeNull();
    expect(inferDeviceTypeFromName("")).toBeNull();
    // "minimal" only CONTAINS "mini" — keyword matching is token-exact.
    expect(inferDeviceTypeFromName("Minimal Deck")).toBeNull();
  });

  it("uses the filled extent to break ties between matched keywords", () => {
    // The combined official default profile ships for both devices.
    expect(inferDeviceTypeFromName("StreamDeckPlusXL_macDefault", 4, 2)).toBe("plus");
    expect(inferDeviceTypeFromName("StreamDeckPlusXL_macDefault", 8, 4)).toBe("xl");
    // No extent information → keyword priority (xl first).
    expect(inferDeviceTypeFromName("StreamDeckPlusXL_macDefault")).toBe("xl");
  });
});

describe("splitSdPluginUuid", () => {
  it("prefers the longest installed plugin that prefixes the UUID", () => {
    expect(
      splitSdPluginUuid("com.elgato.discord.pushto.talk", [
        "com.elgato",
        "com.elgato.discord",
      ]),
    ).toBe("com.elgato.discord");
  });

  it("falls back to the last dot-segment and rejects malformed UUIDs", () => {
    expect(splitSdPluginUuid("com.elgato.discord.mute")).toBe("com.elgato.discord");
    expect(splitSdPluginUuid("justaname")).toBeNull();
    expect(splitSdPluginUuid(".leadingdot")).toBeNull();
    expect(splitSdPluginUuid("trailingdot.")).toBeNull();
    expect(splitSdPluginUuid("com.elgato.discord.mute", [])).toBe("com.elgato.discord");
  });
});

// --- full conversion ------------------------------------------------------------------

describe("convertElgatoProfile", () => {
  it("maps col,row → keyIndex = row * columns + col and fills a dense key list", async () => {
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep", Name: "Top Left" }),
        "7,3": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep", Name: "Bottom Right" }),
      }),
    ]);
    const result = await convertElgatoProfile(bundle, {
      importImage: stubImageImport,
    });

    expect(result.profile.deviceType).toBe("xl"); // 8x4 extent
    expect(result.importedKeys).toBe(2);
    const page = result.profile.pages[0];
    expect(page.keys).toHaveLength(32); // dense XL key list
    expect(page.keys.find((k) => k.keyIndex === 0)?.action).toMatchObject({ name: "Top Left" });
    expect(page.keys.find((k) => k.keyIndex === 31)?.action).toMatchObject({ name: "Bottom Right" });
    expect(page.keys.filter((k) => k.action === undefined)).toHaveLength(30);
  });

  it("suffixes the profile name and falls back to the source file name", async () => {
    const named = await convertElgatoProfile(
      makeBundle([keypad({ "0,0": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep" }) })], {
        name: "My Deck",
      }),
      { importImage: stubImageImport },
    );
    expect(named.profile.name).toBe("My Deck (Elgato)");

    const unnamed = await convertElgatoProfile(
      makeBundle([keypad({ "0,0": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep" }) })]),
      { sourceName: "StreamDeckXL_macDefault", importImage: stubImageImport },
    );
    expect(unnamed.profile.name).toBe("StreamDeckXL_macDefault (Elgato)");
  });

  it("reports skipped keys for unsupported UUIDs and imports unknown ones as SD-plugin actions", async () => {
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({
          UUID: "com.elgato.streamdeck.profile.backtoparent",
          ActionID: "skip-1",
        }),
        "1,0": elgatoAction({
          UUID: "com.elgato.tutorial.accounts",
          ActionID: "sdplug-1",
        }),
        "2,0": elgatoAction({
          UUID: "com.elgato.streamdeck.system.sleep",
          ActionID: "keep-1",
        }),
      }),
    ]);
    const result = await convertElgatoProfile(bundle, {
      deviceType: "original",
      importImage: stubImageImport,
    });
    expect(result.importedKeys).toBe(2);
    expect(result.skippedKeys).toEqual([
      {
        keyIndex: 0,
        uuid: "com.elgato.streamdeck.profile.backtoparent",
        reason: expect.stringMatching(/cross-profile/),
      },
    ]);
    // Unknown UUID became an SD-plugin action with an informational note.
    const page = result.profile.pages[0];
    expect(page.keys.find((k) => k.keyIndex === 1)?.action).toMatchObject({
      type: "sdplugin",
      pluginUUID: "com.elgato.tutorial",
      actionUUID: "com.elgato.tutorial.accounts",
    });
    expect(result.warnings.join(" ")).toMatch(
      /key 1 \(com\.elgato\.tutorial\.accounts\): imported as SD plugin action \(plugin 'com\.elgato\.tutorial' not installed yet\)/,
    );
  });

  it("silences the SD-plugin note when the plugin is already installed", async () => {
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({ UUID: "com.elgato.discord.mute" }),
      }),
    ]);
    const installed = await convertElgatoProfile(bundle, {
      installedSdPlugins: ["com.elgato.discord"],
      importImage: stubImageImport,
    });
    expect(installed.importedKeys).toBe(1);
    expect(installed.warnings).toEqual([]);

    const notInstalled = await convertElgatoProfile(bundle, {
      importImage: stubImageImport,
    });
    expect(notInstalled.warnings.join(" ")).toMatch(/not installed yet/);
  });

  it("keeps a sparse named-XL profile identity-mapped on the XL grid", async () => {
    // The real Discord XL shape: 10 keys spread over columns 0-5 fill a 6x3
    // extent that matches no device footprint — the profile NAME picks xl.
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({ UUID: "com.elgato.discord.mute" }),
        "5,0": elgatoAction({ UUID: "com.elgato.discord.streamtoggle" }),
        "3,2": elgatoAction({
          UUID: "com.elgato.streamdeck.system.website",
          Settings: { path: "https://discord.com/app" },
        }),
      }),
    ], { name: "Discord XL" });
    const result = await convertElgatoProfile(bundle, {
      importImage: stubImageImport,
    });
    expect(result.profile.deviceType).toBe("xl");
    const page = result.profile.pages[0];
    expect(page.keys).toHaveLength(32);
    expect(page.keys.find((k) => k.keyIndex === 0)?.action).toMatchObject({ type: "sdplugin" });
    expect(page.keys.find((k) => k.keyIndex === 5)?.action).toMatchObject({ type: "sdplugin" });
    expect(page.keys.find((k) => k.keyIndex === 19)?.action).toMatchObject({ type: "open-url" });
  });

  it("clamps XL coordinates onto a smaller explicit target grid, reporting collisions", async () => {
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep", Name: "Top Left" }),
        "7,3": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep", Name: "Bottom Right" }),
        "6,2": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep", Name: "Clashed" }),
      }),
    ]);
    const result = await convertElgatoProfile(bundle, {
      deviceType: "original", // 5x3 target
      importImage: stubImageImport,
    });
    expect(result.profile.deviceType).toBe("original");
    const page = result.profile.pages[0];
    expect(page.keys).toHaveLength(15);
    expect(page.keys.find((k) => k.keyIndex === 0)?.action).toMatchObject({ name: "Top Left" });
    // "7,3" clamps onto the bottom-right corner (4,2) → keyIndex 14.
    expect(page.keys.find((k) => k.keyIndex === 14)?.action).toMatchObject({ name: "Bottom Right" });
    // "6,2" clamps onto the same corner — reported, not silently merged.
    expect(result.skippedKeys).toEqual([
      {
        keyIndex: 14,
        uuid: "com.elgato.streamdeck.system.sleep",
        reason: expect.stringMatching(/rescaled onto an occupied key/),
      },
    ]);
  });

  it("imports state images as an image layer via importImage", async () => {
    const importImage = vi.fn(async (_p: string, suggested: string) => suggested);
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({
          UUID: "com.elgato.streamdeck.system.sleep",
          State: 0,
          States: [{ Image: "Images/ABCDEF.png", Title: "Undo", ShowTitle: true, TitleColor: "#ffffff", TitleAlignment: "bottom" }],
        }),
      }),
    ]);
    const result = await convertElgatoProfile(bundle, { importImage });

    expect(importImage).toHaveBeenCalledWith(
      "/tmp/unused/EA85F679-78E4-4964-8F58-AEC5D386A85D.sdProfile/Profiles/TESTSERIAL01/Images/ABCDEF.png",
      "elgato-ABCDEF.png",
    );
    const key = result.profile.pages[0].keys[0];
    const layers = key.layers as KeyLayer[];
    expect(layers).toHaveLength(2);
    expect(layers[0]).toMatchObject({
      type: "image",
      source: "bigdeck-asset://elgato-ABCDEF.png",
      order: 0,
      fit: "contain",
    });
    expect(layers[1]).toMatchObject({
      type: "text",
      text: "Undo",
      textColor: "#ffffff",
      y: 82, // TitleAlignment "bottom"
      order: 1,
    });
  });

  it("uses the active state's image and warns about extra states", async () => {
    const importImage = vi.fn(async (_p: string, suggested: string) => suggested);
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({
          UUID: "com.elgato.streamdeck.system.sleep",
          State: 1,
          States: [{ Image: "Images/FIRST.png" }, { Image: "Images/SECOND.png" }],
        }),
      }),
    ]);
    const result = await convertElgatoProfile(bundle, { importImage });
    expect(importImage).toHaveBeenCalledWith(expect.any(String), "elgato-SECOND.png");
    expect(result.warnings.join(" ")).toMatch(/2 states/);
  });

  it("rejects image paths escaping the profile dir without calling importImage", async () => {
    const importImage = vi.fn(async (_p: string, suggested: string) => suggested);
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({
          UUID: "com.elgato.streamdeck.system.sleep",
          States: [{ Image: "../../../etc/passwd.png" }],
        }),
      }),
    ]);
    const result = await convertElgatoProfile(bundle, { importImage });
    expect(importImage).not.toHaveBeenCalled();
    expect(result.skippedKeys[0].reason).toMatch(/unsafe image path/);
  });

  it("warns about encoder actions and imports only the keypad", async () => {
    const bundle = makeBundle([
      {
        Type: "Encoder",
        Actions: {
          "0,0": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep" }),
          "1,0": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep" }),
        },
      },
      keypad({ "0,0": elgatoAction({ UUID: "com.elgato.streamdeck.system.sleep" }) }),
    ]);
    const result = await convertElgatoProfile(bundle, { importImage: stubImageImport });
    expect(result.importedKeys).toBe(1);
    expect(result.warnings.join(" ")).toMatch(/2 encoder\/dial action/);
  });

  it("throws when there are no keypad actions at all", async () => {
    const bundle = makeBundle([{ Type: "Keypad", Actions: {} }]);
    await expect(
      convertElgatoProfile(bundle, { importImage: stubImageImport }),
    ).rejects.toThrow(/no Keypad actions/);
  });

  it("reuses Elgato ActionIDs as key ids for traceability", async () => {
    const bundle = makeBundle([
      keypad({
        "0,0": elgatoAction({
          ActionID: "976e55a7-f888-46d0-b93a-6d8a54909fd9",
          UUID: "com.elgato.streamdeck.system.sleep",
        }),
      }),
    ]);
    const result = await convertElgatoProfile(bundle, { importImage: stubImageImport });
    const key = result.profile.pages[0].keys.find((k) => k.keyIndex === 0)!;
    expect(key.id).toBe("976e55a7-f888-46d0-b93a-6d8a54909fd9");
    expect((key.action as Action).id).toBe("976e55a7-f888-46d0-b93a-6d8a54909fd9");
  });
});
