import React from "react";
import { X, Delete, ArrowUp } from "lucide-react";

interface VirtualKeyboardProps {
  onClose: () => void;
  onConfirm: (keys: string[], modifiers: string[]) => void;
}

// Map UI key names to xdotool-compatible key names
const xdotoolKeyMap: Record<string, string> = {
  Enter: "Return",
  Delete: "Delete",
  Backspace: "BackSpace",
  Tab: "Tab",
  Escape: "Escape",
  Esc: "Escape",
  Space: "space",
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
  PageUp: "Page_Up",
  PageDown: "Page_Down",
  Insert: "Insert",
  Ins: "Insert",
  Del: "Delete",
};

export function VirtualKeyboard({ onClose, onConfirm }: VirtualKeyboardProps) {
  const [modifiers, setModifiers] = React.useState<string[]>([]);
  const [currentKey, setCurrentKey] = React.useState<string | null>(null);

  // Escape key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleModifier = (mod: string) => {
    setModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  };

  // Convert key to xdotool-compatible format
  const convertToXdotoolKey = (key: string): string => {
    return xdotoolKeyMap[key] || key;
  };

  const handleKeyClick = (key: string) => {
    setCurrentKey(key);
    // Convert key to xdotool format before confirming
    const xdotoolKey = convertToXdotoolKey(key);
    onConfirm([xdotoolKey], modifiers);
    onClose();
  };

  const rows = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
    ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
  ];

  const specialKeys = [
    { label: "F1", value: "F1" },
    { label: "F2", value: "F2" },
    { label: "F3", value: "F3" },
    { label: "F4", value: "F4" },
    { label: "F5", value: "F5" },
    { label: "F6", value: "F6" },
    { label: "F7", value: "F7" },
    { label: "F8", value: "F8" },
    { label: "F9", value: "F9" },
    { label: "F10", value: "F10" },
    { label: "F11", value: "F11" },
    { label: "F12", value: "F12" },
    { label: "Ins", value: "Insert" },
    { label: "Del", value: "Delete" },
    { label: "Hom", value: "Home" },
    { label: "End", value: "End" },
    { label: "PgU", value: "PageUp" },
    { label: "PgD", value: "PageDown" },
    { label: "←", value: "ArrowLeft" },
    { label: "↑", value: "ArrowUp" },
    { label: "↓", value: "ArrowDown" },
    { label: "→", value: "ArrowRight" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl shadow-2xl p-6 w-[800px] max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight">
              Virtual Keyboard
            </h3>
            <p className="text-xs text-muted-foreground">
              Select modifiers and click a key to bind
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold border border-border">
              {modifiers.length > 0 ? (
                <>
                  <span className="text-primary">
                    {modifiers.map((m) => m.toUpperCase()).join(" + ")}
                  </span>
                  <span className="text-muted-foreground">+ [KEY]</span>
                </>
              ) : (
                <span className="text-muted-foreground opacity-50">
                  Select Modifiers...
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
              aria-label="Close virtual keyboard"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Function Row */}
        <div className="grid grid-cols-12 gap-1.5 mb-2">
          {specialKeys.slice(0, 12).map((k) => (
            <button
              key={k.value}
              onClick={() => handleKeyClick(k.value)}
              className="h-8 rounded md:rounded-lg bg-muted/30 hover:bg-primary/20 hover:text-primary hover:border-primary/30 border border-transparent transition-all text-[10px] font-bold uppercase"
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Main Rows */}
        <div className="space-y-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-center gap-1.5">
              {row.map((char) => (
                <button
                  key={char}
                  onClick={() =>
                    handleKeyClick(char === "Enter" ? "Enter" : char)
                  }
                  className={`
                                        h-12 rounded-xl border border-border/50 font-bold shadow-sm transition-all hover:-translate-y-0.5
                                        ${char.length > 1 ? "px-4 bg-muted/20 text-xs uppercase" : "w-12 bg-background/50 text-lg"}
                                        hover:bg-primary hover:border-primary hover:text-primary-foreground hover:shadow-primary/20
                                    `}
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom Row (Modifiers + Arrows) */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {["ctrl", "shift", "alt", "super"].map((mod) => (
              <button
                key={mod}
                onClick={() => toggleModifier(mod)}
                aria-pressed={modifiers.includes(mod)}
                className={`h-10 px-4 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all ${modifiers.includes(mod) ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:border-primary/50"}`}
              >
                {mod}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1.5 w-auto">
            {specialKeys.slice(12).map((k) => (
              <button
                key={k.value}
                onClick={() => handleKeyClick(k.value)}
                className="h-10 px-2 min-w-[36px] rounded-lg bg-muted/30 hover:bg-primary/20 hover:text-primary hover:border-primary/30 border border-transparent transition-all text-[10px] font-black uppercase"
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
