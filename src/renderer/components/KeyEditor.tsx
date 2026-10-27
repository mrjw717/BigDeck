import React, { useEffect, useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AppWindow,
  CaseUpper,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Keyboard,
  Library,
  Moon,
  Music,
  Palette,
  Play,
  Puzzle,
  Repeat,
  Square,
  Sun,
  Terminal,
  Trash2,
  Type,
  Upload,
  X,
  XCircle,
  Volume2,
  Timer as TimerIcon,
  Zap,
  Layers,
} from "lucide-react";
import { useProfileStore } from "../stores/profileStore";
import type {
  Profile,
  Action,
  ActionType,
  KeyImage,
  KeyLayer,
} from "../../shared/types";
import { ShortcutRecorder } from "./ShortcutRecorder";
import { PathPicker } from "./PathPicker";
import { MEDIA_KEYS } from "../../shared/constants";
import { AssetImage } from "./AssetImage";
import { LayerStack } from "./LayerStack";
import { LayerEditor } from "./LayerEditor";
import { MediaControlEditor } from "./MediaControlEditor";
import {
  fetchSdActionEntries,
  makeSdPluginAction,
  type SdActionEntry,
} from "../utils/sdPlugins";

/** Small provenance badge for Elgato .sdPlugin actions in the catalogs. */
function SdPluginBadge() {
  return (
    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase font-black tracking-widest whitespace-nowrap">
      SD Plugin
    </span>
  );
}

interface KeyEditorProps {
  keyIndex: number;
  profile: Profile | null;
  onClose: () => void;
}

interface ActionOption {
  type: ActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ACTION_OPTIONS: ActionOption[] = [
  {
    type: "keyboard-shortcut",
    label: "Keyboard Shortcut",
    icon: <Keyboard size={18} />,
    description: "Send key combinations",
  },
  {
    type: "launch-app",
    label: "Launch App",
    icon: <AppWindow size={18} />,
    description: "Open an application",
  },
  {
    type: "multimedia",
    label: "Media Control",
    icon: <Music size={18} />,
    description: "Play/pause/volume commands",
  },
  {
    type: "open-url",
    label: "Open URL",
    icon: <Globe size={18} />,
    description: "Open a website",
  },
  {
    type: "open-folder",
    label: "Open Folder",
    icon: <FolderOpen size={18} />,
    description: "Reveal a directory",
  },
  {
    type: "run-script",
    label: "Run Script",
    icon: <Terminal size={18} />,
    description: "Execute shell/python/node",
  },
  {
    type: "macro",
    label: "Macro",
    icon: <Repeat size={18} />,
    description: "Record multi-step workflows",
  },
  {
    type: "system-sleep",
    label: "Sleep",
    icon: <Moon size={18} />,
    description: "Suspend the computer",
  },
  {
    type: "close-app",
    label: "Close App",
    icon: <XCircle size={18} />,
    description: "Close all instances of an app",
  },
  {
    type: "key-brightness",
    label: "Brightness",
    icon: <Sun size={18} />,
    description: "Set Stream Deck key brightness",
  },
  {
    type: "soundboard",
    label: "Soundboard",
    icon: <Volume2 size={18} />,
    description: "Play an audio file",
  },
  {
    type: "soundboard.stop",
    label: "Stop Sounds",
    icon: <Square size={18} />,
    description: "Stop all sound playback",
  },
  {
    type: "timer",
    label: "Timer",
    icon: <TimerIcon size={18} />,
    description: "Countdown rendered on the key",
  },
  {
    type: "clock",
    label: "Clock",
    icon: <Clock size={18} />,
    description: "Live time on the key",
  },
];

const QUICK_ASSIGN = [
  {
    id: "mute-discord",
    label: "Mute Discord",
    icon: <Music size={18} />,
    description: "Mute/Unmute Discord mic",
    action: {
      type: "keyboard-shortcut",
      keys: ["m"],
      modifiers: ["ctrl", "shift"],
    },
  },
  {
    id: "open-browser",
    label: "Open Browser",
    icon: <Globe size={18} />,
    description: "Launch default browser",
    action: { type: "open-url", url: "https://google.com" },
  },
  {
    id: "terminal",
    label: "Open Terminal",
    icon: <Terminal size={18} />,
    description: "Open terminal window",
    action: { type: "launch-app", command: "xterm" },
  },
  {
    id: "vol-up",
    label: "Volume Up",
    icon: <Music size={18} />,
    description: "Increase volume",
    action: { type: "multimedia", mediaCommand: "volume-up" },
  },
];

const TEXT_ALIGN_OPTIONS = [
  { id: "left", icon: <AlignLeft size={14} /> },
  { id: "center", icon: <AlignCenter size={14} /> },
  { id: "right", icon: <AlignRight size={14} /> },
] as const;

export function KeyEditor({ keyIndex, profile, onClose }: KeyEditorProps) {
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const updateKeyConfig = useProfileStore((s) => s.updateKeyConfig);
  const setKeyAction = useProfileStore((s) => s.setKeyAction);
  const [activeTab, setActiveTab] = useState<
    "action" | "appearance" | "automation"
  >("action");
  const [assets, setAssets] = useState<string[]>([]);
  const [isRecordingMacro, setIsRecordingMacro] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [isEditingPressed, setIsEditingPressed] = useState(false);
  // Discovered Elgato .sdPlugin actions, merged into the assignable list
  // below the built-in action types.
  const [sdActions, setSdActions] = useState<SdActionEntry[]>([]);

  // Get live keyConfig from store, not from stale profile prop
  const currentPage = useMemo(
    () => activeProfile?.pages[activeProfile?.activePage],
    [activeProfile],
  );
  const keyConfig = useMemo(
    () => currentPage?.keys.find((k) => k.keyIndex === keyIndex),
    [currentPage, keyIndex],
  );

  useEffect(() => {
    if (activeTab === "appearance") {
      loadAssets();
    }
  }, [activeTab]);

  // SD plugin actions for the catalog. Fetched once per editor mount; an
  // empty/failed host (nothing installed) contributes no entries.
  useEffect(() => {
    let disposed = false;
    fetchSdActionEntries().then((entries) => {
      if (!disposed) setSdActions(entries);
    });
    return () => {
      disposed = true;
    };
  }, []);

  // Script source mode for run-script actions: "file" points at a script on
  // disk, "inline" pastes code. Explicit UI state — deriving the view from
  // `scriptFile` emptiness made the toggle dead (empty string = inline view).
  // Re-syncs when a different action is loaded into this editor.
  const [scriptSourceMode, setScriptSourceMode] = useState<"file" | "inline">(
    () => ((keyConfig?.action as any)?.scriptFile ? "file" : "inline"),
  );
  useEffect(() => {
    setScriptSourceMode(
      (keyConfig?.action as any)?.scriptFile ? "file" : "inline",
    );
  }, [keyConfig?.action?.id]);

  // Escape key handler to close editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const loadAssets = async () => {
    try {
      const list = await (window as any).bigdeck.asset.list();
      setAssets(list);
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  };

  const handleUploadAsset = async () => {
    try {
      const filePaths = await (window as any).bigdeck.dialog.openFile({
        title: "Select Icon or Image",
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] },
        ],
      });

      if (filePaths && filePaths.length > 0) {
        await (window as any).bigdeck.asset.upload(filePaths[0]);
        await loadAssets();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDeleteAsset = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    try {
      await (window as any).bigdeck.asset.delete(fileName);
      await loadAssets();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleSmartIconLink = async (url: string) => {
    try {
      const fileName = await (window as any).bigdeck.asset.fetchFavicon(url);
      if (fileName) {
        await handleImageUpdate({
          type: "static",
          source: `bigdeck-asset://${encodeURIComponent(fileName)}`,
        });
      }
    } catch (error) {
      console.error("Favicon fetch failed:", error);
    }
  };

  const handleSmartIconApp = async (appPath: string) => {
    try {
      const fileName = await (window as any).bigdeck.asset.fetchAppIcon(
        appPath,
      );
      if (fileName) {
        await handleImageUpdate({
          type: "static",
          source: `bigdeck-asset://${encodeURIComponent(fileName)}`,
        });
      }
    } catch (error) {
      console.error("App icon fetch failed:", error);
    }
  };

  const handleActionSelect = async (actionType: ActionType) => {
    const baseAction: Action = {
      type: actionType,
      id: crypto.randomUUID(),
      name:
        ACTION_OPTIONS.find((a) => a.type === actionType)?.label || actionType,
    } as Action;

    switch (actionType) {
      case "keyboard-shortcut":
        (baseAction as any).keys = [];
        (baseAction as any).modifiers = [];
        break;
      case "launch-app":
        (baseAction as any).command = "";
        break;
      case "multimedia":
        (baseAction as any).mediaCommand = "play-pause";
        break;
      case "open-url":
        (baseAction as any).url = "https://";
        break;
      case "open-folder":
        (baseAction as any).path = "";
        break;
      case "run-script":
        (baseAction as any).scriptType = "shell";
        (baseAction as any).script = "";
        break;
      case "close-app":
        (baseAction as any).target = "";
        break;
      case "key-brightness":
        (baseAction as any).brightness = 50;
        break;
      case "soundboard":
        (baseAction as any).samplePath = "";
        (baseAction as any).volume = 80;
        break;
      case "soundboard.stop":
        break;
      case "timer":
        (baseAction as any).minutes = 5;
        (baseAction as any).seconds = 0;
        (baseAction as any).pressAgain = "stop";
        break;
      case "clock":
        (baseAction as any).use24h = true;
        (baseAction as any).showSeconds = false;
        break;
    }

    await setKeyAction(keyIndex, baseAction);
    setShowActionPicker(false);
  };

  /** Assign a discovered Elgato .sdPlugin action to this key. */
  const handleSdActionSelect = async (entry: SdActionEntry) => {
    await setKeyAction(
      keyIndex,
      makeSdPluginAction(entry) as Action,
    );
    setShowActionPicker(false);
  };

  const handleClearAction = async () => {
    await setKeyAction(keyIndex, undefined);
  };

  const handleImageUpdate = async (imageConfig: Partial<KeyImage>) => {
    if (!keyConfig) return;
    const currentImage = keyConfig.image || { type: "text", source: "" };
    const newImage = { ...currentImage, ...imageConfig } as KeyImage;
    await updateKeyConfig(keyIndex, { image: newImage });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const filePath = (file as unknown as { path: string }).path;
      if (filePath) {
        await handleImageUpdate({
          type: "static",
          source: filePath,
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleLabelUpdate = async (label: string) => {
    await updateKeyConfig(keyIndex, { label });
  };

  const startMacroRecording = async () => {
    setIsRecordingMacro(true);
    await (window as any).bigdeck.action.startMacroRecording();
  };

  const stopMacroRecording = async () => {
    setIsRecordingMacro(false);
    const steps = await (window as any).bigdeck.action.stopMacroRecording();
    if (keyConfig?.action && keyConfig.action.type === "macro") {
      await setKeyAction(keyIndex, {
        ...keyConfig.action,
        steps: steps || [],
      } as Action);
    }
  };

  const updateMacroStep = async (stepIndex: number, updates: any) => {
    if (keyConfig?.action && keyConfig.action.type === "macro") {
      const newSteps = [...(keyConfig.action as any).steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], ...updates };
      await setKeyAction(keyIndex, {
        ...keyConfig.action,
        steps: newSteps,
      } as Action);
    }
  };

  const removeMacroStep = async (stepIndex: number) => {
    if (keyConfig?.action && keyConfig.action.type === "macro") {
      const newSteps = [...(keyConfig.action as any).steps];
      newSteps.splice(stepIndex, 1);
      await setKeyAction(keyIndex, {
        ...keyConfig.action,
        steps: newSteps,
      } as Action);
    }
  };

  if (!keyConfig) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground/50 text-sm">
        Key data not available
      </div>
    );
  }

  const applyActionTemplate = async (tpl: (typeof QUICK_ASSIGN)[number]) => {
    await setKeyAction(keyIndex, {
      ...tpl.action,
      id: crypto.randomUUID(),
      name: tpl.label,
    } as Action);
    await updateKeyConfig(keyIndex, { label: tpl.label });
    setActiveTab("action");
    setShowActionPicker(false);
  };

  const renderActionPicker = () => (
    <div className="w-full rounded-2xl border border-border/70 bg-muted/20 p-3 grid gap-2">
      {ACTION_OPTIONS.map((option) => (
        <button
          key={option.type}
          onClick={() => handleActionSelect(option.type)}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${
            keyConfig.action?.type === option.type
              ? "border-primary bg-primary/10 text-primary"
              : "border-transparent hover:border-border hover:bg-muted/40"
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            {option.icon}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold">{option.label}</div>
            <div className="text-[11px] text-muted-foreground">
              {option.description}
            </div>
          </div>
          <ChevronRight size={14} className="text-muted-foreground/60" />
        </button>
      ))}

      {/* Discovered Elgato .sdPlugin actions (localized names). */}
      {sdActions.length > 0 && (
        <>
          <div className="col-span-full flex items-center gap-2 pt-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              SD Plugin Actions
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          {sdActions.map((entry) => {
            const isAssigned =
              keyConfig.action?.type === "sdplugin" &&
              (keyConfig.action as any).actionUUID === entry.actionUUID &&
              (keyConfig.action as any).pluginUUID === entry.pluginUUID;
            return (
              <button
                key={`${entry.pluginUUID}:${entry.actionUUID}`}
                onClick={() => void handleSdActionSelect(entry)}
                title={entry.tooltip || entry.name}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${
                  isAssigned
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent hover:border-border hover:bg-muted/40"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Puzzle size={18} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {entry.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {entry.pluginName}
                  </div>
                </div>
                <SdPluginBadge />
                <ChevronRight size={14} className="text-muted-foreground/60" />
              </button>
            );
          })}
        </>
      )}
    </div>
  );

  const renderActionForm = () => {
    if (!keyConfig.action) {
      return (
        <div className="flex flex-col gap-4 text-sm text-muted-foreground items-center justify-center py-16">
          <p className="text-center max-w-xs">
            This key doesn't have an action yet. Assign one from quick templates
            below or choose a type.
          </p>
          <div className="grid grid-cols-1 gap-3 w-full">
            {QUICK_ASSIGN.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyActionTemplate(tpl)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {tpl.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm text-foreground">
                    {tpl.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {tpl.description}
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/60" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowActionPicker((prev) => !prev)}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
          >
            {showActionPicker ? "Hide Action Types" : "Choose Action Type"}
          </button>
          {showActionPicker && renderActionPicker()}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Configure{" "}
            {keyConfig.action.type === "sdplugin"
              ? "SD Plugin Action"
              : ACTION_OPTIONS.find((o) => o.type === keyConfig.action?.type)
                  ?.label}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowActionPicker((prev) => !prev)}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
            >
              {showActionPicker ? "Close Picker" : "Change Action"}
            </button>
            <button
              onClick={handleClearAction}
              className="text-[10px] font-black tracking-widest text-destructive hover:opacity-70 transition-opacity uppercase px-3 py-1 rounded-full bg-destructive/5 border border-destructive/20"
            >
              Reset
            </button>
          </div>
        </div>

        {showActionPicker && renderActionPicker()}

        <div className="p-5 rounded-2xl border border-border/60 bg-muted/10 space-y-5">
          {keyConfig.action.type === "sdplugin" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <Puzzle size={14} className="text-primary" />
                SD Plugin Action
              </label>
              <div className="text-xs space-y-1">
                <div className="text-muted-foreground">
                  Plugin:{" "}
                  <span className="text-foreground font-mono break-all">
                    {(keyConfig.action as any).pluginUUID}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Action:{" "}
                  <span className="text-foreground font-mono break-all">
                    {(keyConfig.action as any).actionUUID}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Presses are dispatched to the plugin (keyDown/keyUp over the
                local SD host); the instance starts with empty settings.
              </p>
            </div>
          )}

          {keyConfig.action.type === "keyboard-shortcut" && (
            <ShortcutRecorder
              keys={(keyConfig.action as any).keys || []}
              modifiers={(keyConfig.action as any).modifiers || []}
              onChange={(keys, modifiers) =>
                setKeyAction(keyIndex, {
                  ...keyConfig.action,
                  keys,
                  modifiers,
                } as Action)
              }
            />
          )}

          {keyConfig.action.type === "launch-app" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <AppWindow size={14} className="text-primary" />
                Application Executable
              </label>
              <div className="flex gap-2">
                <PathPicker
                  type="file"
                  value={(keyConfig.action as any).command || ""}
                  onChange={(command) =>
                    setKeyAction(keyIndex, {
                      ...keyConfig.action,
                      command,
                    } as Action)
                  }
                />
                <button
                  onClick={() =>
                    handleSmartIconApp((keyConfig.action as any).command)
                  }
                  className="px-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 flex items-center gap-2"
                  aria-label="Auto-fetch app icon"
                  title="Auto-fetch App Icon"
                >
                  <Zap size={16} />
                </button>
              </div>
            </div>
          )}

          {keyConfig.action.type === "open-folder" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <FolderOpen size={14} className="text-primary" />
                Target Directory
              </label>
              <PathPicker
                type="directory"
                value={(keyConfig.action as any).path || ""}
                onChange={(path) =>
                  setKeyAction(keyIndex, {
                    ...keyConfig.action,
                    path,
                  } as Action)
                }
              />
            </div>
          )}

          {keyConfig.action.type === "open-url" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <Globe size={14} className="text-primary" />
                Target URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <label
                    htmlFor="url-input"
                    className="text-sm font-bold flex items-center gap-2"
                  >
                    <Globe size={14} className="text-primary" />
                    Target URL
                  </label>
                  <input
                    id="url-input"
                    type="text"
                    value={(keyConfig.action as any).url || ""}
                    onChange={(e) =>
                      setKeyAction(keyIndex, {
                        ...keyConfig.action,
                        url: e.target.value,
                      } as Action)
                    }
                    placeholder="https://example.com"
                    className="w-full h-11 px-4 pr-10 bg-muted/40 border-2 border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  />
                  <ExternalLink
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </div>
                <button
                  onClick={() =>
                    handleSmartIconLink((keyConfig.action as any).url)
                  }
                  className="px-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 flex items-center gap-2"
                  aria-label="Auto-fetch favicon"
                  title="Auto-fetch Favicon"
                >
                  <Zap size={16} />
                </button>
              </div>
            </div>
          )}

          {keyConfig.action.type === "multimedia" && (
            <MediaControlEditor
              action={keyConfig.action as any}
              onChange={(updatedAction) =>
                setKeyAction(keyIndex, updatedAction as Action)
              }
            />
          )}

          {keyConfig.action.type === "run-script" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <Terminal size={14} className="text-primary" />
                Advanced Scripting
              </label>
              <div className="relative">
                <select
                  value={(keyConfig.action as any).scriptType || "shell"}
                  onChange={(e) =>
                    setKeyAction(keyIndex, {
                      ...keyConfig.action,
                      scriptType: e.target.value,
                    } as Action)
                  }
                  className="w-full h-11 px-4 pr-10 bg-muted/40 border-2 border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer font-medium"
                >
                  <option value="shell">Shell (bash/sh)</option>
                  <option value="python">Python</option>
                  <option value="node">Node.js</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {/* Source mode: point at a script file OR paste inline code.
                  Explicit state (scriptSourceMode) drives the view; switching
                  modes clears the other field so the executor never sees both. */}
              <div className="flex gap-2">
                {(
                  [
                    ["file", "Script file"],
                    ["inline", "Paste code"],
                  ] as const
                ).map(([mode, label]) => {
                  const active = scriptSourceMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setScriptSourceMode(mode);
                        if (mode === "file") {
                          // Fresh file mode starts with an empty path.
                          setKeyAction(keyIndex, {
                            ...keyConfig.action,
                            script: "",
                            scriptFile: "",
                          } as Action);
                        } else {
                          setKeyAction(keyIndex, {
                            ...keyConfig.action,
                            scriptFile: undefined,
                          } as Action);
                        }
                      }}
                      className={`px-3 h-8 rounded-lg text-xs font-medium border transition-all ${
                        active
                          ? "bg-primary/15 text-primary border-primary/40"
                          : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {scriptSourceMode === "file" ? (
                <PathPicker
                  type="file"
                  value={(keyConfig.action as any).scriptFile || ""}
                  onChange={(scriptFile: string) => {
                    // Infer the interpreter from the extension so "point at
                    // file → press" just works: .py → python, .js/.mjs/.cjs →
                    // node, everything else → shell. The dropdown stays as a
                    // manual override.
                    const ext = scriptFile.split(".").pop()?.toLowerCase();
                    const inferred =
                      ext === "py"
                        ? "python"
                        : ext === "js" || ext === "mjs" || ext === "cjs"
                          ? "node"
                          : "shell";
                    setKeyAction(keyIndex, {
                      ...keyConfig.action,
                      scriptFile,
                      scriptType: inferred,
                    } as Action);
                  }}
                />
              ) : (
                <textarea
                  value={(keyConfig.action as any).script || ""}
                  onChange={(e) =>
                    setKeyAction(keyIndex, {
                      ...keyConfig.action,
                      script: e.target.value,
                      scriptFile: undefined,
                    } as Action)
                  }
                  placeholder="#!/bin/bash\n# Write your code here"
                  className="w-full h-40 p-4 bg-muted/40 border-2 border-border rounded-xl text-xs font-mono focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                />
              )}
            </div>
          )}

          {keyConfig.action.type === "close-app" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <XCircle size={14} className="text-primary" />
                Close App
              </label>
              <input
                type="text"
                value={(keyConfig.action as any).target || ""}
                onChange={(e) =>
                  setKeyAction(keyIndex, {
                    ...keyConfig.action,
                    target: e.target.value,
                  } as Action)
                }
                placeholder="Process name or window title, e.g. firefox"
                className="w-full h-11 px-4 bg-muted/40 border-2 border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
              />
              <p className="text-[11px] text-muted-foreground">
                Asks matching windows to close gracefully (wmctrl on X11);
                falls back to SIGTERM on the exact process name. Force-kill is
                never used.
              </p>
            </div>
          )}

          {keyConfig.action.type === "key-brightness" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <Sun size={14} className="text-primary" />
                Key Brightness
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={(keyConfig.action as any).brightness ?? 50}
                  onChange={(e) =>
                    setKeyAction(keyIndex, {
                      ...keyConfig.action,
                      brightness: Number(e.target.value),
                    } as Action)
                  }
                  className="flex-1 accent-primary"
                />
                <span className="w-12 text-right text-sm font-bold tabular-nums">
                  {(keyConfig.action as any).brightness ?? 50}%
                </span>
              </div>
            </div>
          )}

          {keyConfig.action.type === "soundboard" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <Volume2 size={14} className="text-primary" />
                Audio File
              </label>
              <PathPicker
                type="file"
                placeholder="Pick a sound sample (wav, mp3, ogg...)"
                value={(keyConfig.action as any).samplePath || ""}
                onChange={(samplePath) =>
                  setKeyAction(keyIndex, {
                    ...keyConfig.action,
                    samplePath,
                  } as Action)
                }
              />
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Volume
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={(keyConfig.action as any).volume ?? 100}
                    onChange={(e) =>
                      setKeyAction(keyIndex, {
                        ...keyConfig.action,
                        volume: Number(e.target.value),
                      } as Action)
                    }
                    className="flex-1 accent-primary"
                  />
                  <span className="w-12 text-right text-sm font-bold tabular-nums">
                    {(keyConfig.action as any).volume ?? 100}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pressing the key again restarts the same sample. Playback goes
                through paplay → pw-play → ffplay → cvlc (first installed
                wins); volume support varies slightly per backend.
              </p>
            </div>
          )}

          {keyConfig.action.type === "soundboard.stop" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <Square size={14} className="text-primary" />
                Stop All Sounds
              </label>
              <p className="text-[11px] text-muted-foreground">
                Stops every sound started by Soundboard keys — nothing to
                configure.
              </p>
            </div>
          )}

          {keyConfig.action.type === "timer" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <TimerIcon size={14} className="text-primary" />
                Countdown
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={(keyConfig.action as any).minutes ?? 0}
                    onChange={(e) =>
                      setKeyAction(keyIndex, {
                        ...keyConfig.action,
                        minutes: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      } as Action)
                    }
                    className="w-full h-11 px-4 bg-muted/40 border-2 border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Seconds
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={(keyConfig.action as any).seconds ?? 0}
                    onChange={(e) =>
                      setKeyAction(keyIndex, {
                        ...keyConfig.action,
                        seconds: Math.min(59, Math.max(0, Math.floor(Number(e.target.value) || 0))),
                      } as Action)
                    }
                    className="w-full h-11 px-4 bg-muted/40 border-2 border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold tabular-nums"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Press while running
                </label>
                <div className="relative">
                  <select
                    value={(keyConfig.action as any).pressAgain || "stop"}
                    onChange={(e) =>
                      setKeyAction(keyIndex, {
                        ...keyConfig.action,
                        pressAgain: e.target.value,
                      } as Action)
                    }
                    className="w-full h-11 px-4 pr-10 bg-muted/40 border-2 border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer font-medium"
                  >
                    <option value="stop">Stops the timer</option>
                    <option value="restart">Restarts from full time</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                The remaining MM:SS renders live on the key; when it hits zero
                the key returns to its normal look.
              </p>
            </div>
          )}

          {keyConfig.action.type === "clock" && (
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                Digital Time
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setKeyAction(keyIndex, {
                      ...keyConfig.action,
                      use24h: (keyConfig.action as any).use24h === false,
                    } as Action)
                  }
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border hover:border-primary/40 bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-medium">24-hour time</span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                      (keyConfig.action as any).use24h !== false
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {(keyConfig.action as any).use24h !== false ? "On" : "Off"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setKeyAction(keyIndex, {
                      ...keyConfig.action,
                      showSeconds: !(keyConfig.action as any).showSeconds === true,
                    } as Action)
                  }
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border hover:border-primary/40 bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-medium">Show seconds</span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                      (keyConfig.action as any).showSeconds === true
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {(keyConfig.action as any).showSeconds === true ? "On" : "Off"}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                The clock updates itself on the key (per minute, or every
                second with seconds shown).
              </p>
            </div>
          )}

          {keyConfig.action.type === "macro" && renderAutomationTab()}
        </div>
      </div>
    );
  };

  const renderAppearanceTab = () => {
    if (!keyConfig) return null;
    const layers = keyConfig.layers || [];
    const pressedLayers = keyConfig.pressedLayers || [];
    const isSynced = keyConfig.syncPressedState !== false;

    const gradientDirection =
      keyConfig.image?.backgroundGradientDirection ||
      layers.find((l) => l.type === "background" && l.visible !== false)
        ?.backgroundGradientDirection ||
      135;

    const updateLayers = (newLayers: KeyLayer[]) => {
      updateKeyConfig(keyIndex, { layers: newLayers });
    };

    const updatePressedLayers = (newLayers: KeyLayer[]) => {
      updateKeyConfig(keyIndex, { pressedLayers: newLayers });
    };

    const handleToggleSync = () => {
      updateKeyConfig(keyIndex, {
        syncPressedState: isSynced ? false : true,
      });
      if (!isSynced) {
        setIsEditingPressed(false);
      }
    };

    const addLayerFromAsset = (asset: string, targetLayers: KeyLayer[], onChange: (layers: KeyLayer[]) => void) => {
      const hasEmptyImageSlot = targetLayers.some(
        (l) => (l.type === "image" || l.type === "icon") && !l.source,
      );
      if (hasEmptyImageSlot) {
        onChange(
          targetLayers.map((l) =>
            (l.type === "image" || l.type === "icon") && !l.source
              ? { ...l, source: `bigdeck-asset://${encodeURIComponent(asset)}` }
              : l,
          ),
        );
      } else {
        // order semantics match KeyRenderer.renderWithLayers (0 = bottom):
        // max(order) + 1 puts the new image on TOP of the stack.
        onChange([
          ...targetLayers,
          {
            id: crypto.randomUUID(),
            type: "image" as const,
            visible: true,
            opacity: 1,
            order: targetLayers.reduce(
              (max, l) => Math.max(max, l.order ?? 0),
              -1,
            ) + 1,
            source: `bigdeck-asset://${encodeURIComponent(asset)}`,
            fit: "contain" as const,
          },
        ]);
      }
    };

    const renderPreviewKey = (
      previewLayers: KeyLayer[],
      _isPressed: boolean,
      _direction: number,
    ) => {
      // LayerStack renders the true z-order, identical to hardware compositing.
      return (
        <div className="aspect-square rounded-lg border border-border/60 relative overflow-hidden bg-black">
          <LayerStack layers={previewLayers} />
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {/* Preview */}
        <div className="p-2 rounded-lg border border-border/70 bg-muted/10">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Preview
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-1">
                Idle
              </div>
              {renderPreviewKey(layers, false, gradientDirection)}
            </div>
            <div>
              <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-1">
                Pressed
              </div>
              {isSynced ? (
                <div className="relative">
                  {renderPreviewKey(layers, true, gradientDirection)}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">
                      Same as Idle
                    </span>
                  </div>
                </div>
              ) : (
                renderPreviewKey(
                  pressedLayers.length > 0 ? pressedLayers : layers,
                  true,
                  gradientDirection,
                )
              )}
            </div>
          </div>
        </div>

        {/* Sync Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg border border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Different when pressed</span>
          </div>
          <button
            onClick={handleToggleSync}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              isSynced ? "bg-muted" : "bg-primary"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                isSynced ? "left-0.5" : "left-[1.35rem]"
              }`}
            />
          </button>
        </div>

        {/* Layer Editor */}
        {isSynced ? (
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Layers
            </div>
            <LayerEditor
              layers={layers}
              onChange={updateLayers}
              assets={assets}
              onUploadAsset={handleUploadAsset}
              onDropAsset={(asset) => addLayerFromAsset(asset, layers, updateLayers)}
            />
          </div>
        ) : (
          <div>
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => setIsEditingPressed(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  !isEditingPressed
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent hover:border-primary/30 text-muted-foreground"
                }`}
              >
                Idle Layers
              </button>
              <button
                onClick={() => setIsEditingPressed(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isEditingPressed
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent hover:border-primary/30 text-muted-foreground"
                }`}
              >
                Pressed Layers
              </button>
            </div>
            {isEditingPressed ? (
              <LayerEditor
                layers={pressedLayers}
                onChange={updatePressedLayers}
                assets={assets}
                onUploadAsset={handleUploadAsset}
                onDropAsset={(asset) => addLayerFromAsset(asset, pressedLayers, updatePressedLayers)}
              />
            ) : (
              <LayerEditor
                layers={layers}
                onChange={updateLayers}
                assets={assets}
                onUploadAsset={handleUploadAsset}
                onDropAsset={(asset) => addLayerFromAsset(asset, layers, updateLayers)}
              />
            )}
          </div>
        )}

        {/* Asset Library */}
        {assets.length > 0 && (
          <div className="p-2 rounded-lg border border-border/70 bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Asset Library
              </div>
              <button
                onClick={handleUploadAsset}
                className="px-2 py-1 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-[10px] font-bold text-primary transition-colors flex items-center gap-1"
              >
                <Upload size={12} />
                Upload
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto scrollbar-thin">
              {assets.map((asset) => (
                <div
                  key={asset}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "bigdeck/asset",
                      asset,
                    );
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="relative group rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => {
                    const currentLayers = isEditingPressed && !isSynced ? pressedLayers : layers;
                    const onChange = isEditingPressed && !isSynced ? updatePressedLayers : updateLayers;
                    addLayerFromAsset(asset, currentLayers, onChange);
                  }}
                >
                  <AssetImage
                    src={`bigdeck-asset://${encodeURIComponent(asset)}`}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                  <button
                    onClick={(e) => handleDeleteAsset(e, asset)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 size={8} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Label */}
        <div className="p-2 rounded-lg border border-border/70 bg-muted/10 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Label
          </div>
          {(keyConfig.layers || []).some(
            (l) => l.type === "text" && l.visible,
          ) && (
            <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-200/90">
              This key also has visible text layer(s) — those are separate
              from this Label. Toggle them in the Layers list.
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={keyConfig.label || ""}
              onChange={(e) => {
                updateKeyConfig(keyIndex, { label: e.target.value });
              }}
              placeholder="No label..."
              className="flex-1 h-9 px-3 bg-muted/40 border-2 border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
            />
            <button
              onClick={() => {
                if (keyConfig.label) {
                  updateKeyConfig(keyIndex, { label: undefined });
                } else {
                  const name = keyConfig.label || keyConfig.action?.name || "";
                  updateKeyConfig(keyIndex, { label: name });
                }
              }}
              className={`p-1.5 rounded-lg border transition-all ${
                keyConfig.label
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-muted text-muted-foreground hover:text-foreground"
              }`}
              title={keyConfig.label ? "Label visible" : "Label hidden"}
            >
              <Eye size={14} />
            </button>
          </div>
          {keyConfig.label && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-1 block">
                  Position
                </label>
                <select
                  value={keyConfig.labelPosition || "bottom"}
                  onChange={(e) => {
                    updateKeyConfig(keyIndex, {
                      labelPosition: e.target.value as "top" | "center" | "bottom",
                    });
                  }}
                  className="w-full h-9 px-3 bg-muted/40 border-2 border-border rounded-lg text-sm outline-none"
                >
                  <option value="bottom">Bottom</option>
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-1 block">
                  Color
                </label>
                <input
                  type="color"
                  value={keyConfig.labelColor || "#ffffff"}
                  onChange={(e) => {
                    updateKeyConfig(keyIndex, { labelColor: e.target.value });
                  }}
                  className="w-full h-9 rounded-lg bg-muted/40 border-2 border-border overflow-hidden cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAutomationTab = () => {
    if (!keyConfig?.action || keyConfig.action.type !== "macro") {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground/50 text-sm">
          Macro recording not available for this action type
        </div>
      );
    }

    const steps = (keyConfig.action as any).steps || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Repeat size={14} className="text-primary" />
              Multi-Step Workflow
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record a sequence of actions to execute with one key press
            </p>
          </div>
          <button
            onClick={
              isRecordingMacro ? stopMacroRecording : startMacroRecording
            }
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              isRecordingMacro
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <Play size={16} className={isRecordingMacro ? "opacity-50" : ""} />
            {isRecordingMacro ? "Stop Recording" : "Start Recording"}
          </button>
        </div>

        {isRecordingMacro && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <Clock size={20} className="animate-pulse" />
              <span className="text-sm font-bold text-destructive">
                Recording in progress... Press keys on your Stream Deck
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {steps.map((step: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/5 group"
            >
              <div className="text-[10px] font-black text-muted-foreground w-6">
                {index + 1}
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="relative">
                  <select
                    value={step.actionType || "keyboard-shortcut"}
                    onChange={(e) =>
                      updateMacroStep(index, { actionType: e.target.value })
                    }
                    className="h-9 w-full px-2 pr-6 bg-muted/30 border-2 border-border rounded-lg text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="keyboard-shortcut">Shortcut</option>
                    <option value="launch-app">App</option>
                    <option value="open-url">URL</option>
                    <option value="open-folder">Folder</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>

                {step.actionType === "keyboard-shortcut" && (
                  <input
                    type="text"
                    value={step.shortcut || ""}
                    onChange={(e) =>
                      updateMacroStep(index, { shortcut: e.target.value })
                    }
                    placeholder="Ctrl+K"
                    className="h-9 px-2 bg-muted/30 border-2 border-border rounded-lg text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  />
                )}

                {(step.actionType === "launch-app" ||
                  step.actionType === "open-folder") && (
                  <input
                    type="text"
                    value={step.path || ""}
                    onChange={(e) =>
                      updateMacroStep(index, { path: e.target.value })
                    }
                    placeholder="/path/to/app"
                    className="h-9 px-2 bg-muted/30 border-2 border-border rounded-lg text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  />
                )}

                {step.actionType === "open-url" && (
                  <input
                    type="text"
                    value={step.url || ""}
                    onChange={(e) =>
                      updateMacroStep(index, { url: e.target.value })
                    }
                    placeholder="https://example.com"
                    className="h-9 px-2 bg-muted/30 border-2 border-border rounded-lg text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  />
                )}

                <button
                  onClick={() => removeMacroStep(index)}
                  className="w-9 h-9 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors flex items-center justify-center"
                  title="Remove step"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/50 text-sm">
              No steps yet. Click "Start Recording" to begin, or add steps
              manually above.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-[320px] h-full bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl">
      <div className="flex-none p-3 border-b border-border bg-card/50 backdrop-blur-sm z-10 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black tracking-tight text-foreground">
            Edit Key
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] uppercase font-bold tracking-widest align-middle">
              #{keyIndex + 1}
            </span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close key editor"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-3">
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setActiveTab("action")}
              className={`flex-1 p-2 rounded-lg border transition-all text-xs font-semibold ${
                activeTab === "action"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent hover:border-primary/30"
              }`}
            >
              Action
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`flex-1 p-2 rounded-lg border transition-all text-xs font-semibold ${
                activeTab === "appearance"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent hover:border-primary/30"
              }`}
            >
              Appearance
            </button>
          </div>

          {activeTab === "action" && renderActionForm()}
          {activeTab === "appearance" && renderAppearanceTab()}
        </div>
      </div>
    </div>
  );
}
