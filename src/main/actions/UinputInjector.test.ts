// ============================================================================
// UinputInjector — mapping table tests (no /dev/uinput access needed)
//
// The combo contract: "ctrl+shift+v" → hold ctrl, hold shift, tap v,
// release shift, release ctrl. Unknown key names must map to null so the
// caller falls back to the ydotool/wtype/xdotool chain.
// ============================================================================

import { describe, it, expect } from "vitest";
import { UinputInjector } from "./UinputInjector";

describe("UinputInjector.mapCombo", () => {
  it("maps ctrl+v: last token is the main key, earlier tokens are held", () => {
    const combo = UinputInjector.mapCombo(["ctrl", "v"]);
    expect(combo).toEqual({ down: [29], press: 47, up: [47, 29] });
  });

  it("maps triple combos with LIFO release order", () => {
    const combo = UinputInjector.mapCombo(["ctrl", "shift", "v"]);
    expect(combo).toEqual({ down: [29, 42], press: 47, up: [47, 42, 29] });
  });

  it("maps a bare key with no modifiers", () => {
    expect(UinputInjector.mapCombo(["f5"])).toEqual({
      down: [],
      press: 63,
      up: [63],
    });
  });

  it("is case-insensitive on names", () => {
    expect(UinputInjector.mapCombo(["CTRL", "V"])).toEqual(
      UinputInjector.mapCombo(["ctrl", "v"]),
    );
  });

  it("returns null for unknown key names (caller falls back)", () => {
    expect(UinputInjector.mapCombo(["ctrl", "notakey"])).toBeNull();
  });

  it("returns null for an empty combo", () => {
    expect(UinputInjector.mapCombo([])).toBeNull();
  });
});
