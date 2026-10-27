import React, { useEffect, useRef, useState } from "react";
import { Sun, Moon, Monitor, ChevronDown, Plus, Search, Check } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { useProfileStore } from "../stores/profileStore";
import { useDeviceStore } from "../stores/deviceStore";
import { DEVICE_SPECS } from "../../shared/constants";

// ============================================================================
// Header — profile selector (active profile + switcher dropdown), page tabs,
// search and theme toggle. The dropdown lists the profiles of the ACTIVE
// device (deviceStore) and activates through the same profile store the
// Profiles view uses (profileStore.activateProfile → window.bigdeck.profile
// .activate → main → applies to the hardware).
// ============================================================================

export function Header() {
  const { theme, setTheme } = useAppStore();
  const { profiles, activeProfile, activateProfile } = useProfileStore();
  const activeDevice = useDeviceStore((s) => s.activeDevice);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only profiles for the active device's type — switching to a profile for
  // another deck size would leave the connected hardware untouched.
  const deviceProfiles = activeDevice
    ? profiles.filter((profile) => profile.deviceType === activeDevice.type)
    : profiles;

  // Close on outside click / Escape (same pattern as ContextMenu).
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleActivate = async (profileId: string) => {
    setDropdownOpen(false);
    await activateProfile(profileId);
  };

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
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
            aria-label={`Current profile: ${activeProfile?.name || "No Profile"}`}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
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

          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Switch profile"
              className="absolute left-0 top-full mt-1 w-72 max-h-80 overflow-y-auto scrollbar-thin bg-popover border border-border rounded-lg shadow-lg z-50 py-1"
            >
              {deviceProfiles.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No profiles for this device
                </div>
              )}
              {deviceProfiles.map((profile) => {
                const isActive = activeProfile?.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => void handleActivate(profile.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">
                        {profile.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {DEVICE_SPECS[profile.deviceType]?.name ??
                          profile.deviceType}
                        {" • "}
                        {profile.pages.length} page
                        {profile.pages.length !== 1 ? "s" : ""}
                      </span>
                    </span>
                    {isActive && (
                      <Check size={14} className="flex-none text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
