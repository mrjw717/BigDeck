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
