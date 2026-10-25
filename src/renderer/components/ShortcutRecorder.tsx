import React, { useState, useEffect, useCallback } from "react";
import { Keyboard, X, RotateCcw, Monitor } from "lucide-react";
import { VirtualKeyboard } from "./VirtualKeyboard";

interface ShortcutRecorderProps {
  keys: string[];
  modifiers: string[];
  onChange: (keys: string[], modifiers: string[]) => void;
}

// Map special key names to xdotool-compatible format
const specialKeyMap: Record<string, string> = {
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

// Modifier keys to filter out
const MODIFIER_KEYS = ["Control", "Alt", "Shift", "Meta"];

export function ShortcutRecorder({
  keys,
  modifiers,
  onChange,
}: ShortcutRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording) return;

      e.preventDefault();
      e.stopPropagation();

      const newModifiers: string[] = [];
      if (e.ctrlKey) newModifiers.push("ctrl");
      if (e.altKey) newModifiers.push("alt");
      if (e.shiftKey) newModifiers.push("shift");
      if (e.metaKey) newModifiers.push("super");

      // Check if it's a modifier-only key press (Control, Alt, Shift, Meta)
      const isModifier = MODIFIER_KEYS.includes(e.key);

      // Map special keys to xdotool format
      let key: string | null = null;

      if (!isModifier) {
        // Check for special keys first
        if (specialKeyMap[e.key]) {
          key = specialKeyMap[e.key];
        } else if (e.key.length === 1) {
          // Regular character key - keep as uppercase
          key = e.key.toUpperCase();
        } else {
          // Other special keys (F1-F12, etc.)
          key = e.key;
        }
      }

      const newKeys = key ? [key] : [];

      // Log for debugging
      console.log("Recorder:", {
        key: e.key,
        code: e.code,
        mappedKey: key,
        newKeys,
        newModifiers,
      });

      onChange(newKeys, newModifiers);

      if (key) {
        setIsRecording(false);
      }
    },
    [isRecording, onChange],
  );

  useEffect(() => {
    if (isRecording) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", (e) => e.preventDefault()); // Prevent defaults on up too
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", (e) => e.preventDefault());
    };
  }, [isRecording, handleKeyDown]);

  const clearShortcut = () => {
    onChange([], []);
    setIsRecording(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium block">Keyboard Shortcut</label>
        {!isRecording && (
          <button
            onClick={() => setShowVirtualKeyboard(true)}
            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-1"
          >
            <Monitor size={12} /> Virtual Keyboard
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          id="shortcut-recorder"
          onClick={() => setIsRecording(!isRecording)}
          aria-label={
            isRecording ? "Stop recording" : "Start recording keyboard shortcut"
          }
          className={`flex-1 h-12 flex items-center justify-center gap-3 rounded-lg border-2 transition-all ${
            isRecording
              ? "border-primary bg-primary/10 animate-pulse ring-2 ring-primary/20"
              : "border-border bg-muted/30 hover:border-primary/50"
          }`}
        >
          {isRecording ? (
            <div className="flex items-center gap-2 animate-pulse">
              <span className="text-xs font-bold text-primary uppercase tracking-wider mr-2">
                Recording:
              </span>
              {modifiers.length > 0 || keys.length > 0 ? (
                <span className="text-sm font-black bg-background/50 px-2 py-1 rounded border border-primary/30">
                  {[...modifiers, ...keys]
                    .map((k) => k.toUpperCase())
                    .join(" + ")}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Waiting for input...
                </span>
              )}
            </div>
          ) : (
            <>
              <Keyboard size={18} className="text-muted-foreground" />
              <span className="text-sm font-medium">
                {[...modifiers, ...keys].length > 0
                  ? [...modifiers, ...keys]
                      .map((k) => k.toUpperCase())
                      .join(" + ")
                  : "Press to Record"}
              </span>
            </>
          )}
        </button>
        {(keys.length > 0 || modifiers.length > 0 || isRecording) && (
          <button
            onClick={clearShortcut}
            className="w-12 h-12 flex items-center justify-center rounded-lg border-2 border-border bg-muted/30 hover:bg-destructive/10 hover:border-destructive/50 transition-colors text-muted-foreground hover:text-destructive"
            title="Clear Shortcut"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        {isRecording
          ? "Press any key combination..."
          : "Supports Ctrl, Alt, Shift, and Super keys."}
      </p>

      {showVirtualKeyboard && (
        <VirtualKeyboard
          onClose={() => setShowVirtualKeyboard(false)}
          onConfirm={(k, m) => {
            onChange(k, m);
            setShowVirtualKeyboard(false);
          }}
        />
      )}
    </div>
  );
}
