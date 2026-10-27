import React, { useEffect, useState } from "react";
import {
  Keyboard,
  AppWindow,
  Music,
  Globe,
  FolderOpen,
  Terminal,
  Repeat,
  Moon,
  Sun,
  XCircle,
  Search,
  Square,
  Timer as TimerIcon,
  Clock,
  Volume2,
  Zap,
  Puzzle,
} from "lucide-react";
import { ActionType, KeyLayer } from "../../shared/types";
import {
  fetchSdActionEntries,
  makeSdPluginAction,
  type SdActionEntry,
} from "../utils/sdPlugins";

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
  /** True for discovered Elgato .sdPlugin actions (gets the SD badge). */
  sdPlugin?: boolean;
}

/**
 * Minimal appearance for a dropped SD action: dark gradient + the action
 * name snippet — without layers a dropped template leaves the key blank
 * until the plugin draws its first setImage.
 */
function sdActionTemplate(entry: SdActionEntry): ActionTemplate {
  return {
    id: `sdplugin:${entry.pluginUUID}:${entry.actionUUID}`,
    type: "sdplugin",
    label: entry.name,
    icon: <Puzzle size={18} />,
    description: entry.pluginName,
    payload: makeSdPluginAction(entry),
    sdPlugin: true,
    appearance: {
      layers: [
        {
          id: "bg-sdplugin",
          type: "background",
          order: 0,
          visible: true,
          opacity: 1,
          backgroundGradientStart: "#2a1a3e",
          backgroundGradientEnd: "#140f1e",
          backgroundGradientDirection: 135,
        },
        {
          id: "text-sdplugin",
          type: "text",
          order: 1,
          visible: true,
          text: entry.name.slice(0, 14),
          fontSize: 11,
          textColor: "#c084fc",
          opacity: 1,
        },
      ],
    },
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
  {
    id: "sleep",
    type: "system-sleep",
    label: "Sleep",
    icon: <Moon size={18} />,
    description: "Suspend the computer",
    payload: {},
    appearance: {
      layers: [
        { id: "bg-sleep", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#1a1a3e", backgroundGradientEnd: "#0f0f1e", backgroundGradientDirection: 135 },
        { id: "text-sleep", type: "text", order: 1, visible: true, text: "☾", fontSize: 28, textColor: "#a5b4fc", opacity: 1 },
      ],
    },
  },
  {
    id: "close-app",
    type: "close-app",
    label: "Close App",
    icon: <XCircle size={18} />,
    description: "Close an app's windows",
    payload: { target: "" },
    appearance: {
      layers: [
        { id: "bg-close", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#5e1a1a", backgroundGradientEnd: "#2e0f0f", backgroundGradientDirection: 135 },
        { id: "text-close", type: "text", order: 1, visible: true, text: "✕", fontSize: 26, textColor: "#f88484", opacity: 1 },
      ],
    },
  },
  {
    id: "brightness",
    type: "key-brightness",
    label: "Brightness",
    icon: <Sun size={18} />,
    description: "Set key brightness",
    payload: { brightness: 50 },
    appearance: {
      layers: [
        { id: "bg-brightness", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#5e521a", backgroundGradientEnd: "#2e291a", backgroundGradientDirection: 135 },
        { id: "text-brightness", type: "text", order: 1, visible: true, text: "☀", fontSize: 26, textColor: "#f8e084", opacity: 1 },
      ],
    },
  },
  {
    id: "soundboard",
    type: "soundboard",
    label: "Soundboard",
    icon: <Volume2 size={18} />,
    description: "Play an audio file",
    payload: { samplePath: "", volume: 80 },
    appearance: {
      layers: [
        { id: "bg-soundboard", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#1a5e52", backgroundGradientEnd: "#0f2e28", backgroundGradientDirection: 135 },
        { id: "text-soundboard", type: "text", order: 1, visible: true, text: "♫", fontSize: 26, textColor: "#84f8dc", opacity: 1 },
      ],
    },
  },
  {
    id: "soundboard-stop",
    type: "soundboard.stop",
    label: "Stop Sounds",
    icon: <Square size={18} />,
    description: "Stop all playback",
    payload: {},
    appearance: {
      layers: [
        { id: "bg-soundboard-stop", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#5e1a4a", backgroundGradientEnd: "#2e0f24", backgroundGradientDirection: 135 },
        { id: "text-soundboard-stop", type: "text", order: 1, visible: true, text: "■", fontSize: 24, textColor: "#f884c8", opacity: 1 },
      ],
    },
  },
  {
    id: "timer",
    type: "timer",
    label: "Timer",
    icon: <TimerIcon size={18} />,
    description: "Countdown on the key",
    payload: { minutes: 5, seconds: 0, pressAgain: "stop" },
    appearance: {
      layers: [
        { id: "bg-timer", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#5e3a1a", backgroundGradientEnd: "#2e1c0f", backgroundGradientDirection: 135 },
        { id: "text-timer", type: "text", order: 1, visible: true, text: "05:00", fontSize: 16, textColor: "#f8c884", opacity: 1 },
      ],
    },
  },
  {
    id: "clock",
    type: "clock",
    label: "Clock",
    icon: <Clock size={18} />,
    description: "Live time on the key",
    payload: { use24h: true, showSeconds: false },
    appearance: {
      layers: [
        { id: "bg-clock", type: "background", order: 0, visible: true, opacity: 1, backgroundGradientStart: "#1a2a5e", backgroundGradientEnd: "#0f1430", backgroundGradientDirection: 135 },
        { id: "text-clock", type: "text", order: 1, visible: true, text: "12:00", fontSize: 16, textColor: "#84b4f8", opacity: 1 },
      ],
    },
  },
];

interface ActionLibraryProps {
  side?: "left" | "right";
}

export function ActionLibrary({ side = "right" }: ActionLibraryProps) {
  const [search, setSearch] = useState("");
  // Discovered Elgato .sdPlugin actions, appended below the built-ins.
  const [sdTemplates, setSdTemplates] = useState<ActionTemplate[]>([]);

  useEffect(() => {
    let disposed = false;
    fetchSdActionEntries().then((entries) => {
      if (!disposed) setSdTemplates(entries.map(sdActionTemplate));
    });
    return () => {
      disposed = true;
    };
  }, []);

  const templates = [...TEMPLATES, ...sdTemplates];

  const filtered = templates.filter(
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
                {item.sdPlugin && (
                  <div className="mt-0.5 flex justify-center">
                    <span className="text-[7px] px-1 py-px rounded-full bg-purple-500/20 text-purple-400 uppercase font-black tracking-widest">
                      SD Plugin
                    </span>
                  </div>
                )}
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
