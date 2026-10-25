// ============================================================================
// HardwareSync — sdplugin placement seam tests
//
// HardwareSync is the placement authority: these tests pin the
// `placementsChanged` diff it publishes on apply/sync/clear. The event is
// what the SD plugin bridge (SdBridge.ts) turns into willAppear /
// willDisappear, so the assertions here are about the DIFF — added, removed,
// changed — never about the host (HardwareSync must stay host-agnostic).
//
// The render-diff assertions double as regression cover for the Phase-1
// hash-clearing fix: after clearDevice() a re-apply must re-render and
// re-announce every key, because the hardware panel went blank in between.
// ============================================================================

import { describe, it, expect, vi } from "vitest";
import type { Action, KeyConfig, Profile, ProfilePage } from "../../shared/types";
import { HardwareSync, type SdPluginPlacementChange } from "./HardwareSync";

function sdAction(actionUUID: string, settings?: Record<string, unknown>): Action {
  return {
    type: "sdplugin",
    id: `action-${actionUUID}`,
    name: "SD Action",
    pluginUUID: "com.bigdeck.test.fake",
    actionUUID,
    settings,
  };
}

function key(keyIndex: number, action?: Action): KeyConfig {
  return { id: `key-${keyIndex}`, keyIndex, ...(action ? { action } : {}) };
}

function page(keys: KeyConfig[]): ProfilePage {
  return { id: "page-1", name: "Page 1", keys };
}

function profile(keys: KeyConfig[]): Profile {
  return {
    id: "profile-1",
    name: "Test Profile",
    deviceType: "original",
    pages: [page(keys)],
    activePage: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

type FakeDeviceManager = { setKeyImage: () => Promise<void> };
type FakeActionEngine = {
  renderKeyImageEx: () => Promise<{ image: Buffer; delays: number[] }>;
};

function makeSync() {
  const deviceManager: FakeDeviceManager = { setKeyImage: async () => {} };
  const renderKeyImageEx = vi.fn(async () => ({
    image: Buffer.alloc(4),
    delays: [],
  }));
  const actionEngine: FakeActionEngine = { renderKeyImageEx };
  const logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };
  const sync = new HardwareSync(
    deviceManager as unknown as HardwareSync["deviceManager"] & FakeDeviceManager,
    actionEngine as unknown as HardwareSync["actionEngine"] & FakeActionEngine,
    logger as unknown as HardwareSync["logger"],
  );
  const changes: SdPluginPlacementChange[] = [];
  sync.on("placementsChanged", (change) => changes.push(change));
  return { sync, changes, renderKeyImageEx };
}

const DEVICE = "dev1";
const PLUGIN = "com.bigdeck.test.fake";
const ACTION_A = "com.bigdeck.test.fake.actionA";
const ACTION_B = "com.bigdeck.test.fake.actionB";

/** Flush the immediate (delay-0) render timers. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("HardwareSync sdplugin placement seam", () => {
  it("emits added placements when a profile with sdplugin keys is applied", () => {
    const { sync, changes } = makeSync();

    sync.applyProfileToDevice(DEVICE, profile([key(0), key(7, sdAction(ACTION_A))]));

    expect(changes).toEqual([
      {
        deviceId: DEVICE,
        added: [
          {
            keyIndex: 7,
            pluginUUID: PLUGIN,
            actionUUID: ACTION_A,
            settings: undefined,
          },
        ],
        removed: [],
        changed: [],
      },
    ]);
  });

  it("carries the action settings and does not re-emit when nothing changed", () => {
    const { sync, changes } = makeSync();
    const profileWithSettings = profile([key(3, sdAction(ACTION_A, { token: "abc" }))]);

    sync.applyProfileToDevice(DEVICE, profileWithSettings);
    expect(changes).toHaveLength(1);
    expect(changes[0].added[0].settings).toEqual({ token: "abc" });

    // Re-apply of the identical page (e.g. device:connected after boot) is a
    // placement no-op — the plugin must not see a second willAppear.
    sync.applyProfileToDevice(DEVICE, profileWithSettings);
    expect(changes).toHaveLength(1);
  });

  it("emits removed when the action changes away from sdplugin or is cleared", () => {
    const { sync, changes } = makeSync();
    sync.applyProfileToDevice(DEVICE, profile([key(2, sdAction(ACTION_A))]));

    sync.syncChangedKeys(DEVICE, profile([key(2)])); // action cleared
    expect(changes).toHaveLength(2);
    expect(changes[1]).toMatchObject({
      deviceId: DEVICE,
      added: [],
      removed: [{ keyIndex: 2, pluginUUID: PLUGIN, actionUUID: ACTION_A }],
      changed: [],
    });

    sync.applyProfileToDevice(DEVICE, profile([key(2, sdAction(ACTION_A))]));
    sync.syncChangedKeys(
      DEVICE,
      profile([key(2, { type: "open-url", id: "u", name: "Open", url: "https://x" })]),
    );
    expect(changes).toHaveLength(4);
    expect(changes[3].removed[0]).toMatchObject({ keyIndex: 2, actionUUID: ACTION_A });
  });

  it("emits changed when a slot is re-placed with a different action identity", () => {
    const { sync, changes } = makeSync();
    // Same type AND name on both sides — the render hash ignores plugin/action
    // UUIDs, so only the placement diff may notice the swap.
    const before = { ...sdAction(ACTION_A), name: "SD Action" };
    const after = { ...sdAction(ACTION_B), name: "SD Action" };

    sync.applyProfileToDevice(DEVICE, profile([key(4, before)]));
    sync.syncChangedKeys(DEVICE, profile([key(4, after)]));

    expect(changes).toHaveLength(2);
    expect(changes[1].added).toEqual([]);
    expect(changes[1].removed).toEqual([]);
    expect(changes[1].changed).toEqual([
      {
        keyIndex: 4,
        from: { pluginUUID: PLUGIN, actionUUID: ACTION_A },
        to: { keyIndex: 4, pluginUUID: PLUGIN, actionUUID: ACTION_B, settings: undefined },
      },
    ]);
  });

  it("clearDevice retires every placement; re-apply re-announces AND re-renders", async () => {
    const { sync, changes, renderKeyImageEx } = makeSync();
    sync.applyProfileToDevice(DEVICE, profile([key(1, sdAction(ACTION_A))]));
    await settle();
    const rendersBeforeClear = renderKeyImageEx.mock.calls.length;
    expect(rendersBeforeClear).toBeGreaterThan(0);

    sync.clearDevice(DEVICE);
    expect(changes).toHaveLength(2);
    expect(changes[1]).toMatchObject({
      deviceId: DEVICE,
      added: [],
      removed: [{ keyIndex: 1, pluginUUID: PLUGIN, actionUUID: ACTION_A }],
      changed: [],
    });

    // Reconnect path: hashes were cleared, so the re-apply re-renders the key
    // (Phase-1 fix) and re-announces the placement (fresh willAppear).
    sync.applyProfileToDevice(DEVICE, profile([key(1, sdAction(ACTION_A))]));
    await settle();
    expect(changes).toHaveLength(3);
    expect(changes[2].added[0]).toMatchObject({ keyIndex: 1, actionUUID: ACTION_A });
    expect(renderKeyImageEx.mock.calls.length).toBeGreaterThan(rendersBeforeClear);
  });

  it("clearDevice for an untracked device is silent", () => {
    const { sync, changes } = makeSync();
    sync.applyProfileToDevice(DEVICE, profile([key(1, sdAction(ACTION_A))]));
    sync.clearDevice("other-device");
    expect(changes).toHaveLength(1);
  });

  it("leaves non-sdplugin keys untouched (no events, renders still scheduled)", async () => {
    const { sync, changes, renderKeyImageEx } = makeSync();

    sync.applyProfileToDevice(
      DEVICE,
      profile([key(0, { type: "open-url", id: "u", name: "Open", url: "https://x" })]),
    );
    await settle();

    expect(changes).toEqual([]);
    expect(renderKeyImageEx.mock.calls.length).toBeGreaterThan(0);
  });

  it("syncChangedKeys re-adds a placement added by a renderer edit", () => {
    const { sync, changes } = makeSync();
    // A page with no sdplugin keys emits no placement diff at all.
    sync.applyProfileToDevice(DEVICE, profile([key(0)]));
    expect(changes).toEqual([]);

    sync.syncChangedKeys(DEVICE, profile([key(0, sdAction(ACTION_A))]));
    expect(changes).toHaveLength(1);
    expect(changes[0].added[0]).toMatchObject({ keyIndex: 0, actionUUID: ACTION_A });
    expect(changes[0].removed).toEqual([]);
    expect(changes[0].changed).toEqual([]);
  });
});
