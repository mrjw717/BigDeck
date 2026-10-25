// ============================================================================
// Shortcut capture — pure logic behind the ShortcutRecorder.
// ============================================================================
//
// Lives in shared/ because the key naming it produces (xdotool format) is the
// contract the main-process action executor consumes; the renderer merely
// captures what the user pressed. No DOM dependencies, so it is unit-testable
// in the node environment.

// Map DOM key names to xdotool-compatible format
export const specialKeyMap: Record<string, string> = {
  Enter: "Return",
  Return: "Return",
  Delete: "Delete",
  Del: "Delete",
  Backspace: "BackSpace",
  Tab: "Tab",
  Escape: "Escape",
  Esc: "Escape",
  " ": "Space",
  Spacebar: "Space",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Up: "Up",
  Down: "Down",
  Left: "Left",
  Right: "Right",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  Insert: "Insert",
  Ins: "Insert",
};

// Modifier keys that never complete a combo on their own
export const MODIFIER_KEYS = ["Control", "Alt", "Shift", "Meta"];

/** Structural subset of KeyboardEvent — keeps this module DOM-free. */
export interface ShortcutKeyEvent {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  /** KeyboardEvent.repeat — key auto-repeat while held. */
  repeat?: boolean;
}

export type ShortcutCaptureResult =
  /** Auto-repeat or uninteresting event — no state change. */
  | { action: "none" }
  /** Pure modifier press: incomplete combo, show "Ctrl+…" live state. */
  | { action: "live"; modifiers: string[] }
  /** A non-modifier key completed the combo — record it now (on keydown). */
  | { action: "complete"; keys: string[]; modifiers: string[] }
  /** Escape — abandon the recording, keep the previously saved combo. */
  | { action: "cancel" }
  /** Backspace — clear the saved combo, keep listening. */
  | { action: "clear" };

/**
 * Canonical modifier order: ctrl, alt, shift, super — the storage order the
 * action executor and the rest of the app expect.
 */
export function modifiersFromFlags(
  ctrlKey: boolean,
  altKey: boolean,
  shiftKey: boolean,
  metaKey: boolean,
): string[] {
  const modifiers: string[] = [];
  if (ctrlKey) modifiers.push("ctrl");
  if (altKey) modifiers.push("alt");
  if (shiftKey) modifiers.push("shift");
  if (metaKey) modifiers.push("super");
  return modifiers;
}

/** Map a DOM key name to the xdotool-compatible key stored in profiles. */
export function shortcutKeyName(key: string): string {
  if (Object.prototype.hasOwnProperty.call(specialKeyMap, key)) {
    return specialKeyMap[key];
  }
  if (key.length === 1) {
    // Regular character key - keep as uppercase
    return key.toUpperCase();
  }
  // Other special keys (F1-F12, etc.)
  return key;
}

/**
 * Decide what one keydown means while the shortcut recorder is listening.
 * Combos are recorded on the NON-modifier keydown (no waiting for keyup),
 * so pressing and holding Ctrl shows "Ctrl" and pressing V immediately
 * completes "Ctrl+V".
 */
export function captureShortcut(e: ShortcutKeyEvent): ShortcutCaptureResult {
  // Ignore auto-repeat: holding a key must not spam cancels/clears/re-records.
  if (e.repeat) return { action: "none" };

  // Escape cancels the recording instead of capturing "Escape" as a key
  // (and, being handled in the capture phase, cannot close the KeyEditor).
  if (e.key === "Escape") return { action: "cancel" };

  // Backspace clears the saved shortcut.
  if (e.key === "Backspace") return { action: "clear" };

  const modifiers = modifiersFromFlags(e.ctrlKey, e.altKey, e.shiftKey, e.metaKey);

  // Pure modifier press: accumulate live state, do not save yet.
  if (MODIFIER_KEYS.includes(e.key)) {
    return { action: "live", modifiers };
  }

  return { action: "complete", keys: [shortcutKeyName(e.key)], modifiers };
}
