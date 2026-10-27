import React, { useEffect, useState } from "react";
import { Copy, Minus, Square, X } from "lucide-react";
import bigdeckIcon from "../../../assets/icons/bigdeck-icon.svg";

/**
 * Custom titlebar for the frameless shell (main runs `frame: false` +
 * `Menu.setApplicationMenu(null)`). Owns everything the native chrome did:
 *
 * - The WHOLE bar is the drag region (`-webkit-app-region: drag`), so the
 *   window can be moved by grabbing any empty part of it; the window-control
 *   buttons opt back out with `no-drag`.
 * - Double-click on an empty area toggles maximize (same IPC as the button —
 *   the main-process maximize/unmaximize listeners report the real state
 *   back, so the icon stays correct whichever way it changed).
 * - Minimize / maximize-restore (Square when maximizable, Copy when
 *   maximized — the unfocused-squares convention) / close, close hovering red.
 *
 * Mounted by App.tsx only when the Electron bridge exists — a plain
 * `vite`-dev browser page has no window controls to drive.
 */
export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const bridge = window.bigdeck?.window;
    if (!bridge) return;
    let disposed = false;
    bridge
      .isMaximized()
      .then((v) => {
        if (!disposed) setIsMaximized(v);
      })
      .catch(() => {});
    const unsubscribe = bridge.onMaximizedChanged((v) => setIsMaximized(v));
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const toggleMaximize = () => {
    void window.bigdeck?.window.maximize();
  };

  // Chromium reads -webkit-app-region from the inline style; React's
  // CSSProperties has no typed member for it, hence the cast.
  const dragStyle = { WebkitAppRegion: "drag" } as React.CSSProperties;
  const noDragStyle = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

  return (
    <div
      className="h-10 flex-none flex items-center justify-between bg-card border-b border-border select-none"
      style={dragStyle}
      onDoubleClick={toggleMaximize}
    >
      {/* Left: brand */}
      <div className="flex items-center gap-2 pl-3">
        <img
          src={bigdeckIcon}
          alt=""
          className="w-5 h-5"
          draggable={false}
        />
        <span className="text-xs font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          BigDeck
        </span>
      </div>

      {/* Right: window controls (opt out of the drag region) */}
      <div className="flex h-full" style={noDragStyle}>
        <button
          onClick={() => void window.bigdeck?.window.minimize()}
          className="w-11 h-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Minimize window"
          title="Minimize"
        >
          <Minus size={15} />
        </button>
        <button
          onClick={toggleMaximize}
          className="w-11 h-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? <Copy size={13} /> : <Square size={12} />}
        </button>
        <button
          onClick={() => void window.bigdeck?.window.close()}
          className="w-11 h-full flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
          aria-label="Close window"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
