// ============================================================================
// SDManifest — parsing/validation and CodePath resolution tests
//
// Guards the contract from docs/SDPLUGIN-COMPAT.md: required identity fields,
// per-action validation, the linux CodePath selection policy (explicit
// CodePath > CodePathMac on linux; never CodePathWin), and the
// "platform unverified" flag when OS[] has no linux entry.
// ============================================================================

import { describe, it, expect } from "vitest";
import { parseSDManifest, resolveCodePath, type SDManifest } from "./SDManifest";

function validManifest(): Record<string, unknown> {
  return {
    Name: "Fake Plugin",
    UUID: "com.bigdeck.test.fake",
    Version: "1.2.3",
    Author: "BigDeck",
    SDKVersion: 2,
    Software: { MinimumVersion: "6.0" },
    OS: [{ Platform: "mac", MinimumVersion: "12" }],
    CodePathMac: "plugin.js",
    Actions: [
      {
        UUID: "com.bigdeck.test.fake.action",
        Name: "Fake Action",
        Icon: "imgs/action",
        Controllers: ["Keypad"],
        States: [{ Image: "imgs/action" }],
        Tooltip: "Does nothing, reliably",
      },
    ],
  };
}

describe("parseSDManifest", () => {
  it("accepts a valid manifest and maps its fields", () => {
    const result = parseSDManifest(validManifest());

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.manifest).not.toBeNull();
    const m = result.manifest as SDManifest;
    expect(m.UUID).toBe("com.bigdeck.test.fake");
    expect(m.Name).toBe("Fake Plugin");
    expect(m.Version).toBe("1.2.3");
    expect(m.Software?.MinimumVersion).toBe("6.0");
    expect(m.OS).toEqual([{ Platform: "mac", MinimumVersion: "12" }]);
    expect(m.Actions).toHaveLength(1);
    expect(m.Actions[0].Controllers).toEqual(["Keypad"]);
    expect(m.Actions[0].States).toEqual([{ Image: "imgs/action" }]);
  });

  it("rejects a non-object payload", () => {
    expect(parseSDManifest("nope").ok).toBe(false);
    expect(parseSDManifest(null).ok).toBe(false);
    expect(parseSDManifest([1, 2]).ok).toBe(false);
  });

  it("collects missing required identity fields", () => {
    const raw = validManifest();
    delete raw.UUID;
    delete raw.Version;

    const result = parseSDManifest(raw);
    expect(result.ok).toBe(false);
    expect(result.manifest).toBeNull();
    expect(result.errors.some((e) => e.startsWith("UUID"))).toBe(true);
    expect(result.errors.some((e) => e.startsWith("Version"))).toBe(true);
  });

  it("rejects an empty Name", () => {
    const raw = validManifest();
    raw.Name = "";

    const result = parseSDManifest(raw);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.startsWith("Name"))).toBe(true);
  });

  it("requires UUID and Name on every action", () => {
    const raw = validManifest();
    (raw.Actions as Array<Record<string, unknown>>).push({ Name: "No UUID" });

    const result = parseSDManifest(raw);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Actions[1].UUID"))).toBe(true);
  });

  it("rejects unknown controller values", () => {
    const raw = validManifest();
    (raw.Actions as Array<Record<string, unknown>>)[0].Controllers = ["Keypad", "Touchpad"];

    const result = parseSDManifest(raw);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown value"))).toBe(true);
  });

  it("accepts both Keypad and Encoder controllers", () => {
    const raw = validManifest();
    (raw.Actions as Array<Record<string, unknown>>)[0].Controllers = ["Keypad", "Encoder"];

    const result = parseSDManifest(raw);
    expect(result.ok).toBe(true);
    expect(result.manifest?.Actions[0].Controllers).toEqual(["Keypad", "Encoder"]);
  });

  it("parses PrivateAPI manifests successfully but flags them", () => {
    const raw = { ...validManifest(), PrivateAPI: true };

    const result = parseSDManifest(raw);
    // Parsing succeeds — the LOADER must refuse to spawn PrivateAPI plugins.
    expect(result.ok).toBe(true);
    expect(result.manifest?.PrivateAPI).toBe(true);
  });

  it("rejects a non-array OS field", () => {
    const raw = validManifest();
    raw.OS = "mac";

    const result = parseSDManifest(raw);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.startsWith("OS"))).toBe(true);
  });
});

describe("resolveCodePath", () => {
  const dir = "/plugins/fake.sdPlugin";

  it("prefers an explicit CodePath over platform entries", () => {
    const parsed = parseSDManifest({
      ...validManifest(),
      CodePath: "bin/run.sh",
      CodePathMac: "plugin.js",
    });
    const res = resolveCodePath(parsed.manifest as SDManifest, {
      pluginDir: dir,
      platform: "linux",
    });

    expect(res.codePath).toBe("/plugins/fake.sdPlugin/bin/run.sh");
    expect(res.source).toBe("CodePath");
  });

  it("falls back to CodePathMac on linux (many are portable scripts)", () => {
    const parsed = parseSDManifest(validManifest());
    const res = resolveCodePath(parsed.manifest as SDManifest, {
      pluginDir: dir,
      platform: "linux",
    });

    expect(res.codePath).toBe("/plugins/fake.sdPlugin/plugin.js");
    expect(res.source).toBe("CodePathMac");
  });

  it("never picks CodePathWin on linux", () => {
    const raw = validManifest();
    delete raw.CodePathMac;
    raw.CodePathWin = "plugin.cmd";
    const parsed = parseSDManifest(raw);
    const res = resolveCodePath(parsed.manifest as SDManifest, {
      pluginDir: dir,
      platform: "linux",
    });

    expect(res.codePath).toBeNull();
    expect(res.source).toBeNull();
  });

  it("picks CodePathWin on win32", () => {
    const raw = validManifest();
    raw.CodePathWin = "plugin.exe";
    const parsed = parseSDManifest(raw);
    const res = resolveCodePath(parsed.manifest as SDManifest, {
      pluginDir: dir,
      platform: "win32",
    });

    expect(res.codePath).toBe("/plugins/fake.sdPlugin/plugin.exe");
    expect(res.source).toBe("CodePathWin");
  });

  it("skips candidates whose file is missing from the package", () => {
    const raw = { ...validManifest(), CodePath: "missing.bin", CodePathMac: "plugin.js" };
    const parsed = parseSDManifest(raw);
    const res = resolveCodePath(parsed.manifest as SDManifest, {
      pluginDir: dir,
      platform: "linux",
      fileExists: (p) => p.endsWith("plugin.js"),
    });

    expect(res.codePath).toBe("/plugins/fake.sdPlugin/plugin.js");
    expect(res.source).toBe("CodePathMac");
  });

  it("flags unverified platform when OS[] has no linux entry", () => {
    const parsed = parseSDManifest(validManifest());
    const res = resolveCodePath(parsed.manifest as SDManifest, {
      pluginDir: dir,
      platform: "linux",
    });
    expect(res.platformStatus).toBe("unverified");
  });

  it("flags verified platform when OS[] lists linux", () => {
    const raw = validManifest();
    raw.OS = [{ Platform: "mac" }, { Platform: "linux" }];
    const parsed = parseSDManifest(raw);
    const res = resolveCodePath(parsed.manifest as SDManifest, {
      pluginDir: dir,
      platform: "linux",
    });
    expect(res.platformStatus).toBe("verified");
  });
});
