import React, { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Wifi,
  Bell,
  HardDrive,
  RotateCcw,
  ExternalLink,
  Keyboard,
  Play,
  Copy,
  Check,
  LayoutTemplate,
  FolderOpen,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "../stores/appStore";
import type { KeyboardInjectionStatus } from "../../main/actions/ActionExecutor";
import type { LayoutImportReport, LayoutSummary } from "../../shared/types";

/** Copyable fix command for one unavailable injection backend. */
const KEYBIND_FIXES: Record<
  string,
  { title: string; command: string; note?: string }
> = {
  uinput: {
    title: "Enable native uinput injection (works on X11 + every Wayland compositor)",
    command:
      "sudo cp udev/70-streamdeck.rules /etc/udev/rules.d/ && sudo udevadm control --reload-rules && sudo udevadm trigger",
    note: "Run from the BigDeck repo, then log out and back in.",
  },
  ydotool: {
    title: "Install ydotool + start its daemon",
    command:
      "sudo apt install ydotool && systemctl --user enable --now ydotool",
    note: "Also add your user to the input group, then re-login.",
  },
  wtype: {
    title: "Install wtype (Wayland virtual-keyboard injection)",
    command: "sudo apt install wtype",
    note: "KDE/GNOME Wayland may still reject it — prefer the uinput rule.",
  },
  xdotool: {
    title: "Install xdotool (X11 injection)",
    command: "sudo apt install xdotool",
  },
};

/** Settings card: keyboard injection backends, live test, and fix hints. */
function KeyboardInjectionCard() {
  const [status, setStatus] = useState<KeyboardInjectionStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setStatus(await window.bigdeck?.keybind.status());
    } catch (error) {
      console.error("Failed to load keyboard injection status:", error);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const runTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await window.bigdeck?.keybind.test();
      setTestResult({
        ok: Boolean(ok),
        message: ok
          ? "Test passed — the backend delivered a modifier tap (see bigdeck.log for which one)."
          : "Test failed — no backend carried the tap. Check the fixes below; details are in bigdeck.log.",
      });
    } catch (error) {
      setTestResult({ ok: false, message: String(error) });
    } finally {
      setIsTesting(false);
      await refresh();
    }
  };

  const copyCommand = async (key: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // Clipboard may be unavailable (non-secure context) — ignore.
    }
  };

  const availableCount =
    status?.backends.filter((b) => b.available).length ?? 0;
  const unavailable = status?.backends.filter((b) => !b.available) ?? [];

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Keyboard size={18} />
            Keyboard Shortcuts (Linux injection)
          </h2>
          <p className="text-sm text-muted-foreground">
            How BigDeck sends keyboard shortcuts on this session
            {status ? ` (${status.session})` : ""}
          </p>
        </div>
        <button
          onClick={() => void runTest()}
          disabled={isTesting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm disabled:opacity-50 flex-none"
        >
          <Play size={14} />
          {isTesting ? "Testing..." : "Run test"}
        </button>
      </div>

      {!status ? (
        <p className="text-sm text-muted-foreground">Loading status...</p>
      ) : (
        <div className="space-y-4">
          {/* Overall verdict */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                availableCount > 0 ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {availableCount > 0 ? (
              <span>
                {availableCount} backend{availableCount !== 1 ? "s" : ""}{" "}
                available — keyboard shortcut actions can fire
              </span>
            ) : (
              <span className="text-destructive">
                No injection backend available — keyboard shortcut actions will
                not fire
              </span>
            )}
          </div>

          {/* Backend chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {status.backends.map((backend) => (
              <div
                key={backend.name}
                className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border"
              >
                <span
                  className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-none ${
                    backend.available
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      backend.available ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {backend.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {backend.detail}
                </span>
              </div>
            ))}
          </div>

          {/* Test result */}
          {testResult && (
            <p
              className={`text-xs ${testResult.ok ? "text-green-500" : "text-destructive"}`}
            >
              {testResult.message}
            </p>
          )}

          {/* Fix commands for whatever is missing */}
          {unavailable.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-border">
              {unavailable.map((backend) => {
                const fix = KEYBIND_FIXES[backend.name];
                if (!fix) return null;
                return (
                  <div
                    key={backend.name}
                    className="p-3 rounded-lg bg-muted/20 border border-border"
                  >
                    <div className="text-xs font-medium mb-1">{fix.title}</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] font-mono bg-muted/60 border border-border rounded px-2 py-1.5 overflow-x-auto whitespace-nowrap">
                        {fix.command}
                      </code>
                      <button
                        onClick={() =>
                          void copyCommand(backend.name, fix.command)
                        }
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors text-xs flex-none"
                        aria-label={`Copy fix command for ${backend.name}`}
                      >
                        {copiedKey === backend.name ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedKey === backend.name ? "Copied" : "Copy"}
                      </button>
                    </div>
                    {fix.note && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {fix.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Settings card: imported .sdLayoutEx InfoBar layouts — gallery groundwork. */
function LayoutsGalleryCard() {
  const [layouts, setLayouts] = useState<LayoutSummary[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [report, setReport] = useState<LayoutImportReport | null>(null);

  const refresh = async () => {
    try {
      const list = (await window.bigdeck?.layouts.list()) ?? [];
      setLayouts(list);
      // Render thumbnails for layouts we don't have one for yet.
      const missing = list.filter((layout) => !previews[layout.id]);
      const rendered = await Promise.all(
        missing.map(async (layout) => {
          try {
            return [layout.id, await window.bigdeck?.layouts.preview(layout.id)] as const;
          } catch {
            return [layout.id, null] as const;
          }
        }),
      );
      setPreviews((prev) => {
        const next = { ...prev };
        for (const [id, dataUrl] of rendered) {
          if (dataUrl) next[id] = dataUrl;
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to load layouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Import a `.sdLayoutEx` package directory: native folder dialog →
   * main-process LayoutStore import (validates before copying) → report.
   */
  const handleImport = async () => {
    let dirs: string[] | undefined;
    try {
      dirs = await window.bigdeck?.dialog.openDirectory({
        title: "Import .sdLayoutEx Layout Package",
      });
    } catch (error) {
      console.error("Layout import dialog failed:", error);
      return;
    }
    if (!dirs || dirs.length === 0) return;

    setIsImporting(true);
    setReport(null);
    try {
      const result = await window.bigdeck?.layouts.import(dirs[0]);
      if (result) {
        setReport(result);
        if (result.ok) await refresh();
      }
    } catch (error) {
      setReport({
        ok: false,
        id: null,
        themeIds: [],
        elementCount: 0,
        errors: [String(error)],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LayoutTemplate size={18} />
            SD+ / Neo Layouts
          </h2>
          <p className="text-sm text-muted-foreground">
            Elgato .sdLayoutEx InfoBar layout packages
          </p>
        </div>
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm disabled:opacity-50 flex-none"
          title="Import a .sdLayoutEx layout package folder"
        >
          <FolderOpen size={14} />
          {isImporting ? "Importing..." : "Import .sdLayoutEx"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Rendering to SD+ hardware arrives with dial support — imported layouts
        are listed and previewed here today.
      </p>

      {/* Import result card */}
      {report && (
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
                    ? `Imported "${report.id}"`
                    : "Layout import failed"}
                </h3>
                {report.ok && (
                  <p className="text-xs text-muted-foreground">
                    {report.themeIds.length} theme
                    {report.themeIds.length !== 1 ? "s" : ""} •{" "}
                    {report.elementCount} element
                    {report.elementCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setReport(null)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Dismiss layout import report"
            >
              <X size={14} />
            </button>
          </div>
          {report.errors.length > 0 && (
            <div className="mt-3 space-y-0.5">
              {report.errors.map((error, i) => (
                <div key={i} className="text-xs text-destructive">
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading layouts...</p>
      ) : layouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No layouts imported yet. Import an Elgato{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.sdLayoutEx</code>{" "}
          package folder (found in your Stream Deck installation under{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
            Resources/InfobarLayouts
          </code>
          ) to see it here.
        </p>
      ) : (
        <div className="space-y-3">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border"
            >
              {previews[layout.id] ? (
                <img
                  src={previews[layout.id]}
                  alt={`${layout.id} preview`}
                  className="w-40 rounded border border-border flex-none"
                />
              ) : (
                <div className="w-40 h-[26px] rounded border border-border bg-muted flex-none flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">no preview</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{layout.id}</div>
                <div className="text-xs text-muted-foreground">
                  {layout.themeIds.length} theme
                  {layout.themeIds.length !== 1 ? "s" : ""} ({layout.themeIds.join(", ")}){" "}
                  • {layout.elementCount} element
                  {layout.elementCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function SettingsPanel() {
  const { settings, theme, setTheme, updateSettings } = useAppStore();

  const handleBrightnessChange = (brightness: number) => {
    updateSettings({ brightness });
  };

  const handleNetworkToggle = (enabled: boolean) => {
    updateSettings({
      networkControl: {
        ...settings?.networkControl,
        enabled,
        port: settings?.networkControl?.port || 8080,
      },
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure BigDeck preferences</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-3">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                    theme === "light"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Sun size={24} />
                  <span className="text-sm">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                    theme === "dark"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Moon size={24} />
                  <span className="text-sm">Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                    theme === "system"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Monitor size={24} />
                  <span className="text-sm">System</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Device Settings */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Device</h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="brightness-range"
                  className="text-sm font-medium"
                >
                  Default Brightness
                </label>
                <span className="text-sm text-muted-foreground">
                  {settings?.brightness || 100}%
                </span>
              </div>
              <input
                id="brightness-range"
                type="range"
                min="0"
                max="100"
                value={settings?.brightness || 100}
                onChange={(e) =>
                  handleBrightnessChange(parseInt(e.target.value))
                }
                className="w-full accent-primary"
              />
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts (Linux injection) */}
        <KeyboardInjectionCard />

        {/* SD+ / Neo InfoBar layouts (gallery groundwork) */}
        <LayoutsGalleryCard />

        {/* Startup */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Startup</h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <HardDrive size={18} />
                </div>
                <div>
                  <div className="font-medium">Start with System</div>
                  <div className="text-sm text-muted-foreground">
                    Launch BigDeck on login
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings?.autoStart || false}
                onChange={(e) =>
                  updateSettings({ autoStart: e.target.checked })
                }
                className="w-5 h-5 accent-primary rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="font-medium">Start Minimized</div>
                  <div className="text-sm text-muted-foreground">
                    Start in system tray
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings?.startMinimized || false}
                onChange={(e) =>
                  updateSettings({ startMinimized: e.target.checked })
                }
                className="w-5 h-5 accent-primary rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <div className="font-medium">Minimize to Tray</div>
                  <div className="text-sm text-muted-foreground">
                    Hide window instead of closing
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings?.minimizeToTray !== false}
                onChange={(e) =>
                  updateSettings({ minimizeToTray: e.target.checked })
                }
                className="w-5 h-5 accent-primary rounded"
              />
            </label>
          </div>
        </section>

        {/* Network Control */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Network Control</h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Wifi size={18} />
                </div>
                <div>
                  <div className="font-medium">Enable Remote Control</div>
                  <div className="text-sm text-muted-foreground">
                    Control via HTTP/WebSocket API
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings?.networkControl?.enabled || false}
                onChange={(e) => handleNetworkToggle(e.target.checked)}
                className="w-5 h-5 accent-primary rounded"
              />
            </label>

            {settings?.networkControl?.enabled && (
              <div className="ml-11 space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Port
                  </label>
                  <input
                    type="number"
                    value={settings.networkControl.port || 8080}
                    onChange={(e) =>
                      updateSettings({
                        networkControl: {
                          ...settings.networkControl,
                          port: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-32 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-1">API Endpoints</div>
                  <code className="text-xs text-muted-foreground">
                    http://localhost:{settings.networkControl.port}/api
                  </code>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* About */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">About</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Electron</span>
              <span className="font-medium">28.0.0</span>
            </div>
            <div className="pt-3 border-t border-border">
              <a
                href="https://github.com/bigdeck/bigdeck"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink size={16} />
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
