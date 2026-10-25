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
// The bridge also consumes the host's `switchToProfile` requests and resolves
// them against ProfileManager (by profile name + device type).
//
// This file is the ONLY place the two sides meet: HardwareSync stays
// host-agnostic (no SDPluginHost import), and the host knows nothing about
// profiles. index.ts wires the bridge at startup.
// ============================================================================

import type { DeviceType, Profile } from "../../../shared/types";
import type { SdPluginPlacementChange } from "../../actions/HardwareSync";
import type { Logger } from "../../utils/Logger";
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

// ---------------------------------------------------------------------------
// switchToProfile → ProfileManager
// ---------------------------------------------------------------------------

/** The slice of ProfileManager the bridge needs (structural port). */
export interface SDProfileSwitchPort {
  getProfiles(): Profile[];
  getActiveProfile(): Profile | null;
  activateProfile(profileId: string): Profile;
}

export interface SdProfileSwitchOptions {
  host: SDPluginHost;
  profiles: SDProfileSwitchPort;
  /**
   * deviceId → DeviceType (a DeviceManager lookup); null when the device is
   * unknown/disconnected, in which case the profile name alone must match.
   */
  resolveDeviceType: (deviceId: string | null) => DeviceType | null;
  logger: Logger;
  /** Called after a successful activation (index.ts notifies the renderer). */
  onActivated?: (profile: Profile) => void;
}

/**
 * Wire the SDK `switchToProfile` request to ProfileManager.
 *
 * SDK semantics: `payload.profile` is a profile NAME and `device` (a device
 * id, top-level in the frame) selects which device's profile list applies.
 * BigDeck resolves the request by profile name, preferring a profile whose
 * deviceType matches the target device; activation goes through
 * ProfileManager.activateProfile, whose `profile:activated` event applies the
 * profile to hardware through the existing path. No match → logged no-op
 * (spec-compliant: the official app silently ignores unknown profiles).
 *
 * The host emits `didReceiveProfileChange` as the acknowledgment-shaped
 * observability event: `{ pluginUUID, context, device, profile, profileId }`
 * with profileId null when nothing matched.
 */
export function wireSdProfileSwitching(opts: SdProfileSwitchOptions): void {
  const { host, profiles, resolveDeviceType, logger, onActivated } = opts;

  host.on("switchToProfile", (raw) => {
    const { pluginUUID, context, device, profile } = raw as {
      pluginUUID: string;
      context: string | null;
      device: string | null;
      profile: string | null;
    };

    const ack = (profileId: string | null) =>
      host.emit("didReceiveProfileChange", {
        pluginUUID,
        context,
        device,
        profile,
        profileId,
      });

    if (!profile) {
      logger.warn(`[sd] ${pluginUUID}: switchToProfile without a profile name; ignored`);
      ack(null);
      return;
    }

    // Target device: the explicit device field, else the device the
    // requesting context is placed on (the SDK always sends the context).
    const deviceId = device ?? (context ? (host.getContext(context)?.deviceId ?? null) : null);
    const deviceType = resolveDeviceType(deviceId);

    const candidates = profiles.getProfiles().filter((p) => p.name === profile);
    const match = deviceType
      ? candidates.find((p) => p.deviceType === deviceType)
      : candidates[0];

    if (!match) {
      logger.warn(
        `[sd] ${pluginUUID}: switchToProfile "${profile}" matched no BigDeck profile` +
          (deviceType ? ` for device type ${deviceType}` : "") +
          "; ignored",
      );
      ack(null);
      return;
    }

    try {
      if (profiles.getActiveProfile()?.id !== match.id) {
        const activated = profiles.activateProfile(match.id);
        onActivated?.(activated);
        logger.info(
          `[sd] ${pluginUUID}: switchToProfile "${profile}" → profile "${activated.name}" (${activated.id})`,
        );
      } else {
        logger.debug(`[sd] ${pluginUUID}: switchToProfile "${profile}" is already active`);
      }
      ack(match.id);
    } catch (err) {
      logger.error(`[sd] ${pluginUUID}: switchToProfile "${profile}" failed:`, err);
      ack(null);
    }
  });
}
