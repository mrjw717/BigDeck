// ============================================================================
// BigDeck - SD plugin integration bridge
//
// The thin seam between BigDeck's placement authority (HardwareSync) and the
// Elgato compatibility host (SDPluginHost). HardwareSync diffs `sdplugin`
// action placements per device on every profile apply/sync/clear and emits
// `placementsChanged`; this module translates that diff into the host's
// instance-registry API, which delivers willAppear/willDisappear per the SDK
// contract ("pages as contexts": a placed instance is visible to its plugin,
// independent of presses).
//
// This file is the ONLY place the two sides meet: HardwareSync stays
// host-agnostic (no SDPluginHost import), and the host knows nothing about
// profiles. index.ts wires the bridge at startup.
// ============================================================================

import type { SdPluginPlacementChange } from "../../actions/HardwareSync";
import type { SDController, SDPluginHost } from "./SDPluginHost";

/** The slice of HardwareSync the bridge subscribes to (structural port). */
export interface SdPlacementSource {
  on(
    event: "placementsChanged",
    listener: (change: SdPluginPlacementChange) => void,
  ): unknown;
}

/**
 * Forward placement diffs to the host. Removals are put on the wire before
 * additions so a replaced instance always announces willDisappear(old) before
 * willAppear(new). Registration uses `replace: true`: the bridge speaks for
 * the profile, so a stale registry entry in the host's slot must not win.
 */
export function wireSdPlacements(sync: SdPlacementSource, host: SDPluginHost): void {
  sync.on("placementsChanged", (change) => {
    const controller: SDController = "Keypad";

    for (const removed of change.removed) {
      host.unregisterActionInstance(change.deviceId, controller, removed.keyIndex);
    }
    for (const moved of change.changed) {
      host.unregisterActionInstance(change.deviceId, controller, moved.keyIndex);
    }
    for (const moved of change.changed) {
      host.registerActionInstance(
        {
          pluginUUID: moved.to.pluginUUID,
          actionUUID: moved.to.actionUUID,
          deviceId: change.deviceId,
          controller,
          index: moved.keyIndex,
          settings: moved.to.settings,
        },
        { replace: true },
      );
    }
    for (const added of change.added) {
      host.registerActionInstance(
        {
          pluginUUID: added.pluginUUID,
          actionUUID: added.actionUUID,
          deviceId: change.deviceId,
          controller,
          index: added.keyIndex,
          settings: added.settings,
        },
        { replace: true },
      );
    }
  });
}
