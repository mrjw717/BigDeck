import React from "react";
import {
  Sun,
  Moon,
  Monitor,
  Wifi,
  Bell,
  HardDrive,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useAppStore } from "../stores/appStore";

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
