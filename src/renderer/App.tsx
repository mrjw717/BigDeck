import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { StreamdeckView } from "./components/StreamdeckView";
import { KeyEditor } from "./components/KeyEditor";
import { ProfileManager } from "./components/ProfileManager";
import { SettingsPanel } from "./components/SettingsPanel";
import { PluginsPanel } from "./components/PluginsPanel";
import { Header } from "./components/Header";
import { ActionLibrary } from "./components/ActionLibrary";
import { useAppStore } from "./stores/appStore";
import { useDeviceStore } from "./stores/deviceStore";
import { useProfileStore } from "./stores/profileStore";
import { Toaster } from "./components/ui/Toaster";

type View = "deck" | "profiles" | "plugins" | "settings";

function App() {
  const [currentView, setCurrentView] = useState<View>("deck");
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showActionLibrary, setShowActionLibrary] = useState(true);

  // Select only what's needed — store updates elsewhere don't re-render App.
  const theme = useAppStore((s) => s.theme);
  const initApp = useAppStore((s) => s.initialize);
  const devices = useDeviceStore((s) => s.devices);
  const activeDevice = useDeviceStore((s) => s.activeDevice);
  const initDevices = useDeviceStore((s) => s.initialize);
  const subscribeToEvents = useDeviceStore((s) => s.subscribeToEvents);
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const initProfiles = useProfileStore((s) => s.initialize);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        await initApp();
        await initDevices();
        await initProfiles();
        setIsInitializing(false);
      } catch (error) {
        console.error("[App] Initialization error:", error);
        setIsInitializing(false);
      }
    };
    init();

    // Subscribe to device events
    const unsubscribe = subscribeToEvents?.();
    return () => {
      unsubscribe?.();
    };
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const handleKeySelect = (keyIndex: number) => {
    setSelectedKeyIndex(keyIndex);
    setShowActionLibrary(false);
  };

  const handleKeyDeselect = () => {
    setSelectedKeyIndex(null);
    setShowActionLibrary(true);
  };

  const renderMainContent = () => {
    if (isInitializing) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading BigDeck...</p>
        </div>
      );
    }

    if (!window.bigdeck) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">
            Electron Bridge Not Available
          </h2>
          <p className="text-muted-foreground max-w-md">
            The app is running in development mode without the Electron context.
            Please run full app with{" "}
            <code className="bg-muted px-2 py-1 rounded">npm run dev</code> or{" "}
            <code className="bg-muted px-2 py-1 rounded">npm run start</code>
          </p>
        </div>
      );
    }

    switch (currentView) {
      case "deck":
        return (
          <div className="flex flex-1 h-full overflow-hidden relative">
            {showActionLibrary && !selectedKeyIndex && (
              <ActionLibrary side="left" />
            )}

            <div className="flex-1 flex bg-muted/5">
              <StreamdeckView
                device={activeDevice}
                selectedKeyIndex={selectedKeyIndex}
                onKeySelect={handleKeySelect}
              />
            </div>

            {selectedKeyIndex !== null && (
              <div className="absolute inset-y-0 right-0 w-[320px] bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col z-50">
                <KeyEditor
                  key={selectedKeyIndex}
                  keyIndex={selectedKeyIndex}
                  profile={activeProfile}
                  onClose={handleKeyDeselect}
                />
              </div>
            )}
          </div>
        );
      case "profiles":
        return <ProfileManager />;
      case "plugins":
        return <PluginsPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        devices={devices}
        activeDevice={activeDevice}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header activeProfile={activeProfile} profiles={profiles} />

        <main className="flex-1 overflow-auto">{renderMainContent()}</main>
      </div>

      <Toaster />
    </div>
  );
}

export default App;
