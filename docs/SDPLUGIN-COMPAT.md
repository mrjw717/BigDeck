# BigDeck × Elgato `.sdPlugin` Compatibility Spec

Derived from: Stream Deck 7.6.0.23012 arm64 RE (see AUDIT-2026-10-25.md)
cross-checked with the public Elgato Stream Deck SDK docs.
Goal: BigDeck hosts existing Stream Deck plugins; plugin authors write once.

## Architecture (verified in binary)

- BigDeck runs ONE WebSocket **server** on `127.0.0.1:<dynamic port>`.
- Each plugin is a separate **OS process** (spawned by BigDeck) that connects
  to the server as a WS **client**.
- Property Inspector (PI) webviews also connect as WS clients.

## Plugin discovery / install

- Plugin = directory ending `.sdPlugin` containing `manifest.json`.
- Distributable `.streamDeckPlugin` file = **ZIP** of that directory.
- Manifest keys BigDeck must honor (SDK v2):
  - `Name`, `UUID`, `Version`, `Author`, `Description`, `URL`
  - `Actions[]`: `UUID`, `Name`, `Icon`, `States[].Image`, `Tooltip`,
    `Controllers` (`Keypad` | `Encoder`), `Encoder` (StackColor etc.),
    `PropertyInspectorPath`, `States[].MultiTouchLayout`
  - `CodePathMac` / `CodePathWin` (interpreted codepaths may be `.html`,
    `.js`, `.py`, `.sh` — anything executable/scripted)
  - `PropertyInspectorPath`, `Actions[].PropertyInspectorPath`
  - `SDKVersion`, `Software.MinimumVersion`
  - `OS[]` platform list (`mac`, `windows`) — BigDeck: treat missing linux
    entry as "attempt to run anyway" (many plugins are Node/Python/HTML and
    work); surface a per-plugin "platform unverified" badge in UI.
  - `PrivateAPI: true` = built-in, never spawned from disk.

## Plugin spawn (recovered from FUN_1006c3c94)

```
<CodePath> -port <wsPort> -pluginUUID <action-uuid-or-plugin-uuid>
           -registerEvent registerPlugin -info <URL-encoded JSON>
```

- `-info` JSON (SDK v2): `{"application":{"language":"en","platform":"linux",
  "version":"..."},"devices":[{"id":"...","name":"...","size":{"rows":r,
  "columns":c},"type":N}],"pluginUUID":"...","registerEvent":"registerPlugin"}`.
  Device `type` numeric mapping must match Stream Deck's (0=SD,1=Mini,2=XL,
  5=MK.2,7=MiniMk2, 10=SD+, ... keep a table).
- Plugin's first WS message:
  `{"event":"registerPlugin","uuid":"<pluginUUID>"}`.
- BigDeck replies `{"event":"didRegisterPlugin"}` then per-action instance
  events appear as keys are assigned.

## Event protocol (JSON, `event` field)

Plugin → BigDeck:
- `logMessage`, `showOk` / `showAlert` (context-scoped)
- `setImage` `{context,payload:{image:<base64 data-URL>,target,...}}`
- `setTitle` `{context,payload:{title,target}}`
- `setSettings` / `getSettings` `{context,payload}`
- `setGlobalSettings` / `getGlobalSettings` `{context,payload}`
- `openUrl`, `setState`, `switchToProfile`, `sendToPropertyInspector`
- `getTile` / private ops seen in binary (`didReceiveSecrets`,
  `didReceiveResources`) — v2 app-only; BigDeck: implement stubs returning
  empty payloads, log unknown events instead of failing.

BigDeck → Plugin:
- `didRegisterPlugin`
- `keyDown` / `keyUp` `{action,context,device,payload:{coordinates,
  settings,userDesiredState}}`
- `dialDown` / `dialUp` / `dialRotate` `{action,context,device,
  payload:{controller:"Encoder",settings,coordinates?,ticks,pressed}}`
- `touchTap` `{payload:{controller:"Encoder",position:{x,y},...}}`
- `willAppear` / `willDisappear` `{action,context,device,payload:{
  coordinates,settings,state,title}}`
- `didReceiveSettings` / `didReceiveGlobalSettings`
- `propertyInspectorDidAppear` / `propertyInspectorDidDisappear`
- `sendToPlugin` (from PI)

## Property Inspector

- PI = HTML page (from `PropertyInspectorPath`) rendered by BigDeck in a
  webview/`BrowserWindow`, also WS client:
  `{"event":"registerPropertyInspector","uuid":<pluginUUID>,
    "action":<actionUUID>,"context":<instanceContext>,
    "device":<deviceId>}`.
- Style injection: official app injects SDPI CSS/JS libs — BigDeck serves
  the same injects (`sdpi.css` polyfills are public).

## Image contract

- `setImage` payloads are data-URLs (`data:image/png;base64,...` etc.).
- Key sizes: 72/96/144 px square per device generation; BigDeck scales to
  device native size on write (official 7.6 accepts arbitrary and scales).
- Dial/LCD screens (SD+): 200x100 tiles; `setImage` with `target`/
  `coordinates` selects tile; full LCD via `setTouchBarImage`-era ops
  (verify against device traffic in a later RE pass).

## BigDeck implementation plan

1. `src/main/plugins/sd/SDPluginHost.ts` — WS server, plugin registry,
   spawn/kill with process supervision (respawn on crash w/ backoff),
   manifest parser + validation.
2. `SDPluginProcess.ts` — per-plugin child process, argv per spec above,
   stdout/stderr capture into BigDeck log, exit/restart policy.
3. Event router — map BigDeck device events (key:down etc.) → SDK events
   for the right `context` (instance map: device+key → context UUID).
   Contexts minted as UUIDv4 per placed action instance.
4. Image path — reuse KeyRenderer: base64 → sharp normalize → RGB write
   through DeviceManager control lane (single writer — no temp-file hop
   needed in-process; keep official semantics otherwise).
5. PI host — `BrowserWindow` per visible PI, WS client attach, inject
   compatibility CSS/JS.
6. Marketplace/install UI — "Import .streamDeckPlugin" (unzip to
   `~/.config/bigdeck/sdplugins/<uuid>.sdPlugin`), enable/disable per
   plugin, "unverified platform" badge.
7. Settings storage — JSON per context under
   `~/.config/bigdeck/sdplugins/state/<context>.json`; globalSettings per
   plugin UUID.

## Explicit non-goals (v1)
- Marketplace account linking / `didReceiveSecrets` (stub only).
- Windows/mac-only native plugins (no Linux binary) — detect & badge.
- Multi-action private UI (KeyStack/DialStack internal classes).
