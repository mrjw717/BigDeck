import React, { useEffect, useState } from "react";
import {
  Puzzle,
  Power,
  Settings,
  ExternalLink,
  Search,
  FileUp,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import type { PluginInfo } from "../../shared/types";
import type { SDPluginSummary, SDPluginStatus } from "../../main/plugins/sd/SDPluginHost";

// ---------------------------------------------------------------------------
// Elgato SD plugins (SDPluginHost) — installed .sdPlugin packages hosted by
// BigDeck's Stream Deck compatibility layer. Data comes from the host's
// localized summaries (sd.listPlugins); installs and enable/disable go
// through sd.installFromFile / sd.setPluginEnabled.
// ---------------------------------------------------------------------------

/** Result of an "Install plugin" run — mirrors the profile import report. */
interface SdInstallReport {
  ok: boolean;
  name?: string;
  version?: string;
  actionCount?: number;
  errors: string[];
}

const EMPTY_SD_REPORT: SdInstallReport = { ok: false, errors: [] };

export function PluginsPanel() {
  // SD host plugins
  const [sdPlugins, setSdPlugins] = useState<SDPluginSummary[]>([]);
  const [sdLoading, setSdLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installReport, setInstallReport] = useState<SdInstallReport | null>(null);

  // Legacy (BigDeck native) plugins
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSdPlugins();
    loadLegacyPlugins();
  }, []);

  const loadSdPlugins = async () => {
    setSdLoading(true);
    try {
      setSdPlugins((await window.bigdeck?.sd.listPlugins()) ?? []);
    } catch (error) {
      console.error("Failed to load SD plugins:", error);
    } finally {
      setSdLoading(false);
    }
  };

  const loadLegacyPlugins = async () => {
    setIsLoading(true);
    try {
      const list = (await window.bigdeck?.plugin.list()) || [];
      setPlugins(list);
    } catch (error) {
      console.error("Failed to load plugins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSdPlugin = async (uuid: string, enabled: boolean) => {
    try {
      await window.bigdeck?.sd.setPluginEnabled(uuid, enabled);
      await loadSdPlugins();
    } catch (error) {
      console.error("Failed to toggle SD plugin:", error);
    }
  };

  const toggleLegacyPlugin = async (pluginId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await window.bigdeck?.plugin.enable(pluginId);
      } else {
        await window.bigdeck?.plugin.disable(pluginId);
      }
      await loadLegacyPlugins();
    } catch (error) {
      console.error("Failed to toggle plugin:", error);
    }
  };

  /**
   * Install a `.streamDeckPlugin`/`.zip` distributable: native file dialog
   * (dialog:open-file spreads renderer options over the openFile properties,
   * so filters ride along — the same pattern as the Elgato profile import)
   * → main-process host install → report card + refresh.
   */
  const handleInstallSd = async () => {
    let filePaths: string[] | undefined;
    try {
      filePaths = await window.bigdeck?.dialog.openFile({
        title: "Install Stream Deck Plugin",
        filters: [
          {
            name: "Stream Deck Plugin",
            extensions: ["streamDeckPlugin", "zip"],
          },
        ],
      });
    } catch (error) {
      console.error("SD plugin install dialog failed:", error);
      return;
    }
    if (!filePaths || filePaths.length === 0) return;

    setInstalling(true);
    setInstallReport(null);
    try {
      const summary = await window.bigdeck?.sd.installFromFile(filePaths[0]);
      if (summary) {
        setInstallReport({
          ok: true,
          name: summary.name,
          version: summary.version,
          actionCount: summary.actions.length,
          errors: [],
        });
      }
      await loadSdPlugins();
    } catch (error) {
      setInstallReport({ ...EMPTY_SD_REPORT, errors: [String(error)] });
    } finally {
      setInstalling(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredSdPlugins = sdPlugins.filter(
    (plugin) =>
      !query ||
      plugin.name.toLowerCase().includes(query) ||
      plugin.uuid.toLowerCase().includes(query) ||
      plugin.actions.some((action) => action.name.toLowerCase().includes(query)),
  );
  const filteredLegacyPlugins = plugins.filter(
    (plugin) =>
      !query ||
      plugin.name.toLowerCase().includes(query) ||
      plugin.description.toLowerCase().includes(query),
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Plugins</h1>
          <p className="text-muted-foreground">Extend BigDeck with additional features</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search plugins..."
          className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* ============ Elgato SD plugins (compatibility host) ============ */}
      <section className="mb-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Elgato SD Plugins</h2>
            <p className="text-sm text-muted-foreground">
              Stream Deck SDK v2 plugins hosted by BigDeck&apos;s compatibility layer
            </p>
          </div>
          <button
            onClick={handleInstallSd}
            disabled={installing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex-none"
            title="Install a .streamDeckPlugin distributable"
          >
            <FileUp size={18} />
            {installing ? "Installing..." : "Install plugin"}
          </button>
        </div>

        {/* Install result card */}
        {installReport && (
          <SdInstallResultCard
            report={installReport}
            onDismiss={() => setInstallReport(null)}
          />
        )}

        {sdLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading SD plugins...</p>
          </div>
        ) : filteredSdPlugins.length === 0 ? (
          <div className="text-center py-8 bg-card border border-border rounded-xl">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
              <Puzzle size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">
              {query ? "No matching SD plugins" : "No SD plugins installed"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {query
                ? "Try a different search term"
                : "Install a .streamDeckPlugin package, or drop an .sdPlugin folder into the plugins directory"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSdPlugins.map((plugin) => (
              <SdPluginCard
                key={plugin.uuid}
                plugin={plugin}
                onToggle={(enabled) => toggleSdPlugin(plugin.uuid, enabled)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ============ Legacy (BigDeck native) plugins ============ */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Legacy (BigDeck native) plugins</h2>
          <p className="text-sm text-muted-foreground">
            BigDeck&apos;s original built-in plugin system
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading plugins...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLegacyPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={(enabled) => toggleLegacyPlugin(plugin.id, enabled)}
              />
            ))}

            {filteredLegacyPlugins.length === 0 && (
              <div className="text-center py-8 bg-card border border-border rounded-xl">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
                  <Puzzle size={28} className="text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">
                  {query ? "No matching plugins" : "No Plugins Found"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {query
                    ? "Try a different search term"
                    : "Install plugins to extend functionality"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <h3 className="font-medium mb-2">Installing Plugins</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Plugins can be installed by placing them in the plugins directory:
          </p>
          <code className="text-xs bg-muted px-2 py-1 rounded">
            ~/.config/bigdeck/plugins/
          </code>
        </div>
      </section>
    </div>
  );
}

interface SdInstallResultCardProps {
  report: SdInstallReport;
  onDismiss: () => void;
}

/** Result card for an SD plugin install — success summary or the full error. */
function SdInstallResultCard({ report, onDismiss }: SdInstallResultCardProps) {
  return (
    <div
      className={`mb-4 bg-card border rounded-xl p-4 ${
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
                ? `Installed "${report.name}"`
                : "SD plugin install failed"}
            </h3>
            {report.ok && (
              <p className="text-xs text-muted-foreground">
                v{report.version} • {report.actionCount} action
                {report.actionCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Dismiss install report"
        >
          <X size={14} />
        </button>
      </div>

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

/** Host process status → chip label + colors. */
const STATUS_CHIP: Record<SDPluginStatus, { label: string; className: string }> = {
  running: { label: "Running", className: "bg-green-500/20 text-green-500" },
  starting: { label: "Starting", className: "bg-blue-500/20 text-blue-500" },
  stopped: { label: "Stopped", className: "bg-muted text-muted-foreground" },
  disabled: { label: "Disabled", className: "bg-muted text-muted-foreground" },
  unsupported: { label: "Unsupported", className: "bg-red-500/20 text-red-500" },
};

interface SdPluginCardProps {
  plugin: SDPluginSummary;
  onToggle: (enabled: boolean) => void;
}

function SdPluginCard({ plugin, onToggle }: SdPluginCardProps) {
  const chip = STATUS_CHIP[plugin.status] ?? STATUS_CHIP.stopped;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Puzzle size={24} className="text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold">{plugin.name}</h3>
            <span className="text-xs text-muted-foreground">v{plugin.version}</span>
            {plugin.platformStatus === "unverified" && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-500"
                title="The manifest does not list Linux — BigDeck runs it anyway"
              >
                <ShieldAlert size={10} />
                Unverified on Linux
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${chip.className}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {chip.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono mb-2 truncate">
            {plugin.uuid}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
            {plugin.author && <span>by {plugin.author}</span>}
            <span>
              {plugin.actions.length} action{plugin.actions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Actions (localized names from the host's locale loader) */}
          {plugin.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {plugin.actions.map((action) => (
                <span
                  key={action.uuid}
                  className="px-2 py-1 text-xs bg-muted rounded-md"
                  title={action.tooltip ?? action.uuid}
                >
                  {action.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Enable/disable */}
        <button
          onClick={() => onToggle(!plugin.enabled)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors flex-none ${
            plugin.enabled
              ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
              : "bg-muted hover:bg-accent"
          }`}
        >
          <Power size={14} />
          {plugin.enabled ? "Enabled" : "Disabled"}
        </button>
      </div>
    </div>
  );
}

interface PluginCardProps {
  plugin: PluginInfo;
  onToggle: (enabled: boolean) => void;
}

function PluginCard({ plugin, onToggle }: PluginCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Puzzle size={24} className="text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{plugin.name}</h3>
            <span className="text-xs text-muted-foreground">v{plugin.version}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{plugin.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>by {plugin.author}</span>
            <span>{plugin.actions.length} actions</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(!plugin.enabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              plugin.enabled
                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                : 'bg-muted hover:bg-accent'
            }`}
          >
            <Power size={14} />
            {plugin.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Actions List */}
      {plugin.enabled && plugin.actions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Available Actions</h4>
          <div className="flex flex-wrap gap-2">
            {plugin.actions.map((action) => (
              <span
                key={action.id}
                className="px-2 py-1 text-xs bg-muted rounded-md"
                title={action.description}
              >
                {action.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
