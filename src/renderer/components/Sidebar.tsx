import React from "react";
import bigdeckIcon from "../../../assets/icons/bigdeck-icon.svg";
import {
  LayoutDashboard,
  Layers,
  Puzzle,
  Settings,
  Usb,
  Unplug,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import type { DeviceInfo } from "../../shared/types";
import { useAppStore } from "../stores/appStore";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: "deck" | "profiles" | "plugins" | "settings") => void;
  devices: DeviceInfo[];
  activeDevice: DeviceInfo | null;
}

interface NavItem {
  id: "deck" | "profiles" | "plugins" | "settings";
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "deck", label: "Deck", icon: <LayoutDashboard size={20} /> },
  { id: "profiles", label: "Profiles", icon: <Layers size={20} /> },
  { id: "plugins", label: "Plugins", icon: <Puzzle size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
];

export function Sidebar({
  currentView,
  onViewChange,
  devices,
  activeDevice,
}: SidebarProps) {
  const { theme, setTheme } = useAppStore();

  // light → dark → system cycle (same behavior the Header toggle had).
  const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun size={14} />;
      case "dark":
        return <Moon size={14} />;
      default:
        return <Monitor size={14} />;
    }
  };

  return (
    <aside className="w-52 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <img
            src={bigdeckIcon}
            alt="BigDeck"
            className="w-8 h-8"
            draggable={false}
          />
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              BigDeck
            </h1>
            <p className="text-[10px] text-muted-foreground">Streamdeck</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-border">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Device
        </div>
        {devices.length > 0 ? (
          <button className="w-full flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
            <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Usb size={14} className="text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-medium">
                {activeDevice?.type.replace("-", " ").toUpperCase() ||
                  "Unknown"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {activeDevice?.keyCount || 0} keys
              </div>
            </div>
            {devices.length > 1 && (
              <ChevronDown size={14} className="text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
              <Unplug size={14} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-muted-foreground">
                No Device
              </div>
              <div className="text-[10px] text-muted-foreground">
                Connect a Streamdeck
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Navigation
        </div>
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`sidebar-item w-full text-sm ${currentView === item.id ? "active" : ""}`}
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  size: 16,
                })}
                <span className="text-xs">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div
              className={`w-1.5 h-1.5 rounded-full ${devices.length > 0 ? "bg-green-500" : "bg-muted"}`}
            />
            <span>{devices.length > 0 ? "Connected" : "Disconnected"}</span>
          </div>
          <button
            onClick={() => setTheme(nextTheme)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={`Current theme: ${theme}, switch to ${nextTheme}`}
            title={`Theme: ${nextTheme}`}
          >
            {getThemeIcon()}
          </button>
        </div>
        <div className="text-[10px] text-muted-foreground">v1.0.0</div>
      </div>
    </aside>
  );
}
