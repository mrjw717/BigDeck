# Wiring Audit — 2026-10-25

End-to-end wiring audit of BigDeck at `c2d4665` (plus concurrent docs commit `f003593`).
Goal: find every place a user-facing pathway **silently no-ops** — the bug class this
codebase keeps producing (dead page tabs, orphaned caches, engine-without-ignition).

Scope: IPC completeness, store→persist→hardware, listener lifecycle, settings toggles,
debounce/flush, error surfacing. One trivial fix applied (see §8).

---

## 1. IPC channel map

Registered = `ipcMain.handle`/`on` in `src/main/index.ts`.
Exposed = wrapped in `src/preload/preload.ts`.
Used = invoked/listened in `src/renderer/**`.

### Invoke channels (renderer → main)

| Channel | Registered | Exposed | Used (renderer) | Verdict |
|---|---|---|---|---|
| `device:list` | ✅ :188 | ✅ | ✅ deviceStore:31 | WIRED |
| `device:connect` | ✅ :192 | ✅ | ❌ never called | Dead surface (devices auto-connect via polling; harmless but dead) |
| `device:disconnect` | ✅ :196 | ✅ | ❌ never called | Dead surface (no manual disconnect UI exists) |
| `device:set-brightness` | ✅ :203 | ✅ | ❌ `deviceStore.setBrightness` has zero callers | Dead surface — **no brightness slider exists in the UI at all** |
| `device:set-key-image` | ✅ :210 | ✅ | ❌ | Dead surface (by design: main is the only writer) |
| `device:clear-key` | ✅ :238 | ✅ | ❌ | Dead surface |
| `device:clear-all-keys` | ✅ :245 | ✅ | ❌ | Dead surface |
| `profile:list` | ✅ :253 | ✅ | ✅ profileStore:48 | WIRED |
| `profile:get` | ✅ :257 | ✅ | ❌ never called | Dead surface |
| `profile:create` | ✅ :261 | ✅ | ✅ profileStore:71 | WIRED |
| `profile:update` | ✅ :268 | ✅ | ✅ profileStore:102 | WIRED (see §2 — save→hardware is wired) |
| `profile:delete` | ✅ :272 | ✅ | ✅ profileStore:117 | WIRED |
| `profile:activate` | ✅ :276 | ✅ | ✅ profileStore:135 | WIRED |
| `profile:export` | ✅ :280 | ✅ | ✅ profileStore:340 | WIRED |
| `profile:import` | ✅ :284 | ✅ | ✅ profileStore:327 | WIRED |
| `action:execute` | ✅ :289 | ✅ | ❌ never called | Dead surface |
| `action:render-key-image` | ✅ :293 | ✅ | ❌ never called | Dead surface |
| `action:animation-delays` | ✅ :300 | ✅ | ❌ never called | Dead surface |
| `action:macro-record-start/stop` | ✅ :307/:311 | ✅ | ✅ KeyEditor:349/354 | WIRED |
| `media:players-list` | ✅ :315 | ✅ | ✅ MediaControlEditor:62 | WIRED (but see F6: `target` is ignored by the executor) |
| `settings:get` | ✅ :320 | ✅ | ✅ appStore:32 | WIRED |
| `settings:update` | ✅ :324 | ✅ | ✅ appStore:26/50 | WIRED for persistence; several settings have **no consumer** (§4) |
| `plugin:list` | ✅ :332 | ✅ | ✅ PluginsPanel:23 | WIRED |
| `plugin:enable` | ✅ :336 | ✅ | ✅ PluginsPanel:35 | HALF-WIRED — in-memory only, resets on restart, and enabling nothing (§4/§7) |
| `plugin:disable` | ✅ :340 | ✅ | ✅ PluginsPanel:37 | HALF-WIRED (same) |
| `asset:upload/list/delete` | ✅ :345/:359/:371 | ✅ | ✅ KeyEditor | WIRED |
| `asset:fetch-favicon/app-icon` | ✅ :383/:387 | ✅ | ✅ KeyEditor:245/259 | WIRED |
| `asset:read-as-data-url` | ✅ :394 | ✅ | ❌ never called | Dead surface (superseded by `bigdeck-asset://` protocol) |
| `dialog:open-file` | ✅ :436 | ✅ | ✅ KeyEditor:217, PathPicker:18 | WIRED |
| `dialog:open-directory` | ✅ :444 | ✅ | ✅ PathPicker:23 | WIRED |

No *called-but-never-registered* channels: every `window.bigdeck.*` invocation resolves to a
registered handler — no runtime "No handler registered for ..." TypeErrors today.

### Event channels (main → renderer)

| Channel | Sent by main | Preload listener | Renderer subscriber | Verdict |
|---|---|---|---|---|
| `device:connected` | ✅ index.ts:463 | ✅ `onConnected` | ✅ deviceStore:62 (App.tsx:51) | WIRED |
| `device:disconnected` | ✅ index.ts:499 | ✅ `onDisconnected` | ✅ deviceStore:66 | WIRED |
| `device:key-down` / `device:key-up` | ✅ index.ts:545/:594 | ✅ `onKeyDown/onKeyUp` | ✅ deviceStore:70/74 | WIRED (visual press feedback only) |
| `device:hardware-error` | ✅ index.ts:656 | ❌ **no preload listener exists** | ❌ | **DEAD — hardware write failures never reach the UI** (T1) |
| `device:dial-rotate/down/up`, `device:touch-tap/swipe` | ❌ never sent | ❌ not exposed | ❌ | Defined in constants only. Raw `dial:*`/`touch:*` DeviceManager events DO reach SD plugins (SDPluginHost:990-1034) but nothing else |
| `profile:changed` | ✅ index.ts:672/:816 | ✅ `onChanged` | ❌ **zero subscribers** | **HALF-WIRED — hardware/network/SD-initiated profile switches leave the UI showing the stale profile** (T2) |
| `profile:page-changed` | ✅ index.ts:693 | ✅ `onPageChanged` | ❌ **zero subscribers** | Same class as T2; also only sent from the switch-page action path, not the REST page route |
| `error` | ❌ **never sent by any main code** | ✅ `onError` exposed | ❌ never subscribed | Dead in both directions (preload offers an API for a channel that does not exist) |

---

## 2. Store → persist → hardware, per editable thing

| Editable thing | Persists? | When | Reaches hardware? | Verdict |
|---|---|---|---|---|
| Key config (action, label, layers, pressed layers, image) | ✅ `profiles` store (userData/profiles.json) | Debounced 500ms (`ProfileManager.schedulePersist`), flushed on quit | ✅ `profile:updated` → `HardwareSync.syncChangedKeys` per-key diff + 120ms debounce | **WIRED** — the best-wired path in the app |
| Page structure (add/remove/duplicate/reorder/rename pages) | ✅ same | same | ✅ via `profile:updated` | WIRED — **but no UI invokes any of it** (T3) |
| Profile create/delete/activate/import | ✅ (delete/activate write `activeProfileId` synchronously) | immediate / debounced | ✅ `profile:activated` → `applyProfileToDevice` | WIRED |
| Profile meta (rename, isDefault) | n/a | — | — | **No UI exists** to rename a profile or change the default (`Edit3` icon imported in ProfileManager.tsx, unused) |
| Active **page** | ⚠️ `profileStore.setActivePage` (profileStore.ts:146) is **local-only** — no IPC | never | never | **DEAD from the UI** (T3); hardware-side page switching (switch-page action, REST) works and persists |
| Settings → theme | ✅ settings.json | immediate (electron-store) | n/a | WIRED (renderer consumes) |
| Settings → minimizeToTray / startMinimized | ✅ | immediate | n/a | WIRED (read live in `close` / `ready-to-show`) |
| Settings → autoStart | ✅ | immediate | n/a | **DEAD — nothing ever calls `app.setLoginItemSettings`**; the toggle stores a bit (T4) |
| Settings → `brightness` ("Default Brightness") | ✅ | immediate | ❌ **no consumer anywhere** | **DEAD — never applied on device connect, never applied on change; slider is cosmetic** (T5) |
| Settings → networkControl.enabled/port | ✅ | immediate | n/a | **HALF-WIRED — `NetworkServer.start()` runs once at startup (index.ts:834-837); toggling does not start/stop the server, and the UI never says "restart required"** (T6) |
| Settings → networkControl.authToken | ✅ (schema) | — | — | **DEAD + security hole: `start(port)` is called with NO token (index.ts:836), so network control runs unauthenticated; `generateAuthToken()` has zero callers** (T7) |
| Settings → logging.level / maxFiles | ✅ (schema) | — | — | **DEAD — `new Logger()` uses its default level; settings.logging is never read** |
| Plugin enable/disable | ❌ **in-memory only** (`PluginManager.enablePlugin` mutates the object; nothing writes to disk) | — | n/a | **HALF-WIRED — toggles reset to built-in defaults on every restart** (T8) |
| Media action `target` (specific player) | ✅ in the profile | with profile save | ⚠️ action executes but **`executeMultimedia` ignores `action.target`** — always global `playerctl <cmd>` | **HALF-WIRED — the target picker silently does nothing** (F6) |

---

## 3. Listener lifecycle

**Main process (all on long-lived emitters, registered once):**

- `setupDeviceEvents()` is guarded by `areDeviceEventsSetup` (index.ts:453-459) — no duplicate
  `device:connected`/`key:down`/`key:up`/`profile:*` deliveries. ✅
- Per-device `deck.on("down"/"up")` handlers are `removeAllListeners`'d before re-registration
  (DeviceManager.ts:301-302), and per-direction debounce prevents doubled events. ✅
- `NetworkServer.setupEventForwarding()` registers listeners on DeviceManager/ProfileManager each
  time `start()` runs; `stop()` does **not** remove them. Only `start()` is called once today, so
  no live duplication — but `stop()`+`start()` (e.g. if the network toggle gets wired up, T6)
  would double-deliver every event to WS clients. ⚠️ latent
- SD host: `wireSdPlacements` / `wireSdProfileSwitching` registered once before any
  `device:connected` can fire. `SDPluginHost.stop()` removes its device listeners
  (`devicePort.off`, SDPluginHost.ts:457-460). ✅

**Renderer:**

- `deviceStore.subscribeToEvents()` is called once from App's mount effect and its returned
  unsubscribe runs on unmount (React StrictMode double-mount is cleaned up correctly). ✅
- `profile.onChanged` / `onPageChanged` / `onError`: **never subscribed by anyone** — see §1.

**Shutdown (`before-quit`, index.ts:923-958):** `preventDefault` + re-entrancy guard + 3s race cap
is solid. Runs: `profileManager.flush()` ✅, `sdPluginHost.stop()` ✅, `deviceManager.cleanup()`
(stops polling, clears retry/animation/inactivity timers, closes decks) ✅, `networkServer.stop()` ✅.

- **FIXED (one-liner):** `HardwareSync.dispose()` existed — documented "Cancel all pending renders
  (shutdown)" — but was never called; pending 120ms key-render timers could fire *into*
  `deviceManager.cleanup()` (writes to already-closed/queue-for-retry paths). Now invoked first in
  the cleanup block (index.ts:941).
- `PluginManager.cleanup()` is never called on quit either. Harmless today only because plugin
  *instances* are never created (`createPluginAPI` has zero callers) — but it's the documented
  shutdown path for the day instances exist. Reported, not fixed.
- `ActionExecutor`'s global `uIOhook` is never stopped. The hook listener itself is benign at exit;
  noted for completeness.

---

## 4. Settings panel toggle reality check

| Toggle | Store | Real behavior | Consumer |
|---|---|---|---|
| Theme light/dark/system | ✅ | ✅ changes UI | App.tsx:58 (`system` samples `matchMedia` once; no live OS-theme subscription — minor) |
| Default Brightness slider | ✅ | ❌ **none** | No consumer; hardware keeps whatever brightness it had (T5) |
| Start with System | ✅ | ❌ **none** | No `app.setLoginItemSettings` call (T4) |
| Start Minimized | ✅ | ✅ (next launch) | `ready-to-show` handler, index.ts:126 |
| Minimize to Tray | ✅ | ✅ live | window `close` handler, index.ts:135 |
| Enable Remote Control | ✅ | ⚠️ only after app restart | `initializeApp` reads it once, index.ts:834 (T6); also runs with **no auth token** (T7) |
| Network port field | ✅ | ⚠️ only after restart, same as above | — |

---

## 5. Debounce / flush hazards

- **Profile store** (`electron-store`, userData/profiles.json): 500ms trailing debounce
  (`ProfileManager.ts:49-55`), `flush()` exists and **is** called on quit (index.ts:940). Crash
  window ≤500ms of key edits. electron-store/conf writes are atomic (temp+rename), same durability
  model the SD store got in f60a18d — **the profile store does have atomic writes**. ✅
- **SD settings store** (`SDJsonStore`): debounced, atomic, `flush()` in `stop()`. ✅
- **Settings store**: synchronous electron-store writes, no debounce → no hazard. ✅
- **HardwareSync 120ms key-render debounce**: in-memory visual state only; quitting mid-debounce
  just means the last key edit may not reach hardware before exit (profile data is already
  persisted). Non-issue; timers are now cancelled at quit (see §3 fix).
- One asymmetry worth knowing: `activateProfile` writes `activeProfileId` to disk **immediately**,
  while the profile body it points at may still be in the 500ms debounce window — a crash in that
  window reactivates a profile with slightly stale keys. Acceptable, documented here.

---

## 6. Error surfacing — what the user can and cannot see

**Nothing from the main process is user-visible today. Zero.**

- `Toaster` is mounted (App.tsx:161) and fully functional — **but `toast()` has zero callers in the
  entire renderer**. Dead infrastructure.
- Preload's `onError` listens on channel `"error"` — no main code ever sends it. Double-dead.
- `device:hardware-error` IS sent (index.ts:656) but the preload exposes **no listener**, so it
  vanishes (T1).
- Renderer store `error` state (`appStore`/`deviceStore`/`profileStore`) is set on failures —
  **no component ever renders `.error`**. Failed profile saves, failed device lists: invisible
  (console only).

User-invisible failure inventory (log-only, all in bigdeck.log):

1. Hardware key-image write failures → `hardware-error` event (dropped at the preload boundary).
2. Key render failures (`HardwareSync.scheduleKeyRender` catch → logger.error).
3. Action failures: missing xdotool/ydotool/wtype/playerctl/pactl, spawn errors, "Unknown action
   type" — `ActionExecutor` logs a truthful line but never notifies the renderer. A user pressing a
   dead shortcut key gets **no feedback at all**.
4. Key presses with no matching key / no action → logger.warn only (index.ts:576-587).
5. Device connect failures/backoff (DeviceManager.recordConnectFailure) — user sees a device that
   never appears, no reason shown.
6. Plugin (SD) process crashes → host restart/kill logic logs; UI unaware.
7. Profile save failures (renderer catch → store error state → unrendered).
8. Startup failure → `console.error` + quit (index.ts:892-896); the "we might show a dialog" TODO
   is still a TODO.

---

## 7. Prioritized top-10 silent failures

| # | Severity | Finding | Location | One-line fix suggestion |
|---|---|---|---|---|
| T1 | High | `device:hardware-error` is sent to a renderer that has no listener — hardware write failures are 100% invisible. The `"error"` channel preload *does* expose is never sent by anyone. | src/preload/preload.ts (api object), src/main/index.ts:656 | Add `onHardwareError` to the preload API and surface it via the (currently uncalled) `toast()` |
| T2 | High | Hardware/REST/SD-plugin profile & page switches never update the UI: no renderer subscribes to `profile.onChanged`/`onPageChanged`; worse, the device-connect auto-switch path (index.ts:475-485) never even *sends* `PROFILE_CHANGED` | src/renderer/stores/profileStore.ts (add subscription), src/main/index.ts:466-486 | Subscribe in `profileStore` and send `PROFILE_CHANGED` after `activateProfile` in the `device:connected` handler |
| T3 | High | Page tabs in the Header are decorative: the tab buttons and "+ Add new page" have **no onClick**; `profileStore.setActivePage`/`addPage`/`removePage` have zero callers — page switching from the UI is impossible, and `setActivePage` is local-only even if it were called | src/renderer/components/Header.tsx:58-78, src/renderer/stores/profileStore.ts:146 | Wire tabs to a `setActivePage` that calls `profileManager.setActivePage` via a new IPC (main already implements it and re-renders hardware) |
| T4 | High | "Start with System" toggle persists a bit nothing reads — no `app.setLoginItemSettings` anywhere | src/main/index.ts (missing), src/renderer/components/SettingsPanel.tsx:136 | In `SETTINGS_UPDATE`, map `autoStart` → `app.setLoginItemSettings({ openAtLogin })` |
| T5 | Medium | "Default Brightness" slider is cosmetic: `settings.brightness` has no consumer; never applied on connect or change. Bonus: inactivity auto-dim restores hardcoded **100** instead of the user's value (DeviceManager.ts:1038), and `setAutoDim()` has zero callers so auto-dim can't be disabled | src/main/index.ts:834 area; src/main/device/DeviceManager.ts:1029-1052 | Apply `settings.brightness` in the `device:connected` handler and record the user's value in `currentBrightness` before dimming |
| T6 | Medium | Network Control enable/port only take effect after a full app restart; no start/stop on toggle, no "restart required" hint | src/main/index.ts:834-837, src/renderer/components/SettingsPanel.tsx:21 | Call `networkServer.stop()`/`start(port)` (or at minimum show "applies after restart") in `SETTINGS_UPDATE` |
| T7 | High (security) | Network control runs **unauthenticated**: `start(port)` is called without the token; `networkControl.authToken` exists in the schema but `generateAuthToken()` has zero callers — LAN clients can execute arbitrary actions/launch apps | src/main/index.ts:836, src/main/network/NetworkServer.ts:569 | Generate+persist a token on first enable and pass it: `start(port, settings.networkControl.authToken)` |
| T8 | Medium | Plugin enable/disable is in-memory only — resets on restart; and even enabled, legacy plugin actions are unreachable: `executePluginAction()` has zero callers and `ActionExecutor` has **no `"plugin"` case** (a `type:"plugin"` action logs "Unknown action type" and no-ops forever) | src/main/plugins/PluginManager.ts:205-239, src/main/actions/ActionExecutor.ts:125-223 | Persist `enabled` per plugin id (electron-store) and add a `"plugin"` case dispatching to `pluginManager` |
| T9 | Medium | Media action "target player" picker writes `action.target`, but `executeMultimedia` ignores it — per-player control silently degrades to global `playerctl` | src/main/actions/ActionExecutor.ts:732-751, src/renderer/components/MediaControlEditor.tsx:76 | Pass `-p <target>` / `--player <target>` to playerctl when `action.target` is set |
| T10 | Medium | No UI exists to assign `switch-profile` / `switch-page` actions (absent from ActionLibrary and KeyEditor's ACTION_OPTIONS) — the engine supports them, the ignition doesn't; users can only get them by hand-editing profile JSON | src/renderer/components/KeyEditor.tsx:63-124, src/renderer/components/ActionLibrary.tsx:30-171 | Add templates/options that populate `profileId` / `pageIndex` from the existing profiles/pages lists |

Honorable mentions (below the cut):

- Stream Deck + dial/touch events reach only SD plugins; constants define
  `device:dial-rotate/down/up`, `device:touch-tap/swipe` renderer channels that nothing sends or
  hears — native dial actions (e.g. volume) don't exist.
- Inactivity auto-dim arms only after the first key press and cannot be configured/disabled
  (`setAutoDim` uncalled); restoring uses hardcoded 100 (part of T5).
- `NetworkServer.stop()` doesn't remove its `setupEventForwarding` listeners — latent
  double-delivery if start/stop-on-toggle (T6) is implemented naively.
- `appStore`/`deviceStore`/`profileStore` `.error` state is never rendered anywhere.
- Header profile selector and Search button are decorative (no onClick).
- Multiple devices: `deviceStore.pressedKeys` is keyed by `keyIndex` only — two decks collide
  visually (cosmetic).
- `PluginManager.cleanup()` and `KeyRenderer`/`ActionExecutor` uIOhook have no shutdown call
  (benign today, documented in §3).

---

## 8. Fix applied in this commit

- `fix(wiring)`: call `hardwareSync.dispose()` in the `before-quit` cleanup block
  (src/main/index.ts:941). The method exists for exactly this purpose ("Cancel all pending renders
  (shutdown)") but was never invoked, so debounced key renders could fire into the middle of
  `deviceManager.cleanup()`.

Everything else in this report is **reported, not fixed** by design (multi-line features,
behavior/product decisions, or cross-process changes).

## 9. Verification

- `npm run typecheck` ✅ (clean)
- `npx vitest --run` ✅ 10 files, 151 tests passing
