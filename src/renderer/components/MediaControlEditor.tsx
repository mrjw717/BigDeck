import React, { useEffect, useState, useCallback } from "react";
import {
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  RefreshCw,
  Monitor,
  Check,
} from "lucide-react";
import type { MultimediaAction } from "../../shared/types";

interface MediaPlayerInfo {
  id: string;
  name: string;
  status: "playing" | "paused" | "stopped";
  metadata?: {
    title?: string;
    artist?: string;
  };
}

interface MediaControlEditorProps {
  action: MultimediaAction;
  onChange: (action: MultimediaAction) => void;
}

type MediaTarget = "system" | "global" | string;

const VOLUME_ACTIONS = [
  { command: "volume-up" as const, label: "Volume Up", icon: Volume2 },
  { command: "volume-down" as const, label: "Volume Down", icon: Volume2 },
  { command: "mute" as const, label: "Mute", icon: VolumeX },
];

const PLAYBACK_ACTIONS = [
  { command: "play-pause" as const, label: "Play/Pause", icon: Play },
  { command: "next" as const, label: "Next", icon: SkipForward },
  { command: "previous" as const, label: "Previous", icon: SkipBack },
  { command: "stop" as const, label: "Stop", icon: Square },
];

export function MediaControlEditor({
  action,
  onChange,
}: MediaControlEditorProps) {
  const [players, setPlayers] = useState<MediaPlayerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTargets, setShowTargets] = useState(false);

  const target = action.target || "system";
  const isVolumeTarget = target === "system";
  const availableActions = isVolumeTarget ? VOLUME_ACTIONS : PLAYBACK_ACTIONS;

  const loadPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const playerList = await (window as any).bigdeck.media.listPlayers();
      setPlayers(playerList || []);
    } catch (error) {
      console.error("Failed to load media players:", error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleTargetChange = (newTarget: MediaTarget) => {
    onChange({
      ...action,
      target: newTarget,
      mediaCommand: newTarget === "system" ? "volume-up" : "play-pause",
    });
    setShowTargets(false);
  };

  const handleCommandChange = (command: string) => {
    onChange({ ...action, mediaCommand: command as any });
  };

  const getTargetLabel = () => {
    if (target === "system") return "System Volume";
    if (target === "global") return "Global Media Keys";
    const player = players.find((p) => p.id === target);
    return player?.name || target;
  };

  const getPlayerEmoji = (playerId: string) => {
    const id = playerId.toLowerCase();
    if (id.includes("spotify")) return "\uD83C\uDFB5";
    if (id.includes("vlc")) return "\uD83C\uDFA5";
    if (id.includes("firefox") || id.includes("chrome")) return "\uD83C\uDF10";
    return "\uD83C\uDFB6";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold flex items-center gap-2">
          <Music size={14} className="text-primary" />
          Media Target
        </label>
        <button
          onClick={loadPlayers}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <button
        onClick={() => setShowTargets(!showTargets)}
        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-muted/20 hover:bg-muted/40 transition-all"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
          {target === "system"
            ? "\uD83D\uDD0A"
            : target === "global"
              ? "\u2318\uFE0F"
              : getPlayerEmoji(target)}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-bold">{getTargetLabel()}</div>
          <div className="text-[10px] text-muted-foreground">
            {target === "system"
              ? "Control system volume"
              : target === "global"
                ? "Send media keys to active app"
                : players.find((p) => p.id === target)?.status || "Ready"}
          </div>
        </div>
      </button>

      {showTargets && (
        <div className="space-y-1 border-2 border-border rounded-xl p-2 bg-card">
          <button
            onClick={() => handleTargetChange("system")}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
              target === "system"
                ? "bg-primary/10 border-2 border-primary"
                : "hover:bg-muted/40"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
              \uD83D\uDD0A
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-bold">System Volume</div>
              <div className="text-[10px] text-muted-foreground">
                Control audio output
              </div>
            </div>
            {target === "system" && (
              <Check size={14} className="text-primary" />
            )}
          </button>

          <button
            onClick={() => handleTargetChange("global")}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
              target === "global"
                ? "bg-primary/10 border-2 border-primary"
                : "hover:bg-muted/40"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
              \u2318\uFE0F
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-bold">Global Media Keys</div>
              <div className="text-[10px] text-muted-foreground">
                Send to active application
              </div>
            </div>
            {target === "global" && (
              <Check size={14} className="text-primary" />
            )}
          </button>

          {players.length > 0 && (
            <div className="pt-2 border-t border-border mt-2">
              <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1 px-1">
                Detected Players ({players.length})
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleTargetChange(player.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                      target === player.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
                      {getPlayerEmoji(player.id)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-bold truncate">
                        {player.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {player.status === "playing"
                          ? "\u25B6 Playing"
                          : player.status === "paused"
                            ? "\u23F8 Paused"
                            : "\u23F9 Stopped"}
                        {player.metadata?.title &&
                          ` - ${player.metadata.title}`}
                      </div>
                    </div>
                    {target === player.id && (
                      <Check size={14} className="text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && players.length === 0 && (
            <div className="text-center py-3 text-muted-foreground/50 text-xs">
              No media players detected
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-bold">Action</label>
        <div className="grid grid-cols-3 gap-2">
          {availableActions.map((act) => {
            const Icon = act.icon;
            const isSelected = action.mediaCommand === act.command;
            return (
              <button
                key={act.command}
                onClick={() => handleCommandChange(act.command)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-bold">{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
