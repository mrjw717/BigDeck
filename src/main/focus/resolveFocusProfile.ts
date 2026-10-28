// ============================================================================
// Focus auto-switch resolution — rule match first, default-profile fallback.
//
// Extracted from the app-entry focus handler (index.ts) as a pure function so
// the decision policy is unit-testable without Electron: the handler supplies
// the live inputs (findProfileByAutoSwitch result, active profile, default
// getter) and applies the returned profile to the hardware.
//
// Policy:
//   1. Rule hit  → activate the matched profile (the existing behavior).
//   2. Rule miss → home to the designated default profile: when the focused
//      app matches NO auto-switch rule, the deck returns to the default
//      instead of sitting on whatever was last activated.
//   3. Already-active target → null (no switch). This is the churn guard:
//      without it every focus tick would re-activate the profile and re-push
//      the profile to the hardware. "The focused app IS the current active
//      profile's source" is inherently covered by the rule engine — an active
//      profile whose rules match the focused app would have been returned as
//      the match, never as a miss.
// ============================================================================

import type { Profile } from "../../shared/types";

/**
 * Decide which profile a focus event should activate, or null when no switch
 * is needed. `getDefault` is lazy so callers can consult ProfileManager only
 * when the fallback path is actually taken.
 */
export function resolveFocusProfile(
  match: Profile | null,
  current: Profile | null,
  getDefault: () => Profile | null,
): Profile | null {
  // Rule hit: switch unless that profile is already active.
  if (match) {
    return current && current.id === match.id ? null : match;
  }

  // Rule miss: fall back to the designated default profile — but never fight
  // an already-active default (the deck is already "home"), and never when
  // there is no default at all.
  const fallback = getDefault();
  if (!fallback) return null;
  if (current && current.id === fallback.id) return null;
  return fallback;
}
