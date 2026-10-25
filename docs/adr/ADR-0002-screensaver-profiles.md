# ADR-0002: Screensaver profiles — a new profile type with a screensaver state

- **Status:** Proposed
- **Date:** 2026-10-25
- **Relates to:** DeviceManager inactivity timer, HardwareSync, KeyRenderer, ADR-0003 (shader engine)

## Context

BigDeck's only idle-time behavior is a brightness dim: `DeviceManager` has a
5-minute inactivity timer (`INACTIVITY_TIMEOUT_MS`) that dims to 30% and
restores on any key press (`resetInactivityTimer`). The owner wants a real
**screensaver**: a full-bleed visual mode for the deck that shows while idle,
with per-key or all-keys appearance — and importantly, *no pressed state*:
keys in the screensaver have an idle look and a **screensaver look**, not a
press look. Pressing any key exits the screensaver (and that press can still
run its action).

## Decision

Add a `type` to profiles and a third appearance state to keys.

### Profile model

```jsonc
{
  "id": "…", "name": "Matrix rain", "deviceType": "xl",
  "type": "screensaver",          // NEW: "standard" (default) | "screensaver"
  "trigger": {                     // NEW, screensaver profiles only
    "onInactivityMinutes": 5,      // 0 = manual-only
    "onSchedule": null             // later: time windows
  },
  "exitOnKeyPress": true,          // default; press exits + (optionally) runs the action
  "pages": [ … ]                   // same page structure as standard profiles
}
```

### Key appearance states

`KeyConfig` gains `screensaverLayers` alongside `layers` (idle) and
`pressedLayers`:

- `layers` — never rendered while a screensaver profile is active.
- `screensaverLayers` — rendered while the screensaver shows. May be empty on
  most keys: **blank keys participate** (the screensaver is the sum of all
  keys, e.g. a starfield scattered across 32 keys).
- Per-key vs global: a global screensaver appearance (one image/animation
  tiled across the deck, or a full-panel image) is expressed as a profile-level
  default (`screensaverGlobal: { layers… }`) that keys inherit unless they
  define their own `screensaverLayers`. This gives "all the buttons or assign
  each button individually" with one mechanism.

### Engine integration (all hooks already exist)

- `DeviceManager.resetInactivityTimer` → instead of (or in addition to,
  user-configurable) dimming, when inactivity elapses: if the device's
  profile set contains a screensaver profile for that deviceType, activate it
  (same path as `applyProfileToDevice`, so HardwareSync/render/write are
  reused untouched).
- Key press while screensaver active → exit (re-activate the previous
  standard profile) and, if `exitOnKeyPress`, let the underlying key's action
  run; otherwise swallow it (configurable, default: run).
- `pressedLayers` are simply never referenced by screensaver profiles — no
  renderer changes needed beyond the state selection.
- Manual trigger: a `core.screensaver` flow node / action (ties into
  ADR-0001) and an optional UI button.

## Consequences

- ProfileManager needs profile-type awareness (screensaver profiles are not
  listed as normal switchable pages; they live in a per-deviceType
  "screensaver slot").
- HardwareSync diffing must key off the *active profile id*, which it already
  does — screensaver activation is just another apply.
- Animated screensavers (GIFs per key, or shaders per ADR-0003) run through
  the existing animation lane — latest-frame-wins already prevents backlog.

## Alternatives considered

- Separate "screensaver deck state" inside each standard profile — rejected:
  doubles every key config and complicates the editor; a dedicated profile
  type is cleaner and reuses profile import/export as shareable screensavers.
- Dimming only — status quo, rejected: the owner wants expressiveness.

## Phases

1. Profile type + inactivity trigger + layer-based screensavers (reuse
   everything; no renderer work beyond the editor exposing
   `screensaverLayers`).
2. Global-vs-per-key inheritance UI.
3. Manual trigger action + flow node; schedule trigger.
4. Shader screensavers per ADR-0003.
