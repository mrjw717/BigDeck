// ============================================================================
// ProfileManager — behavior tests for debounced persistence
//
// Guards the "full JSON disk write per keystroke" regression: profile
// mutations must be visible in memory immediately, emitted, and coalesced
// into a single trailing disk write; flush() must persist synchronously.
//
// electron-store is replaced with an in-memory fake (external dependency).
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Profile } from "../../shared/types";
import type { Logger } from "../utils/Logger";

// Capture every FakeStore instance created by ProfileManager
const hoisted = vi.hoisted(() => ({
  instances: [] as Array<{
    writes: Array<{ key: string; value: unknown }>;
  }>,
}));

vi.mock("electron-store", () => {
  class FakeStore {
    readonly writes: Array<{ key: string; value: unknown }> = [];
    private data: Map<string, unknown>;

    constructor(opts?: { defaults?: Record<string, unknown> }) {
      this.data = new Map(Object.entries(opts?.defaults ?? {}));
      hoisted.instances.push(this);
    }

    get(key: string, fallback?: unknown): unknown {
      return this.data.has(key) ? this.data.get(key) : fallback;
    }

    set(key: string, value: unknown): void {
      this.data.set(key, value);
      this.writes.push({ key, value });
    }
  }
  return { default: FakeStore };
});

// Import AFTER the mock declaration (vi.mock is hoisted anyway)
import { ProfileManager } from "./ProfileManager";

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as unknown as Logger;

function makeProfileInput(name: string): Omit<Profile, "id" | "createdAt" | "updatedAt"> {
  return {
    name,
    deviceType: "original",
    pages: [{ id: "page-1", name: "Page 1", keys: [] }],
    activePage: 0,
  };
}

function profileWrites(): Array<{ key: string; value: unknown }> {
  const store = hoisted.instances[hoisted.instances.length - 1];
  return store.writes.filter((w) => w.key === "profiles");
}

describe("ProfileManager", () => {
  let manager: ProfileManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new ProfileManager(silentLogger);
  });

  afterEach(() => {
    manager.flush();
    vi.useRealTimers();
  });

  it("should reflect updates in memory immediately while deferring the disk write", async () => {
    // Arrange
    const created = manager.createProfile(makeProfileInput("Base"));
    await vi.advanceTimersByTimeAsync(600); // settle the create write

    // Act
    manager.updateProfile({ ...created, name: "Renamed" });

    // Assert: memory reflects the change immediately, disk not yet written
    expect(manager.getProfile(created.id)?.name).toBe("Renamed");
    const writesBeforeDebounce = profileWrites().length;
    await vi.advanceTimersByTimeAsync(600);

    // Assert: exactly one trailing write happened since the update
    expect(profileWrites().length).toBe(writesBeforeDebounce + 1);
  });

  it("should coalesce rapid successive updates into one trailing write", async () => {
    // Arrange
    const created = manager.createProfile(makeProfileInput("Base"));
    await vi.advanceTimersByTimeAsync(600);
    const settledWrites = profileWrites().length;

    // Act: burst of edits (typing / slider drag)
    manager.updateProfile({ ...created, name: "Edit 1" });
    await vi.advanceTimersByTimeAsync(100);
    manager.updateProfile({ ...created, name: "Edit 2" });
    await vi.advanceTimersByTimeAsync(100);
    manager.updateProfile({ ...created, name: "Edit 3" });
    await vi.advanceTimersByTimeAsync(600);

    // Assert
    expect(profileWrites().length).toBe(settledWrites + 1);
    expect(manager.getProfile(created.id)?.name).toBe("Edit 3");
  });

  it("should persist synchronously on flush", () => {
    // Arrange
    const created = manager.createProfile(makeProfileInput("Base"));
    const settledWrites = profileWrites().length;

    // Act
    manager.updateProfile({ ...created, name: "Flushed" });
    manager.flush();

    // Assert: written without waiting for the debounce window
    expect(profileWrites().length).toBe(settledWrites + 1);
  });

  it("should emit profile:updated with the updated profile", () => {
    // Arrange
    const created = manager.createProfile(makeProfileInput("Base"));
    const events: Profile[] = [];
    manager.on("profile:updated", (p: Profile) => events.push(p));

    // Act
    manager.updateProfile({ ...created, name: "Emitted" });

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("Emitted");
  });

  it("should throw when updating a non-existent profile", () => {
    // Arrange
    const ghost: Profile = {
      id: "does-not-exist",
      name: "Ghost",
      deviceType: "original",
      pages: [],
      activePage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Act / Assert
    expect(() => manager.updateProfile(ghost)).toThrow(
      "Profile not found: does-not-exist",
    );
  });
});

// ============================================================================
// getActiveKeyConfig — hardware press → KeyConfig dispatch lookup
//
// Regression guard for the "assigned actions never execute" investigation:
// this lookup is the single source of truth for hardware key presses, so an
// out-of-range activePage (stale persisted value) or a missing key entry must
// yield null (which callers log) instead of throwing or silently misreading
// another page.
// ============================================================================

describe("ProfileManager.getActiveKeyConfig", () => {
  let manager: ProfileManager;

  function makeKeyedProfileInput(): Omit<
    Profile,
    "id" | "createdAt" | "updatedAt"
  > {
    return {
      name: "Keyed",
      deviceType: "xl",
      pages: [
        {
          id: "page-0",
          name: "Page 0",
          keys: [
            { id: "k0", keyIndex: 0 },
            {
              id: "k1",
              keyIndex: 1,
              action: {
                id: "a1",
                name: "Mute",
                type: "multimedia",
                mediaCommand: "mute",
              } as Profile["pages"][number]["keys"][number]["action"],
            },
          ],
        },
        { id: "page-1", name: "Page 1", keys: [{ id: "k32", keyIndex: 0 }] },
      ],
      activePage: 0,
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new ProfileManager(silentLogger);
  });

  afterEach(() => {
    manager.flush();
    vi.useRealTimers();
  });

  it("resolves a key (with its action) on the active page of the active profile", () => {
    const created = manager.createProfile(makeKeyedProfileInput());
    manager.activateProfile(created.id);

    const info = manager.getActiveKeyConfig(1);

    expect(info).not.toBeNull();
    expect(info?.keyConfig.id).toBe("k1");
    expect(info?.keyConfig.action?.type).toBe("multimedia");
    expect(info?.deviceType).toBe("xl");
  });

  it("reads from the ACTIVE page, not always page 0", () => {
    const created = manager.createProfile(makeKeyedProfileInput());
    manager.activateProfile(created.id);
    manager.setActivePage(created.id, 1);

    const info = manager.getActiveKeyConfig(0);

    expect(info?.keyConfig.id).toBe("k32");
  });

  it("returns null when no profile is active", () => {
    expect(manager.getActiveKeyConfig(0)).toBeNull();
  });

  it("returns null when activePage is out of range (stale persisted value)", () => {
    const created = manager.createProfile(makeKeyedProfileInput());
    manager.activateProfile(created.id);
    // Simulate a corrupted/stale persisted activePage — must not throw.
    manager.updateProfile({ ...created, activePage: 7 });

    expect(manager.getActiveKeyConfig(0)).toBeNull();
  });

  it("returns null for a keyIndex absent from the active page", () => {
    const created = manager.createProfile(makeKeyedProfileInput());
    manager.activateProfile(created.id);

    expect(manager.getActiveKeyConfig(31)).toBeNull();
  });
});

// ============================================================================
// Default-profile designation — the focus auto-switch fallback target
//
// Exactly one profile carries isDefault at a time (setDefaultProfile clears
// the rest); getDefaultProfile resolves the fallback target lazily so the
// focus handler in index.ts only consults it on a rule miss.
// ============================================================================

describe("ProfileManager default-profile designation", () => {
  let manager: ProfileManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new ProfileManager(silentLogger);
  });

  afterEach(() => {
    manager.flush();
    vi.useRealTimers();
  });

  it("setDefaultProfile marks the chosen profile and clears every other", () => {
    const a = manager.createProfile(makeProfileInput("Alpha"));
    const b = manager.createProfile(makeProfileInput("Beta"));
    manager.setDefaultProfile(a.id);

    expect(manager.getProfile(a.id)?.isDefault).toBe(true);
    expect(manager.getProfile(b.id)?.isDefault).toBe(false);
  });

  it("moves the designation: the previous default loses isDefault", () => {
    const a = manager.createProfile(makeProfileInput("Alpha"));
    const b = manager.createProfile(makeProfileInput("Beta"));
    manager.setDefaultProfile(a.id);
    manager.setDefaultProfile(b.id);

    expect(manager.getProfile(a.id)?.isDefault).toBe(false);
    expect(manager.getProfile(b.id)?.isDefault).toBe(true);
  });

  it("persists the designation and emits profile:default-changed", () => {
    const created = manager.createProfile(makeProfileInput("Alpha"));
    const events: Profile[] = [];
    manager.on("profile:default-changed", (p: Profile) => events.push(p));

    const settledWrites = profileWrites().length;
    manager.setDefaultProfile(created.id);
    manager.flush();

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(created.id);
    expect(profileWrites().length).toBe(settledWrites + 1);
    const persisted = profileWrites().at(-1)?.value as Profile[];
    expect(persisted.find((p) => p.id === created.id)?.isDefault).toBe(true);
  });

  it("throws for a non-existent profile", () => {
    expect(() => manager.setDefaultProfile("does-not-exist")).toThrow(
      "Profile not found: does-not-exist",
    );
  });

  it("getDefaultProfile returns the isDefault profile", () => {
    manager.createProfile(makeProfileInput("Alpha"));
    const b = manager.createProfile(makeProfileInput("Beta"));
    manager.setDefaultProfile(b.id);

    expect(manager.getDefaultProfile()?.id).toBe(b.id);
  });

  it("getDefaultProfile falls back to the first profile when none is designated", () => {
    const a = manager.createProfile(makeProfileInput("Alpha"));
    manager.createProfile(makeProfileInput("Beta"));

    expect(manager.getDefaultProfile()?.id).toBe(a.id);
  });

  it("getDefaultProfile returns null when there are no profiles", () => {
    expect(manager.getDefaultProfile()).toBeNull();
  });
});
