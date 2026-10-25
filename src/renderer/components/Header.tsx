import React from "react";
import { Sun, Moon, Monitor, ChevronDown, Plus, Search } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import type { Profile } from "../../shared/types";

interface HeaderProps {
  activeProfile: Profile | null;
  profiles: Profile[];
}

export function Header({ activeProfile, profiles }: HeaderProps) {
  const { theme, setTheme } = useAppStore();

  const cycleTheme = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun size={18} />;
      case "dark":
        return <Moon size={18} />;
      default:
        return <Monitor size={18} />;
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left: Profile Selector */}
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
          aria-label={`Current profile: ${activeProfile?.name || "No Profile"}`}
        >
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {activeProfile?.name.charAt(0).toUpperCase() || "P"}
            </span>
          </div>
          <span className="font-medium">
            {activeProfile?.name || "No Profile"}
          </span>
          <ChevronDown size={16} className="text-muted-foreground" />
        </button>

        {/* Page Tabs */}
        {activeProfile && activeProfile.pages.length > 1 && (
          <div
            className="flex items-center gap-1 ml-4"
            role="tablist"
            aria-label="Page tabs"
          >
            {activeProfile.pages.map((page, index) => (
              <button
                key={page.id}
                role="tab"
                aria-selected={index === activeProfile.activePage}
                aria-controls={`panel-${page.id}`}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  index === activeProfile.activePage
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {page.name}
              </button>
            ))}
            <button
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Add new page"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={`Current theme: ${theme}, click to cycle`}
          title={`Theme: ${theme}`}
        >
          {getThemeIcon()}
        </button>
      </div>
    </header>
  );
}
