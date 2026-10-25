import { describe, it, expect } from "vitest";
import {
  captureShortcut,
  modifiersFromFlags,
  shortcutKeyName,
} from "./shortcutCapture";

const ev = (overrides: {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
}) => ({
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...overrides,
});

describe("captureShortcut", () => {
  it("records a plain key on keydown (no waiting for keyup)", () => {
    expect(captureShortcut(ev({ key: "v" }))).toEqual({
      action: "complete",
      keys: ["V"],
      modifiers: [],
    });
  });

  it("records Ctrl+V — the Electron default-menu paste accelerator", () => {
    expect(captureShortcut(ev({ key: "v", ctrlKey: true }))).toEqual({
      action: "complete",
      keys: ["V"],
      modifiers: ["ctrl"],
    });
  });

  it("records Ctrl+Shift+V-style triples", () => {
    expect(
      captureShortcut(ev({ key: "v", ctrlKey: true, shiftKey: true })),
    ).toEqual({
      action: "complete",
      keys: ["V"],
      modifiers: ["ctrl", "shift"],
    });
  });

  it("stores modifiers in canonical ctrl,alt,shift,super order", () => {
    expect(
      captureShortcut(ev({ key: "m", metaKey: true, shiftKey: true, ctrlKey: true })),
    ).toEqual({
      action: "complete",
      keys: ["M"],
      modifiers: ["ctrl", "shift", "super"],
    });
  });

  it("treats a pure modifier press as incomplete live state", () => {
    expect(captureShortcut(ev({ key: "Control", ctrlKey: true }))).toEqual({
      action: "live",
      modifiers: ["ctrl"],
    });
    expect(captureShortcut(ev({ key: "Shift", shiftKey: true }))).toEqual({
      action: "live",
      modifiers: ["shift"],
    });
  });

  it("cancels on Escape instead of capturing Escape as a key", () => {
    expect(captureShortcut(ev({ key: "Escape" }))).toEqual({
      action: "cancel",
    });
  });

  it("clears on Backspace instead of capturing it as a key", () => {
    expect(captureShortcut(ev({ key: "Backspace", ctrlKey: true }))).toEqual({
      action: "clear",
    });
  });

  it("ignores auto-repeat", () => {
    expect(captureShortcut(ev({ key: "v", repeat: true }))).toEqual({
      action: "none",
    });
    expect(captureShortcut(ev({ key: "Backspace", repeat: true }))).toEqual({
      action: "none",
    });
  });

  it("maps special keys to xdotool format", () => {
    expect(shortcutKeyName("Enter")).toBe("Return");
    expect(shortcutKeyName(" ")).toBe("Space");
    expect(shortcutKeyName("ArrowUp")).toBe("Up");
    expect(shortcutKeyName("Insert")).toBe("Insert");
    expect(shortcutKeyName("F5")).toBe("F5");
    expect(shortcutKeyName("a")).toBe("A");

    expect(captureShortcut(ev({ key: "Enter", ctrlKey: true }))).toEqual({
      action: "complete",
      keys: ["Return"],
      modifiers: ["ctrl"],
    });
  });
});

describe("modifiersFromFlags", () => {
  it("returns an empty array when nothing is held", () => {
    expect(modifiersFromFlags(false, false, false, false)).toEqual([]);
  });

  it("maps meta to super", () => {
    expect(modifiersFromFlags(false, false, false, true)).toEqual(["super"]);
  });
});
