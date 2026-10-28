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
  FileUp,
  X,
  AlertTriangle,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useProfileStore } from "../stores/profileStore";
import { DEVICE_SPECS } from "../../shared/constants";
import type { Profile, DeviceType } from "../../shared/types";
import type { ElgatoImportReport } from "../../main/profiles/elgato/ElgatoProfileImporter";

const EMPTY_ELGATO_REPORT: ElgatoImportReport = {
  ok: false,
  profileId: null,
  profileName: "",
  deviceType: null,
  importedKeys: 0,
  skippedKeys: [],
  warnings: [],
  errors: [],
};

export function ProfileManager() {
  const {
    profiles,
    activeProfile,
    createProfile,
    deleteProfile,
    activateProfile,
    exportProfile,
    importProfile,
    initialize,
  } = useProfileStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDevice, setNewProfileDevice] =
    useState<DeviceType>("original");
  const [isImportingElgato, setIsImportingElgato] = useState(false);
  const [elgatoReport, setElgatoReport] = useState<ElgatoImportReport | null>(
    null,
  );

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

  /**
   * Designate this profile as THE default (star action). The flip happens in
   * main (ProfileManager.setDefaultProfile — one default at a time), so the
   * full list is re-fetched afterwards to refresh every card's chip state.
   */
  const handleSetDefault = async (profileId: string) => {
    try {
      await window.bigdeck?.profile.setDefault(profileId);
      await initialize();
    } catch (error) {
      console.error("Failed to set default profile:", error);
    }
  };

  /**
   * Import an official Elgato `.streamDeckProfile` zip: native file dialog
   * (dialog:open-file spreads renderer options over the openFile properties,
   * so filters ride along — no dedicated IPC needed) → main-process importer
   * → report card. On success the profile list is refreshed from main (the
   * import writes through ProfileManager, which the store doesn't observe).
   */
  const handleImportElgato = async () => {
    let filePaths: string[] | undefined;
    try {
      filePaths = await window.bigdeck?.dialog.openFile({
        title: "Import Elgato Profile",
        filters: [
          {
            name: "Elgato Stream Deck Profile",
            extensions: ["streamDeckProfile"],
          },
        ],
      });
    } catch (error) {
      console.error("Elgato profile dialog failed:", error);
      return;
    }
    if (!filePaths || filePaths.length === 0) return;

    setIsImportingElgato(true);
    try {
      const report = await window.bigdeck?.profile.importElgato(filePaths[0]);
      if (report) {
        setElgatoReport(report);
        if (report.ok) await initialize();
      }
    } catch (error) {
      setElgatoReport({
        ...EMPTY_ELGATO_REPORT,
        errors: [String(error)],
      });
    } finally {
      setIsImportingElgato(false);
    }
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
            onClick={handleImportElgato}
            disabled={isImportingElgato}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            title="Import an official Elgato .streamDeckProfile export"
          >
            <FileUp size={18} />
            {isImportingElgato ? "Importing..." : "Import Elgato Profile"}
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

      {/* Elgato import result card */}
      {elgatoReport && (
        <ElgatoImportResultCard
          report={elgatoReport}
          onDismiss={() => setElgatoReport(null)}
        />
      )}

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
            onSetDefault={() => handleSetDefault(profile.id)}
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

interface ElgatoImportResultCardProps {
  report: ElgatoImportReport;
  onDismiss: () => void;
}

/**
 * Result card for an Elgato `.streamDeckProfile` import — success summary
 * (name, device, imported key count) plus the full skipped/warning/error
 * detail the importer reports, so a partial import is never silent.
 */
function ElgatoImportResultCard({
  report,
  onDismiss,
}: ElgatoImportResultCardProps) {
  const deviceName = report.deviceType
    ? DEVICE_SPECS[report.deviceType as DeviceType]?.name ?? report.deviceType
    : "Unknown device";

  return (
    <div
      className={`mb-6 bg-card border rounded-xl p-4 ${
        report.ok ? "border-green-500/40" : "border-destructive/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {report.ok ? (
            <CheckCircle2 size={18} className="text-green-500" />
          ) : (
            <AlertTriangle size={18} className="text-destructive" />
          )}
          <div>
            <h3 className="font-semibold text-sm">
              {report.ok
                ? `Imported "${report.profileName}"`
                : "Elgato profile import failed"}
            </h3>
            {report.ok && (
              <p className="text-xs text-muted-foreground">
                {deviceName} • {report.importedKeys} key
                {report.importedKeys !== 1 ? "s" : ""} imported
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Dismiss import report"
        >
          <X size={14} />
        </button>
      </div>

      {report.skippedKeys.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Skipped keys ({report.skippedKeys.length})
          </div>
          <div className="max-h-24 overflow-y-auto space-y-0.5">
            {report.skippedKeys.map((skip, i) => (
              <div
                key={`${skip.keyIndex}-${skip.uuid}-${i}`}
                className="text-xs text-muted-foreground"
              >
                <span className="font-mono">#{skip.keyIndex}</span>{" "}
                {skip.reason}{" "}
                <span className="text-muted-foreground/60">({skip.uuid})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-medium text-yellow-500 uppercase tracking-wider mb-1">
            Warnings ({report.warnings.length})
          </div>
          <div className="space-y-0.5">
            {report.warnings.map((warning, i) => (
              <div key={i} className="text-xs text-yellow-500/90">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {report.errors.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-medium text-destructive uppercase tracking-wider mb-1">
            Errors ({report.errors.length})
          </div>
          <div className="space-y-0.5">
            {report.errors.map((error, i) => (
              <div key={i} className="text-xs text-destructive">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProfileCardProps {
  profile: Profile;
  isActive: boolean;
  onActivate: () => void;
  onDelete: () => void;
  onExport: () => void;
  onSetDefault: () => void;
}

function ProfileCard({
  profile,
  isActive,
  onActivate,
  onDelete,
  onExport,
  onSetDefault,
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
            <h3 className="font-semibold flex items-center gap-2 flex-wrap">
              {profile.name}
              {isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  Active
                </span>
              )}
              {profile.isDefault && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500"
                  title="The profile the deck returns to when no auto-switch rule matches the focused app"
                >
                  <Star size={10} />
                  DEFAULT
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
                      onSetDefault();
                      setShowMenu(false);
                    }}
                    disabled={Boolean(profile.isDefault)}
                    title={
                      profile.isDefault
                        ? "Already the default profile"
                        : "The deck returns to this profile when no auto-switch rule matches"
                    }
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Star size={14} className={profile.isDefault ? "text-yellow-500" : ""} />
                    {profile.isDefault ? "Default" : "Set as Default"}
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
