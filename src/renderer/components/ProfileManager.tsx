import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  Check,
  MoreVertical,
  Layers,
  ChevronDown,
} from "lucide-react";
import { useProfileStore } from "../stores/profileStore";
import { DEVICE_SPECS } from "../../shared/constants";
import type { Profile, DeviceType } from "../../shared/types";

export function ProfileManager() {
  const {
    profiles,
    activeProfile,
    createProfile,
    deleteProfile,
    activateProfile,
    exportProfile,
    importProfile,
  } = useProfileStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDevice, setNewProfileDevice] =
    useState<DeviceType>("original");

  const handleCreate = async () => {
    if (newProfileName.trim()) {
      await createProfile(newProfileName.trim(), newProfileDevice);
      setNewProfileName("");
      setIsCreating(false);
    }
  };

  const handleExport = async (profileId: string) => {
    const json = await exportProfile(profileId);
    if (json) {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profile-${profileId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        await importProfile(text);
      }
    };
    input.click();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Profiles</h1>
          <p className="text-muted-foreground">
            Manage your Streamdeck configurations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Upload size={18} />
            Import
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            New Profile
          </button>
        </div>
      </div>

      {/* Create New Profile Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md animate-slide-up">
            <h2 className="text-xl font-semibold mb-4">Create New Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="My Profile"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Device Type
                </label>
                <div className="relative">
                  <select
                    value={newProfileDevice}
                    onChange={(e) =>
                      setNewProfileDevice(e.target.value as DeviceType)
                    }
                    className="w-full px-3 py-2 pr-8 bg-muted border-2 border-border rounded-lg text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer font-medium"
                  >
                    {Object.entries(DEVICE_SPECS).map(([type, specs]) => (
                      <option key={type} value={type}>
                        {specs.name} ({specs.keyCount} keys)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newProfileName.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isActive={activeProfile?.id === profile.id}
            onActivate={() => activateProfile(profile.id)}
            onDelete={() => deleteProfile(profile.id)}
            onExport={() => handleExport(profile.id)}
          />
        ))}

        {profiles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Layers size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Profiles Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first profile to start configuring your Streamdeck
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              Create Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProfileCardProps {
  profile: Profile;
  isActive: boolean;
  onActivate: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function ProfileCard({
  profile,
  isActive,
  onActivate,
  onDelete,
  onExport,
}: ProfileCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const specs = DEVICE_SPECS[profile.deviceType];

  return (
    <div
      className={`profile-card bg-card border rounded-xl overflow-hidden ${isActive ? "border-primary" : "border-border"}`}
    >
      {/* Preview */}
      <div className="aspect-video bg-muted/50 p-4 flex items-center justify-center">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${specs.columns}, 1fr)`,
          }}
        >
          {Array.from({ length: Math.min(specs.keyCount, 15) }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded bg-muted-foreground/20" />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {profile.name}
              {isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  Active
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {specs.name} • {profile.pages.length} page
              {profile.pages.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="More options"
              aria-expanded={showMenu}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg z-10 py-1">
                  <button
                    onClick={() => {
                      onExport();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {!isActive && (
          <button
            onClick={onActivate}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Check size={16} />
            Activate
          </button>
        )}
      </div>
    </div>
  );
}
