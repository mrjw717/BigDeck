# BigDeck ↔ Elgato Stream Deck 7.6 — Built-in Action Matrix

**Date:** 2026-10-25
**Reference:** Elgato Stream Deck 7.6 (macOS), extracted at
`~/Documents/Reverse-Engineering/streamdeck/extracted/app/Applications/Stream Deck.app/Contents/Resources/Plugins/`
— 25 `.sdPlugin` bundles, 34 action UUIDs. Every bundle carries
`PrivateAPI: true`: the actions are compiled into the Stream Deck app itself
(manifests + localizations + icons only, no plugin source). Behavior below is
reconstructed from the manifests' action names/tooltips, controller
registrations, and observed app behavior.
**BigDeck tree:** audit at commit `a59a6c0` + the quick-win commit(s) on top.

## Legend

Status values:

- **works** — implemented, runs with tools present on a stock Linux desktop
- **works-with-tool** — implemented; requires an installable system tool
  (injection tools on Wayland, etc.); degrades with a truthful log + install hint
- **static-only** — implemented in a degraded form (render-time, no live tick)
- **missing** — not implemented; design section referenced
- **n/a** — Elgato-app-internal UI or debug affordance; no BigDeck equivalent planned

Verification values:

- **unit** — pinned by unit tests (`ActionExecutor.test.ts`, `KeyRenderer.test.ts`, …)
- **log** — verified by `bigdeck.log` evidence on this machine (commit `e4b6b35`
  hardware-press session)
- **manual** — requires physical hardware / an interactive session; steps listed

## This machine's tool inventory (verified via `which`, 2026-10-25)

| present | absent |
| --- | --- |
| `systemctl`, `pactl`, `amixer`, `dbus-send`, `gdbus`, `paplay`, `pw-play`, `ffplay`, `aplay`, `xprop` | `xdotool`, `wmctrl`, `playerctl`, `ydotool`, `wtype` |

Session: **Wayland** (`XDG_SESSION_TYPE=wayland`). Practical consequence: key
injection needs `ydotool`+ydotoold or `wtype`; graceful window closing falls
back to SIGTERM because `wmctrl` is absent; soundboard playback backends
(`paplay`/`pw-play`/`ffplay`) are all present.

---

## Matrix A — Elgato built-in actions vs BigDeck

Grouped by source plugin, alphabetical by UUID. "Controllers" from the
manifest: Keypad = regular keys, Encoder = SD+ dials, Neo = SD+ touchscreen.

| Elgato action (UUID) | Controllers | What it does | BigDeck equivalent | Status | Verification | Gap notes |
| --- | --- | --- | --- | --- | --- | --- |
| `com.elgato.streamdeck.system.actionbar` | Keypad | Show/hide the Elgato app's Action Bar overlay | — | n/a | — | App-internal UI overlay, not an OS action. BigDeck's analog would be its own window management; not planned. |
| `com.elgato.streamdeck.system.assert` | Keypad, Encoder | Trap assertion (developer diagnostic) | — | n/a | — | Debug-only tool for plugin authors. |
| `com.elgato.streamdeck.system.close` | Keypad | Close all instances of an app | `close-app` | **works-with-tool** | unit | Implemented (this audit): `wmctrl -ic` per matching window title on X11 → SIGTERM `-x` exact process name fallback (the only path on Wayland). Never SIGKILL — "close" lets apps save. Missing `wmctrl`/`pkill` logs an install hint. |
| `com.elgato.streamdeck.system.debug` (bundle) | — | Bundle container for the assert action | — | n/a | — | |
| `com.elgato.streamdeck.system.digitaltime` | Neo | Display a custom digital clock (self-updating) | text-layer tokens `{date}` `{time}` `{weekday}` | **static-only** | unit | Implemented (this audit): tokens resolve at render time; layer frame-cache key includes the resolved value so it rolls over at midnight. Full clock needs a per-minute re-render tick → design §"Tick rendering". |
| `com.elgato.streamdeck.dial.stack` | Encoder | Combine multiple dials into a stack | — | missing | — | Requires native dial bindings (§"Dial/Encoder bindings"). |
| `com.elgato.streamdeck.keys.stack` (Action Wheel) | Encoder | Assign multiple actions to a dial, rotate to cycle | — | missing | — | Requires dial bindings + an action-cycle registry (§"Dial/Encoder bindings"). |
| `com.elgato.streamdeck.keys.adaptor` (Action Trigger) | Encoder | Trigger actions with a dial turn | — | missing | — | Same dependency as above. |
| `com.elgato.streamdeck.keys.logic` | Keypad | Trigger actions with key clicks (click/double/hold) | — | missing | — | Needs press-duration classification in the hardware dispatch path before ActionExecutor. Design candidate for the flow-creator trigger family (ADR-0001 `trigger.keyPress` variants). |
| `com.elgato.streamdeck.multiactions.delay` | Keypad | Pause the action sequence | `macro` step `delay`; ADR-0001 `core.delay` | **works** | unit | Macro steps are `key`/`text`/`delay` with per-step duration. |
| `com.elgato.streamdeck.multiactions.routine` (Multi Action) | Keypad | Execute multiple actions in sequence | `macro` (keystroke/text chains); flows (arbitrary actions) | **partial** | unit | Macro covers keystroke sequences only; chaining arbitrary action types is the ADR-0001 flow engine (§"Multi-action ↔ flows"). |
| `com.elgato.streamdeck.multiactions.routine2` (Multi Action Switch) | Keypad | Toggle between two Multi Actions | — | missing | — | Pairs with hotkeyswitch state design (§"Toggle-state actions") + flows. |
| `com.elgato.streamdeck.multiactions.random` (Random Action) | Keypad | Execute a random action | — | missing | — | Natural `core.random` flow node in ADR-0001. |
| `com.elgato.streamdeck.page.goto` | Keypad | Switch to specified page | `switch-page` (`pageIndex`) | **works** | unit | ProfileManager.setActivePage + re-render; log evidence from `e4b6b35` dispatch chain. |
| `com.elgato.streamdeck.page.indicator` | Keypad | Displays current page number | — | missing | — | Display-state action, no tick needed — §"Display-state actions". |
| `com.elgato.streamdeck.page.next` | Keypad | Next page | `switch-page` (+1) | **missing (trivial)** | — | One delta-handler on the existing switch-page callback — §"Page prev/next". |
| `com.elgato.streamdeck.page.previous` | Keypad | Previous page | `switch-page` (−1) | **missing (trivial)** | — | Same as above. |
| `com.elgato.streamdeck.profile.backtoparent` | Keypad | Open parent folder (page hierarchy) | — | missing | — | §"Page hierarchy". |
| `com.elgato.streamdeck.profile.openchild` | Keypad | Create a folder (page hierarchy child) | — | missing | — | §"Page hierarchy". |
| `com.elgato.streamdeck.profile.rotate` (Switch Profile) | Keypad | Switch to a preconfigured profile (dial-rotate flavor on SD+) | `switch-profile` | **works** (key) / missing (dial) | unit | Key press path works. The dial-rotate variant needs native encoder bindings (§"Dial/Encoder bindings"). |
| `com.elgato.streamdeck.soundboard.playaudio` | Keypad | Play a sound bite / effect / music clip | — | missing | — | Backends (`paplay`, `pw-play`, `ffplay`) all present on this machine. Design §"Soundboard". |
| `com.elgato.streamdeck.soundboard.stopaudioplay` | Keypad | Stop all Soundboard playback | — | missing | — | Same design; needs a playback registry to kill. |
| `com.elgato.streamdeck.system.hotkey` | Keypad, Encoder | Activate a key command | `keyboard-shortcut` | **works-with-tool** | unit + log | X11: `xdotool key combo`; Wayland: ydotool → wtype chain with install hints (commit `e4b6b35` fixed combo syntax + fallbacks). Encoder variant same story. |
| `com.elgato.streamdeck.system.hotkeyswitch` | Keypad | Toggle between two key commands (2 states) | — | missing | — | §"Toggle-state actions". |
| `com.elgato.streamdeck.system.keybrightness` | Keypad, Encoder | Adjust Stream Deck key brightness | `key-brightness` | **works** | unit | Implemented (this audit): 0–100 via `onKeyBrightness` → `DeviceManager.setBrightness`. Hardware press targets its device; network triggers fan out to all. Encoder-relative steps (±5%) need a read-modify API — gap note in §"Key brightness follow-ups". |
| `com.elgato.streamdeck.system.mouse-wheel` | Encoder | Activate a wheel scroll | — | missing | — | Needs scroll injection: X11 `xdotool click 4/5`, Wayland has no portable CLI (candidates: `ydotool` has no wheel; `wtype` neither) — §"Mouse wheel". |
| `com.elgato.streamdeck.system.multimedia` | Keypad, Encoder | Control media playback | `multimedia` | **works-with-tool** | unit | Volume: amixer/pactl. Transport: playerctl → MPRIS via dbus-send with live bus discovery (commit `e4b6b35`) → XF86 keys. Encoder-dial volume steps land with dial bindings. |
| `com.elgato.streamdeck.system.open` | Keypad | Open an app, file or folder | `launch-app` / `open-folder` / `open-url` (`file://`) | **works** | unit | File-open is reachable today via `open-url` with a `file://` path (`xdg-open` handles it); dedicated `open-file` sugar is optional. |
| `com.elgato.streamdeck.system.openapp` | Keypad | Open an app | `launch-app` | **works** | unit + log | PATH resolution, executable-bit check, `gtk-launch` .desktop fallback for Steam/Flatpak-style installs (commit `e4b6b35`). |
| `com.elgato.streamdeck.system.pagination` | Neo | Display current page selection (touchscreen) | — | missing | — | Same display-state design as page.indicator, on the SD+ touchscreen — requires dial-slot rendering. |
| `com.elgato.streamdeck.system.sleep` | Keypad | Put the computer to sleep | `system-sleep` | **works** | unit | Implemented (this audit): `systemctl suspend`; refusal (polkit, masked sleep target) logs the reason. Manual verify: press key → machine suspends. |
| `com.elgato.streamdeck.system.text` | Keypad | Type or paste precomposed text | `macro` (single `text` step) | **works-with-tool** | unit | Reachable today: macro with one text step (`wtype`/`ydotool` on Wayland, `xdotool` on X11 — commit `e4b6b35` fixed the Wayland path). A dedicated single-shot `type-text` action type would be a trivial alias if the macro hop feels heavy in the UI. |
| `com.elgato.streamdeck.system.timer` | Keypad | Timer, acoustic + visual (countdown render, alarm) | — | missing | — | §"Tick rendering" + §"Soundboard" (alarm sound). |
| `com.elgato.streamdeck.system.website` | Keypad | Open URL | `open-url` | **works** | unit | `xdg-open`; missing xdg-utils logs an install hint. |
| `com.elgato.streamdeck.system.vsdtoggle` | Keypad | Show/hide the Virtual Stream Deck window | — | n/a | — | Elgato-app-internal virtual device window. BigDeck analog: windowed deck preview (renderer feature, not an action). |

Coverage summary: **12 of 34 UUIDs have a working BigDeck equivalent**
(9 pre-existing + 3 from this audit), 1 static-only, 2 n/a, 19 missing — but
the missing set is dominated by three root causes (tick rendering, dial
bindings, flows), each addressed by one design below rather than 19 separate
features.

---

## Matrix B — BigDeck native action types

| BigDeck type | Executor case | UI (palette + editor) | Status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| `keyboard-shortcut` | ✔ | ✔ | works-with-tool | unit + log | xdotool (X11) / ydotool→wtype (Wayland), install hints (`e4b6b35`) |
| `launch-app` | ✔ | ✔ | works | unit + log | PATH/exe resolution + gtk-launch fallback (`e4b6b35`) |
| `multimedia` | ✔ | ✔ | works-with-tool | unit | amixer/pactl, playerctl, MPRIS dbus-send, XF86 fallback chain |
| `open-url` | ✔ | ✔ | works | unit | xdg-open |
| `open-folder` | ✔ | ✔ | works | unit | xdg-open (manual for file-manager-of-choice) |
| `run-script` | ✔ | ✔ | works | manual | bash/python3/node -c, detached; only spawn errors are logged by design |
| `macro` | ✔ | ✔ | works-with-tool | unit | key/text/delay steps; text uses wtype/ydotool on Wayland |
| `switch-profile` | ✔ | via UI page list | works | unit | ProfileManager.activateProfile |
| `switch-page` | ✔ | via UI page list | works | unit | ProfileManager.setActivePage |
| `system-sleep` | ✔ | ✔ | works | unit | **new** — systemctl suspend |
| `close-app` | ✔ | ✔ | works-with-tool | unit | **new** — wmctrl (X11) → pkill -TERM chain |
| `key-brightness` | ✔ | ✔ | works | unit | **new** — onKeyBrightness → DeviceManager |
| `sdplugin` | ✔ | via SD placement | works | unit (27 SD-host tests) | Third-party Elgato-compatible plugins via SDPluginHost |
| *(declared)* `toggle-folder` | ✘ | ✘ | **dead** | — | In `ActionType` union but no executor case → "Unknown action type" warning if dispatched. Superseded by the page-hierarchy design. Remove from the union or implement. |
| *(declared)* `obs-action` | ✘ | ✘ | **dead** | — | Legacy PluginManager has a hardcoded obs-websocket entry, but no executor dispatch. Either wire through PluginManager or drop. |
| *(declared)* `system-command` | ✘ | ✘ | **dead** | — | Overlaps `run-script`; recommend dropping from the union. |
| *(declared)* `plugin` | ✘ | ✘ | **dead** | — | Same as obs-action — legacy plugin host never dispatched an action of this type. |
| *(feature)* date/time text tokens | — | LayerEditor hint | static-only | unit | **new** — `{date}` `{time}` `{weekday}` in text layers |

---

## Gap designs (big-ticket items → future ADRs/issues)

### 1. Tick rendering — real clock, timer, countdown badges

Covers: `system.digitaltime` (full clock), `system.timer`, any per-second UI.

**Problem.** BigDeck renders keys only on config change (HardwareSync diff +
debounce). A clock needs re-renders nobody's config change triggered.

**Proposed design — TickerService + time-bucketed render keys.**

- New main-process `TickerService` (single `setInterval`, never per-key):
  emits `tick` with a coarse resolution (1 s base; clocks only need 1 min —
  timer needs 1 s).
- Display actions (`clock-display`, `timer-display`) declare their tick
  bucket. HardwareSync gains `registerTickKey(deviceId, keyIndex, keyConfig,
  bucketMs)`; on each tick it re-renders **only keys whose bucket elapsed**,
  reusing `scheduleKeyRender(..., { immediate: true })` — the per-key
  generation counter and image cache already make this safe and cheap.
- The render hash must include the current time bucket (e.g. minute string)
  or the diff will skip the re-render; same mechanism the date-token cache key
  already uses (that's why tokens substitute inside `layerCacheKey`).
- Timer semantics: settings = duration; press starts/pauses/resets (state
  machine per placement, persisted like SD-plugin state in
  `~/.config/bigdeck/…`); render = `mm:ss`; expiry → optional `paplay` chime
  (§2) + optional flash frames (KeyRenderer already emits frame arrays).
- Sleep/resume: recompute "now" deltas from wall clock, not tick counting, so
  a suspended machine doesn't drift the timer.
- Cost estimate: TickerService ~100 LOC, HardwareSync registry ~80, two
  action types + editor panels, tests with fake timers.

### 2. Soundboard — sample playback + stop

Covers: `soundboard.playaudio`, `soundboard.stopaudioplay`, timer alarm.

**Verified on this machine:** `paplay` (PulseAudio/PipeWire), `pw-play`
(PipeWire), `ffplay` (ffmpeg — plays anything) all present.

**Proposed design.**

- Action type `soundboard`: `{ samplePath, volume?, device? }`; executor
  backend chain: `pw-play` → `paplay` → `ffplay -nodisp -autoexit`, first
  available wins (same fallback philosophy as multimedia).
- **Playback registry** (module-level in main): `playToken → child process`.
  Default behavior per Elgato: a new press on the same sample stops and
  restarts it (overlap only across different samples).
- `soundboard-stop`: kill all registered children (SIGTERM, then SIGKILL
  after 500 ms). Without the registry, "stop" is impossible — this is why
  soundboard is not a one-liner over run-script.
- Volume: pre-scale via `pactl` per-stream is unreliable across backends;
  v1 keeps files at native volume, per-sample gain arrives with a `sox`/ffmpeg
  pre-pass or PipeWire node volume later.
- No new npm dependencies. Graceful degradation: no backend → truthful log +
  "install pipewire-pulse or ffmpeg" hint.
- Tests: command construction per backend, registry restart semantics,
  stop-all kill path (mocked child processes).

### 3. Multi-action ↔ macro ↔ flow creator

Covers: `multiactions.routine`, `routine2`, `random`, `delay`; the planned
workflow creator (ADR-0001).

**Relationship.** BigDeck already has three chaining layers; they are stages
of the same continuum, not competitors:

| Elgato concept | Today | ADR-0001 flows (planned) |
| --- | --- | --- |
| Delay step | `macro` step `delay` | `core.delay` node |
| Key/text sequences | `macro` | `action.keyboardShortcut` / a `typeText` node |
| Multi Action (chain of arbitrary actions) | **not possible** | linear flow — the simplest graph |
| Multi Action Switch (toggle A/B) | not possible | `trigger.toggleState` / two branches off a state variable |
| Random Action | not possible | `core.random` node picking an outgoing edge |
| Conditions, variables, sub-flows, cross-plugin triggers | not possible | the whole point of the graph |

**Position:** `macro` stays as the fast path for keystroke automation
(recorded, hardware-timed). Flows supersede it for anything branching,
cross-action, or stateful — and per ADR-0001 v1 (engine + JSON authoring)
already beats Elgato's fixed list. Elgato's `SupportedInMultiActions: false`
flags (timer, hotkeyswitch, page nav) become irrelevant: flows decide their
own composition rules per node type.

**Action for the backlog:** file ADR-0002 (engine) from ADR-0001 phase 1;
`multiactions.*` rows close automatically.

### 4. Page hierarchy (folders) — back-to-parent / open-child

Covers: `profile.backtoparent`, `profile.openchild`.

**Problem.** `Profile.pages` is a flat array (`ProfilePage[]`, `activePage`
index). Elgato's folders are a tree: a key opens a child folder-page; a
back-to-parent key returns.

**Proposed design.**

- Add optional `parentPageId: string` to `ProfilePage` (flat storage, tree
  semantics — no schema migration beyond an optional field; cycles rejected at
  save, same rule as flows).
- `switch-page` keeps working on indexes; new action types
  `page-open-child` (`childPageId`) and `page-back` walk the `parentPageId`
  chain through ProfileManager (which already owns `setActivePage` and emits
  `profile:page-changed`, so the renderer + HardwareSync re-render come free).
- UI: breadcrumb in the page strip; drag a page onto another to parent it.
- Elgato's "Create Folder" (openchild) is a config-time UI affordance, not a
  runtime behavior — in BigDeck that's the page editor, so only back-to-parent
  needs a runtime action; open-child maps to `switch-page` once pages can be
  targeted by id.

### 5. Small, scoped follow-ups

- **Page prev/next** (`page.previous`/`page.next`): one
  `onSwitchPageRelative(delta)` callback next to `onSwitchPage` (activeIndex +
  delta clamped in ProfileManager). Hours, not days.
- **Toggle-state actions** (`hotkeyswitch`, `multiactions.routine2`): needs
  per-placement persistent state (1 boolean) + a two-configuration editor +
  state-swapped rendering (HardwareSync already caches idle/pressed variants;
  add a `stateVariant`). Generalizes: also serves macro A/B toggles.
- **Display-state actions** (`page.indicator`, `system.pagination`): a text
  layer whose content comes from app state at render time. Cheapest form:
  extend the token resolver (`textTokens.ts`) with state tokens —
  `{page}`, `{pageCount}`, `{profile}` — resolved by HardwareSync when it
  renders (it already has the profile). No tick needed: page changes already
  trigger re-renders. The SD+ touchscreen variant additionally needs dial-slot
  rendering.
- **Key brightness follow-ups:** relative steps (±N) need a
  `getBrightness(deviceId)` on DeviceManager (the `currentBrightness` map
  already exists, it's just private); encoder-dial brightness lands with dial
  bindings.
- **Mouse wheel** (`system.mouse-wheel`): X11 `xdotool click 4/5` is trivial;
  Wayland has no portable scroll injector (ydotool/wtype lack a wheel —
  `wlrctl` is compositor-dependent). Block on a Wayland story; ship X11-only
  with an honest log on Wayland if wanted earlier.
- **Dial/Encoder native bindings** (`dial.stack`, `keys.stack`,
  `keys.adaptor`, `profile.rotate` dial flavor, dial volume): DeviceManager
  already emits `dial:rotate|down|up|touch:tap` and SDPluginHost maps them to
  encoder slots — what's missing is (a) a `DialConfig` alongside `KeyConfig`
  (action binding per dial), (b) dial rendering for the SD+ touchscreen, (c)
  dispatch from those events into ActionExecutor. This is the gate for the
  whole Encoder controller column in Matrix A.
- **Dead declared types:** `toggle-folder`, `obs-action`, `system-command`,
  `plugin` sit in the `ActionType` union with no executor case — any profile
  carrying them logs "Unknown action type" and does nothing. Either remove
  them (recommended; `toggle-folder` is superseded by page hierarchy) or wire
  them; silent union members are a trap.

---

## Verification appendix

- **Unit:** `npx vitest --run` — 141 tests (26 added by this audit:
  `textTokens.test.ts`, executor suites for system-sleep / close-app X11+Wayland
  / key-brightness, KeyRenderer token + midnight cache-rollover tests).
- **Log evidence:** commit `e4b6b35` documents the hardware-press session on
  this Wayland machine: dispatch chain lines, per-tool failures with install
  hints, MPRIS discovery. New actions follow the identical
  `Action executing / succeeded / failed` protocol, so a hardware test of
  `system-sleep` / `close-app` / `key-brightness` is diagnosable from
  `bigdeck.log` alone.
- **Manual (hardware required):** real suspend via deck key; wmctrl window
  close against real X11 apps; brightness on physical hardware; SD+ dial rows.
- **Reference extraction:** each plugin's `manifest.json` (Actions[],
  Controllers, States, SupportedInMultiActions) + `en.json`; `PrivateAPI:
  true` on all 25 bundles — no source available, behavior from
  names/tooltips/controllers and Elgato documentation.
