// ============================================================================
// resolveFocusProfile — focus auto-switch decision policy (pure)
//
// The rule-miss → default-profile fallback decision lives in a pure function
// (extracted from the app-entry focus handler) so it can be tested without
// Electron. index.ts is the only production caller: it feeds the live
// findProfileByAutoSwitch result, the active profile, and a lazy
// getDefaultProfile() getter, then applies the returned profile to hardware.
// ============================================================================

import { describe, it, expect } from "vitest";
import { resolveFocusProfile } from "./resolveFocusProfile";
import type { Profile } from "../../shared/types";

function makeProfile(id: string, isDefault = false): Profile {
  return {
    id,
    name: id,
    deviceType: "original",
    isDefault,
    pages: [],
    activePage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("resolveFocusProfile", () => {
  it("returns the rule match when it is not already active", () => {
    const match = makeProfile("chrome");
    const current = makeProfile("default", true);

    expect(resolveFocusProfile(match, current, () => current)).toBe(match);
  });

  it("returns null when the rule match is already active (no churn)", () => {
    const match = makeProfile("chrome");
    const current = makeProfile("chrome");

    expect(resolveFocusProfile(match, current, () => null)).toBeNull();
  });

  it("falls back to the default profile on a rule miss", () => {
    const current = makeProfile("terminal");
    const fallback = makeProfile("home", true);

    expect(resolveFocusProfile(null, current, () => fallback)).toBe(fallback);
  });

  it("returns null on a rule miss when the default is already active", () => {
    const current = makeProfile("home", true);

    expect(resolveFocusProfile(null, current, () => current)).toBeNull();
  });

  it("returns null when there is no rule match and no default profile", () => {
    expect(resolveFocusProfile(null, makeProfile("x"), () => null)).toBeNull();
  });

  it("resolves without a current profile (nothing active yet)", () => {
    const match = makeProfile("chrome");
    const fallback = makeProfile("home", true);

    expect(resolveFocusProfile(match, null, () => fallback)).toBe(match);
    expect(resolveFocusProfile(null, null, () => fallback)).toBe(fallback);
  });

  it("calls getDefault lazily — only on the rule-miss path", () => {
    let calls = 0;
    const getDefault = () => {
      calls++;
      return null;
    };

    resolveFocusProfile(makeProfile("chrome"), null, getDefault);
    expect(calls).toBe(0);

    resolveFocusProfile(null, null, getDefault);
    expect(calls).toBe(1);
  });
});
