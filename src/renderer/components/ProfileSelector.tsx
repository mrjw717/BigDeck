import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useProfileStore } from "../stores/profileStore";
import { useDeviceStore } from "../stores/deviceStore";
import { DEVICE_SPECS } from "../../shared/constants";

// ============================================================================
// ProfileSelector — active profile display + switcher dropdown. Lists the
// profiles of the ACTIVE device (deviceStore) and activates through the same
// profile store the Profiles view uses (profileStore.activateProfile →
// window.bigdeck.profile.activate → main → applies to the hardware).
// Rendered inside StreamdeckView's device header, right of the deck name.
// ============================================================================

export function ProfileSelector() {
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

  return (
    <div
      className="relative pointer-events-auto"
      ref={dropdownRef}
    >
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent border border-border hover:bg-accent/80 transition-colors"
        aria-label={`Current profile: ${activeProfile?.name || "No Profile"}`}
        aria-haspopup="listbox"
        aria-expanded={dropdownOpen}
      >
        <span className="text-sm font-medium">
          {activeProfile?.name || "No Profile"}
        </span>
        <ChevronDown size={14} className="text-muted-foreground" />
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
  );
}
