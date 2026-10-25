import React, { useState } from "react";
import {
  Keyboard,
  AppWindow,
  Music,
  Globe,
  FolderOpen,
  Terminal,
  Repeat,
  Search,
  Zap,
} from "lucide-react";
import { ActionType, KeyLayer } from "../../shared/types";

interface ActionTemplate {
  id: string;
  type: ActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  payload: any;
  appearance: {
    layers: KeyLayer[];
  };
}

const TEMPLATES: ActionTemplate[] = [
  {
    id: "shortcut",
    type: "keyboard-shortcut",
    label: "Key Shortcut",
    icon: <Keyboard size={18} />,
    description: "Send key combo",
    payload: { keys: [], modifiers: [] },
    appearance: {
      layers: [
        { id: "bg-shortcut", type: "background", order: 0, visible: true, opacity: 1, backgroundColor: "#2a2a3e", backgroundGradientStart: "#2a2a3e", backgroundGradientEnd: "#1a1a2e" },
        { id: "text-shortcut", type: "text", order: 1, visible: true, text: "⌨", fontSize: 28, textColor: "#ffffff", opacity: 1 },
      ],
    },
  },
  {
    id: "launch",
    type: "launch-app",
    label: "Launch App",
    icon: <AppWindow size={18} />,
    description: "Open application",
    payload: { command: "", args: [] },
    appearance: {
      layers: [
        { id: "bg-launch", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#1e3a5f", backgroundGradientEnd: "#0f1b2e", backgroundGradientDirection: 135 },
        { id: "text-launch", type: "text", order: 1, visible: true, text: "App", fontSize: 16, textColor: "#8ab4f8", opacity: 1 },
      ],
    },
  },
  {
    id: "media",
    type: "multimedia",
    label: "Media Control",
    icon: <Music size={18} />,
    description: "Play/Pause/Skip",
    payload: { mediaCommand: "play-pause" },
    appearance: {
      layers: [
        { id: "bg-media", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#3a1a5e", backgroundGradientEnd: "#1a0f2e", backgroundGradientDirection: 135 },
        { id: "text-media", type: "text", order: 1, visible: true, text: "♪", fontSize: 28, textColor: "#c084fc", opacity: 1 },
      ],
    },
  },
  {
    id: "url",
    type: "open-url",
    label: "Open URL",
    icon: <Globe size={18} />,
    description: "Open website",
    payload: { url: "https://" },
    appearance: {
      layers: [
        { id: "bg-url", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#1a5e3a", backgroundGradientEnd: "#0f2e1a", backgroundGradientDirection: 135 },
        { id: "text-url", type: "text", order: 1, visible: true, text: "URL", fontSize: 16, textColor: "#84f8ab", opacity: 1 },
      ],
    },
  },
  {
    id: "folder",
    type: "open-folder",
    label: "Open Folder",
    icon: <FolderOpen size={18} />,
    description: "Open directory",
    payload: { path: "" },
    appearance: {
      layers: [
        { id: "bg-folder", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#5e4a1a", backgroundGradientEnd: "#2e1a0f", backgroundGradientDirection: 135 },
        { id: "text-folder", type: "text", order: 1, visible: true, text: "📁", fontSize: 24, textColor: "#f8ca84", opacity: 1 },
      ],
    },
  },
  {
    id: "script",
    type: "run-script",
    label: "Run Script",
    icon: <Terminal size={18} />,
    description: "Execute script",
    payload: { script: "", scriptType: "shell" },
    appearance: {
      layers: [
        { id: "bg-script", type: "background", order: 0, visible: true, opacity: 1, backgroundColor: "#1a1a1a" },
        { id: "text-script", type: "text", order: 1, visible: true, text: ">_", fontSize: 18, textColor: "#84f884", opacity: 1 },
      ],
    },
  },
  {
    id: "macro",
    type: "macro",
    label: "Macro",
    icon: <Repeat size={18} />,
    description: "Action sequence",
    payload: { steps: [] },
    appearance: {
      layers: [
        { id: "bg-macro", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#3e2a1a", backgroundGradientEnd: "#2e1a0f", backgroundGradientDirection: 135 },
        { id: "text-macro", type: "text", order: 1, visible: true, text: "↻", fontSize: 24, textColor: "#f8a884", opacity: 1 },
      ],
    },
  },
];

interface ActionLibraryProps {
  side?: "left" | "right";
}

export function ActionLibrary({ side = "right" }: ActionLibraryProps) {
  const [search, setSearch] = useState("");

  const filtered = TEMPLATES.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const borderClass = side === "left" ? "border-r" : "border-l";
  const radiusClass = side === "left" ? "rounded-r-[32px]" : "rounded-l-[32px]";

  return (
    <div
      className={`w-64 ${borderClass} border-border bg-card/50 backdrop-blur-xl flex flex-col overflow-hidden ${radiusClass}`}
    >
      <div className="p-3 border-b border-border bg-background/50">
        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          Actions
        </h3>
        <div className="mt-2 relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={12}
          />
          <input
            id="action-search"
            type="text"
            placeholder="Search..."
            className="w-full bg-muted/50 border-none rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-primary/50 transition-all font-medium"
            aria-label="Search actions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 col-span-full">
          Actions
        </div>
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "bigdeck/action",
                  JSON.stringify({
                    type: item.type,
                    name: item.label,
                    label: item.label,
                    appearance: item.appearance,
                    ...item.payload,
                  }),
                );
                e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.dropEffect = "copy";

                const dragImage = document.createElement("div");
                dragImage.className =
                  "flex items-center justify-center w-16 h-16 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-2xl border-2 border-primary";
                dragImage.textContent = item.label;
                dragImage.style.position = "absolute";
                dragImage.style.top = "-1000px";
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, 32, 32);
                setTimeout(() => document.body.removeChild(dragImage), 0);
              }}
              className="group flex flex-col items-center justify-center p-2 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/50 hover:bg-muted/40 transition-all cursor-grab active:cursor-grabbing aspect-square text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all mb-1">
                {item.icon}
              </div>
              <div className="w-full">
                <div className="text-[10px] font-bold truncate">
                  {item.label}
                </div>
                <div className="text-[8px] text-muted-foreground font-medium truncate uppercase tracking-tighter opacity-70">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-6">
            <div className="text-[10px] text-muted-foreground italic">
              No actions found
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border bg-muted/10">
        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
          Drag actions onto keys to assign
        </div>
      </div>
    </div>
  );
}
