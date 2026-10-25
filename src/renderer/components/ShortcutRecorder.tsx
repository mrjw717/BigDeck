import React, { useState, useEffect, useRef } from "react";
import { Keyboard, RotateCcw, Monitor } from "lucide-react";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { captureShortcut } from "../../shared/shortcutCapture";

interface ShortcutRecorderProps {
  keys: string[];
  modifiers: string[];
  onChange: (keys: string[], modifiers: string[]) => void;
}

export function ShortcutRecorder({
  keys,
  modifiers,
  onChange,
}: ShortcutRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  // Incomplete state while only modifiers are held ("CTRL+…"); never saved.
  const [liveModifiers, setLiveModifiers] = useState<string[]>([]);

  // Keep the latest callback without re-registering the capture listeners
  // on every parent render (onChange is an inline arrow in KeyEditor).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!isRecording) return;

    // Electron matches application-menu accelerators (the auto-created
    // default Edit menu: Copy=Ctrl+C, Paste=Ctrl+V, Reload=Ctrl+R, ...) in
    // the main process BEFORE the page sees any keydown, so paste-style
    // combos never reached this component. Ask main to ignore menu
    // shortcuts for the duration of the recording; the cleanup below (stop,
    // cancel, toggle off, or unmount) always restores them.
    window.bigdeck?.shortcut?.setRecordMode?.(true)?.catch(() => {});

    // Capture phase on window: this component must see every key FIRST, so
    // the app default never fires and bubble-phase handlers (StreamdeckView's
    // Ctrl+V deck-paste, KeyEditor's Escape-close) cannot act mid-recording.
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const result = captureShortcut(e);
      switch (result.action) {
        case "none":
          break;
        case "live":
          setLiveModifiers(result.modifiers);
          break;
        case "complete":
          // Record immediately on the non-modifier keydown.
          setLiveModifiers([]);
          onChangeRef.current(result.keys, result.modifiers);
          setIsRecording(false);
          break;
        case "cancel":
          setLiveModifiers([]);
          setIsRecording(false);
          break;
        case "clear":
          setLiveModifiers([]);
          onChangeRef.current([], []);
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.bigdeck?.shortcut?.setRecordMode?.(false)?.catch(() => {});
    };
  }, [isRecording]);

  const toggleRecording = () => {
    setLiveModifiers([]);
    setIsRecording(!isRecording);
  };

  const clearShortcut = () => {
    onChange([], []);
    setLiveModifiers([]);
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
          onClick={toggleRecording}
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
              <span className="text-sm font-black bg-background/50 px-2 py-1 rounded border border-primary/30">
                {liveModifiers.length > 0
                  ? `${liveModifiers
                      .map((m) => m.toUpperCase())
                      .join(" + ")} + …`
                  : "Press any key…"}
              </span>
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
          ? "Press any key combination — Esc cancels, Backspace clears."
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
