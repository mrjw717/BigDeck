# iCUE Integration — REA Findings & BigDeck Design

> Status: reverse-engineering complete for the API surface and wire protocol; **integration deferred** in favor of OpenRGB (see verdict).
> Date: 2026-10-26
> Method: static analysis only (REA MCP tooling on the shipped macOS dylib). No code or dependencies were added to BigDeck.

## 0. TL;DR verdict

The iCUE SDK is **not a network protocol**: the macOS dylib (`libiCUESDK.dylib`) talks **JSON over a Unix domain socket** at `$TMPDIR/iCUESDKv4` (Windows builds use a named pipe), so a Linux BigDeck cannot talk to iCUE on another machine out of the box. The wire format is simple and fully recoverable (4-byte big-endian length prefix + JSON messages with numeric `method` ids), so a **LAN bridge is possible later** — a tiny relay on the iCUE host (`socat`/SSH on macOS, a named-pipe→TCP shim on Windows) would expose it to BigDeck, but it is unofficial, unsupported by Corsair, and requires iCUE running with the SDK enabled. **Recommended path: OpenRGB for native Linux RGB now** (TCP localhost:6742, trivially implementable with Node's built-in `net` module, zero dependencies), with `cue.lighting` designed against a backend interface so an iCUE bridge can be slotted in later.

## 1. Artifact under analysis

| Property | Value |
|---|---|
| Path (original) | `.../Stream Deck.app/Contents/Frameworks/libiCUESDK.dylib` (bundled with Elgato Stream Deck for macOS) |
| Format | Mach-O universal (fat): x86_64 @ 16384, arm64 @ 278528 |
| Analyzed slice | x86_64 slice, 254352 bytes, sha256 `c74eb0925a314adae7e4df312166e1d91bfb2a148d74d734480b4961bbfd9163` |
| Build | `LC_BUILD_VERSION` macOS min target, linked against Cocoa / Foundation / libc++ / libSystem / libobjc |
| Exports | 21 exported C symbols (all `Corsair*`), ~659 procedures total |
| Protocol identity | `iCUESDKv4` (string literal used as `clientVersion` and as the server socket name) |

This is the **Corsair iCUE SDK v4** client library. Elgato's Stream Deck app uses it to drive Corsair RGB (e.g. lighting reactions to deck activity), which is why it ships inside their app bundle.

## 2. Exported C API surface (21 symbols)

Addresses are from the x86_64 slice. Signatures were recovered by decompiling the export thunks; parameter names follow the public iCUE SDK conventions and are **inferred** where the decompiler only shows types.

| Address | Export | Purpose (observed behavior) |
|---|---|---|
| `0x9ff0` | `CorsairConnect` | Open a session to the iCUE service. Creates the global `RequestRouter` singleton, starts `ConnectionHandler`. `NULL` callback → `CE_InvalidOperation`. |
| `0xa090` | `CorsairGetSessionDetails` | Read session state + `serverVersion` / `serverHostVersion` **locally** (no network round-trip). |
| `0xa140` | `CorsairDisconnect` | Tear the session down. |
| `0xa1d0` | `CorsairGetDevices` | Enumerate devices (method 1). Takes `deviceTypeMask`, returns `CorsairDeviceInfo[]` (`luid`, `type`, `model`, `serial`). |
| `0xa450` | `CorsairGetDeviceInfo` | Details for one device (method 2, `deviceId`). |
| `0xa620` | `CorsairGetLedPositions` | LED layout for a device (method 7, `deviceId`, `sizeMax`). |
| `0xa7c0` | `CorsairSubscribeForEvents` | Register the global event callback (sends method 14; server then pushes events). |
| `0xa850` | `CorsairUnsubscribeFromEvents` | Remove the event callback. |
| `0xa8d0` | `CorsairConfigureKeyEvent` | Intercept/observe a key on a device (method 16: `deviceId`, `keyId`, `isIntercepted`). |
| `0xa9e0` | `CorsairGetDevicePropertyInfo` | Property metadata for a device (types below). |
| `0xab90` | `CorsairReadDeviceProperty` | Read a device property (method 4 via shared builder). |
| `0xad00` | `CorsairWriteDeviceProperty` | Write a device property (method 5 via shared builder). |
| `0xae10` | `CorsairFreeProperty` | Free a `CorsairProperty` returned by the SDK. |
| `0xaf10` | `CorsairSetLedColors` | **Set RGB colors now** (method 10: `deviceId`, `ledColors[]`). |
| `0xb050` | `CorsairSetLedColorsBuffer` | Stage colors into the client-side buffer (no send). |
| `0xb110` | `CorsairSetLedColorsFlushBufferAsync` | Flush the buffer asynchronously (animation-friendly batch send). |
| `0xb1a0` | `CorsairGetLedColors` | Read current colors (method 8: `deviceId`, `luids[]`). |
| `0xb4b0` | `CorsairSetLayerPriority` | Set this client's lighting layer priority (method 9: `priority`) — arbitrates against iCUE profiles and other SDK clients. |
| `0xb5a0` | `CorsairGetLedLuidForKeyName` | Map a key name (e.g. `A`, macro key) to its LED LUID string (method 6: `deviceId`, `keyName`). |
| `0xb740` | `CorsairRequestControl` | Take control of a device (method 12: `deviceId`, `accessLevel`). Access level `>= 4` rejected → `CE_InvalidArguments`. |
| `0xb840` | `CorsairReleaseControl` | Release a device (method 13: `deviceId`). |

Supporting C++ internals observed (not exported as C API): `RequestRouter` (singleton, request correlation, device cache), `ConnectionHandler` + `Worker` (send worker thread + `readerThread`), `CallbackExecutor` (dedicated callback dispatch thread), `EventHandler`, `Cache`, `Connection`/`Connection_mac` (transport vtable), `sdk::Json` value model.

## 3. Connection / session model

**Transport (observed in `Connection_mac::Connection_mac`, `0x19680`):**

- `socket(AF_UNIX, SOCK_STREAM, 0)` — a **Unix domain socket**, not TCP.
- Endpoint path: `getenv("TMPDIR")` (fallback `/tmp/`, via `sdk4::helpers::nsTempDirectory`), normalized with a trailing `/`, then the server name constant is appended. The constant is initialized inline in the static initializer as the 9-byte string **`iCUESDKv4`** (`__GLOBAL__sub_I_iCUESDK_cpp` writes `0x764b445345554369` = `"iCUESDKv"` + `0x34` = `"4"`). → **`$TMPDIR/iCUESDKv4`** (typically `~/Library/.../T/iCUESDKv4` inside the iCUE app container; `/tmp/iCUESDKv4` as fallback).
- A `pipe()` pair is kept alongside for wakeup/shutdown; the fd is set non-blocking with `fcntl` and `connect()` is retried on `EINTR`.
- Server absent → session state `CSS_ConnectionRefused`; mid-session drop → `CSS_ConnectionLost`.

**Session lifecycle (`RequestRouter::start`, `0x177a0`):**

```
CorsairConnect(cb, ctx)
  → RequestRouter (singleton, guard-protected) ensures:
      CallbackExecutor  (callback thread)
      ConnectionHandler (workerThread = writer, Worker::readerThread = reader)
  → sends connect request (method 0)
  → sessionStateChanged callback fires with CorsairSessionState:
        CSS_Invalid / CSS_Closed / CSS_Connecting / CSS_Timeout /
        CSS_ConnectionRefused / CSS_ConnectionLost / CSS_Connected
  (start() only proceeds from CSS_Closed; everything else is queued/failed)
```

`CorsairGetSessionDetails` fills a struct with `{state, serverVersion, serverHostVersion}` from the local session object — the server version arrives in the connect reply (`serverVersion`, `serverHostVersion` JSON keys).

## 4. Wire protocol (fully reconstructed)

**Framing (`Connection_mac::write`, `0x19dc0`):** every message is

```
[u32 big-endian payload length][UTF-8 JSON payload]
```

The reader thread (`Worker::readerThread`) blocks on the socket's virtual `read`, then `sdk::Json::parse` → `RequestRouter::onReplyReceived`. No TLS, no auth beyond the handshake payload.

**Message shape:** JSON-RPC-like with numeric method ids and a correlation id.

Request (observed in `fromConnectionRequest`, `fromSetLedColorsRequest`, …):

```json
{
  "code":   <int correlation id; -1 for the connect request>,
  "method": <int, see table>,
  "params": { ... }
}
```

Reply (observed via `sdk4::json::getError` and reply-correlation maps keyed by `(int, unsigned)`):

```json
{ "code": <matching id>, "error": <int 0–7>, "result": { ... }, "method": <int> }
```

**Method table (verified by decompiling every `from*Request` builder):**

| ID | Method | `params` keys | Exposed by |
|---|---|---|---|
| 0 | connect | `pid`, `clientVersion` (`"iCUESDKv4"`) | `CorsairConnect` |
| 1 | getDevices | `deviceTypeMask`, `sizeMax` | `CorsairGetDevices` |
| 2 | getDeviceInfo | `deviceId` | `CorsairGetDeviceInfo` |
| 3 | *unknown* | — | (not exercised by any builder found) |
| 4 | readDeviceProperty | `deviceId`, `propertyId`, `index` | `CorsairReadDeviceProperty` |
| 5 | writeDeviceProperty | `deviceId`, `propertyId`, `index`, `value` | `CorsairWriteDeviceProperty` |
| 6 | getLedIdForKeyName | `deviceId`, `keyName` | `CorsairGetLedLuidForKeyName` |
| 7 | getLedPositions | `deviceId`, `sizeMax` | `CorsairGetLedPositions` |
| 8 | getLedColors | `deviceId`, `luids` | `CorsairGetLedColors` |
| 9 | setLayerPriority | `priority` | `CorsairSetLayerPriority` |
| 10 | **setLedColors** | `deviceId`, `ledColors` | `CorsairSetLedColors` |
| 11 | *unknown* | — | (gap) |
| 12 | requestControl | `deviceId`, `accessLevel` | `CorsairRequestControl` |
| 13 | releaseControl | `deviceId` | `CorsairReleaseControl` |
| 14 | subscribeForEvents | *(none)* | `CorsairSubscribeForEvents` |
| 15 | *unknown* (likely unsubscribe) | — | (gap) |
| 16 | configureKeyEvent | `deviceId`, `keyId`, `isIntercepted` | `CorsairConfigureKeyEvent` |

**LED color payload** (`fromLedColor`, `0xd800`) — each element of `ledColors`:

```json
{ "id": <numeric CorsairLedId>, "value": <uint32 0xAARRGGBB> }
```

`CorsairLedColor` on the wire-packing side is `{u32 id; u8 r; u8 g; u8 b; u8 a}`, serialized as `r<<16 | g<<8 | b | a<<24`. LEDs are addressed by the numeric `CorsairLedId` enum (public CUESDK.h values, e.g. keyboard `CLL.*`); the string-based `ledLuid` (from `getLedLuidForKeyName`) is used for macro-key addressing, not for color entries.

**Error enum** (`__cstring` table order, confirmed numeric by `getError` switch, which maps unknown codes → 3):

| Value | Name |
|---|---|
| 0 | `CE_Success` |
| 1 | `CE_NotConnected` |
| 2 | `CE_NoControl` |
| 3 | `CE_IncompatibleProtocol` |
| 4 | `CE_InvalidArguments` |
| 5 | `CE_InvalidOperation` |
| 6 | `CE_DeviceNotFound` |
| 7 | `CE_NotAllowed` |

**Device types** (`CDT_*`, used in `deviceTypeMask`): `Unknown, Keyboard, Mouse, Mousemat, Headset, HeadsetStand, FanLedController, LedController, MemoryModule, Cooler, Motherboard, GraphicsCard, Touchbar, GameController, All`.

**Property data types** (`CT_*`): `Boolean, Float64, String, Boolean_Array, Int32_Array, Float64_Array, String_Array`.

**Full JSON key vocabulary** recovered from `__cstring`: `accessLevel, channelCount, clientVersion, code, deviceConnectionStatusChangedEvent, deviceId, deviceInfos, deviceTypeMask, devices, error, flags, index, isConnected, isIntercepted, isPressed, keyId, keyName, ledColors, ledLuid, ledPositions, luids, method, model, params, pid, priority, propertyId, result, serial, serverHostVersion, serverVersion, sizeMax, state, value`.

## 5. Device / event binding model

1. **Enumeration**: `getDevices(deviceTypeMask)` returns device infos; each device has a string `luid` used as `deviceId` everywhere.
2. **Control arbitration**: a client must `requestControl(deviceId, accessLevel)` before lighting changes take effect; `CE_NoControl` is returned otherwise. `setLayerPriority` orders concurrent SDK clients against iCUE's own profiles. `releaseControl` yields the device back.
3. **Lighting**: `setLedColors` is synchronous request/response; `SetLedColorsBuffer` + `SetLedColorsFlushBufferAsync` batch updates for animation loops.
4. **Events**: a single global callback (`CorsairSubscribeForEvents`); the server pushes JSON messages on the same socket which `EventHandler` demultiplexes into:
   - `CorsairKeyEvent` — `{ keyId, keyName, isPressed, isIntercepted, flags }`; macro keys tracked per device via `CorsairMacroKeyId` sets; delivery through `CallbackExecutor` on a dedicated thread.
   - `CorsairDeviceConnectionStatusChangedEvent` — `{ deviceConnectionStatusChangedEvent / isConnected }` (device attach/detach).
   - Session state transitions are surfaced via the connect-time callback.
5. **Key interception**: `CorsairConfigureKeyEvent(deviceId, {keyId, isIntercepted: true})` makes iCUE report (and optionally swallow) key presses — this is how plugins implement "light up on key press" semantics.

**Minimal RGB trigger sequence:**

```
CorsairConnect(cb, ctx)                    // wait for CSS_Connected
CorsairGetDevices(CDT_All, buf, n)         // pick device luid
CorsairRequestControl(luid, level)         // required before lighting
CorsairSetLedColors(luid, n, colors)       // {id, 0xAARRGGBB} entries
CorsairReleaseControl(luid)                // optional, polite
CorsairDisconnect()
```

## 6. Linux feasibility assessment

- **The dylib is macOS-only and its transport is host-local.** `AF_UNIX` + `$TMPDIR/iCUESDKv4` cannot be reached from another machine; there is no TCP listener, no discovery, no auth model suitable for LAN use in this binary. iCUE itself ships for Windows and macOS only; there is no Linux iCUE host to connect to in the first place.
- **Direct use on Linux is out.** Even ignoring the transport, the dylib depends on Cocoa/Foundation and would need a bridge process running *on the same machine as iCUE* — which on Linux doesn't exist.
- **A bridge is technically feasible but unofficial.** The protocol reconstructed above is simple enough to reimplement in any language: length-prefixed JSON over a socket. On a macOS iCUE host, `socat TCP-LISTEN:<port>,fork UNIX-CONNECT:"$TMPDIR/iCUESDKv4"` (or an SSH local-forward of the socket) would relay it; on Windows, a tiny named-pipe→TCP shim would do the same. Costs: CORSair can change the protocol in any iCUE update (no stability guarantee, no docs), and unknowns remain (method ids 3/11/15, exact `accessLevel` semantics, reconnect/handshake edge cases). Verdict: fine as an experiment, not as a supported feature.

## 7. Alternative: OpenRGB (recommended Linux path)

[OpenRGB](https://openrgb.org) runs natively on Linux, drives Corsair/SteelSeries/Razer/etc. devices directly (kernel/HID), and exposes an **SDK server** whose protocol is public and stable:

- Transport: plain **TCP, default port `6742`** (localhost by default; LAN is opt-in).
- Packet header: ASCII magic `"ORGB"` + `u32le device_id` + `u32le command_id`, then command payload. Strings are `u32le length + bytes`; color lists are `u32le count` followed by count × `RGB` (3 bytes, with padding to 4 in LED-update payloads).
- Key commands: `0` request controller count · `1` request controller data (returns `location, mode, description, version, serial`, zones with `type/min/max`, LED count and names) · `3` set client name (do this first) · `100` rescan devices · `1000` set custom/direct mode · `1010` update all LEDs (`count` + RGB per LED) · `1020` update zone · `1030` set all LEDs to one color.
- For BigDeck's "flash on key press" use-case the flow is: connect → `SET_CLIENT_NAME`("BigDeck") → `REQUEST_CONTROLLER_DATA` → `RGB_CONTROLLER_SETCUSTOM_MODE` → `UPDATE_LEDS` / `SET_ALL_LEDS`, restoring previous colors after the flash.

Node implementation needs **zero dependencies**: `net.Socket` + a small frame encoder. (BigDeck already depends on `uiohook-napi` and HID access — no new packages required.)

Other no-new-dependency options worth noting:

- **CLI spawning**: `openrgb --client <host> --mode direct ...`, `liquidctl`, or `ckb-next` (Corsair-specific daemon) via `child_process.execFile` — BigDeck already uses this pattern in `ActionExecutor` (e.g. `ydotool`/`wtype` with explicit install hints).
- **Direct HID**: possible for specific devices but means reimplementing per-vendor protocols in JS — poor effort/benefit versus OpenRGB. Not recommended.

## 8. BigDeck integration design

### 8.1 Action node: `cue.lighting`

A new typed action in `src/shared/types.ts` following the existing discriminated-union pattern (`KeyboardShortcutAction`, `KeyBrightnessAction`, …):

```ts
export interface CueLightingAction extends Action {
  kind: "cue.lighting";
  backend: "openrgb" | "icue-bridge";   // icue-bridge = future, off by default
  host: string;                          // default 127.0.0.1
  port: number;                          // openrgb 6742 | icue bridge port
  effect: "flash" | "solid";
  color: string;                         // "#RRGGBB"
  durationMs?: number;                   // flash duration, default 300
  restore?: boolean;                     // snapshot + restore colors (default true)
  deviceId?: number | "all";             // OpenRGB controller index or all
}
```

Execution (a `executeCueLighting` helper in `ActionExecutor`, wired like `onKeyBrightness`):

1. Connect (single reusable client per backend+host+port, auto-reconnect on next use).
2. `SET_CLIENT_NAME("BigDeck")`; on first connect fetch controller data (cached, 30 s TTL) so `deviceId: "all"` and controller names resolve.
3. `SETCUSTOM_MODE` → `UPDATE_LEDS`/`SET_ALL_LEDS` with `color`; for `flash`, schedule restore of the snapshot after `durationMs`.
4. Failures log a truthful one-line reason and return `false` — the codebase's existing graceful-degradation convention (cf. the Linux viability notes in `ActionExecutor.ts`).

iCUE bridge backend (later, optional) implements the same interface by speaking the §4 protocol through a user-supplied relay — same connect/enumerate/`requestControl`/`setLedColors`/`releaseControl` sequence as §5.

### 8.2 Phased plan

| Phase | Scope | Notes |
|---|---|---|
| **1 — OpenRGB local** (recommended now) | `CueLightingAction` with `backend: "openrgb"`, Node `net` client, flash/solid effects, restore | No new npm dependencies. Requires user to run OpenRGB with SDK server enabled; action surfaces a clear hint if port 6742 is closed. |
| **2 — Polish** | Effect presets (ripple/streak across zone), per-key mapping on supported controllers, settings UI + device picker | Reuses cached controller data; no protocol work. |
| **3 — iCUE LAN bridge** (optional, experimental) | `backend: "icue-bridge"`; user runs a relay on their Windows/macOS box; implement §4 framing + method 0/1/2/12/10/13 | Behind a feature flag. Expect breakage on iCUE updates; treat as best-effort. Document unknown method ids 3/11/15 as to-be-discovered against a live host. |
| **4 — Event feed** (stretch) | Mirror iCUE `KeyEvent` / OpenRGB device events into BigDeck's event bus | Only valuable once phase 3 exists; OpenRGB has no push-event equivalent. |

### 8.3 Explicit non-goals

- No bundling of `libiCUESDK.dylib` (Apple-platform only, license restrictions, useless without a local iCUE service).
- No CORSair protocol stability assumptions: anything iCUE-bridge related must be user-enabled, clearly labelled experimental, and never block the OpenRGB path.

## 9. REA evidence index

Tools used (all via the `rea` MCP namespace in Code Mode): `open_binary`, `binary_overview`, `search_strings`, `search_procedures`, `list_names`, `procedure_pseudo_code`, plus `inspect_macho` (attempted; unavailable for Mach-O on Linux → load commands / export trie parsed directly instead).

Key evidence addresses (x86_64 slice):

| Claim | Evidence |
|---|---|
| 21 exports | export symbol names in string table (`_CorsairConnect` … `_CorsairWriteDeviceProperty`) + `search_procedures` addresses `0x9ff0`–`0xb840` |
| AF_UNIX transport | `Connection_mac::Connection_mac` `0x19680`: `socket(1,1,0)`, `sa_family=1`, `pipe`, `fcntl`, `connect(fd, sockaddr_un, 0x6a)` |
| Socket path `$TMPDIR/iCUESDKv4` | `getenv("TMPDIR")`, fallback `"/tmp/"` @ `0x1ed04`; `cServerName` built from immediates in `__GLOBAL__sub_I_iCUESDK_cpp` (`0x764b445345554369`,`0x34`) |
| 4-byte BE length framing | `Connection_mac::write` `0x19dc0` (byte-swap + `vector::insert` at front, then `send`) |
| Message shape / connect | `sdk4::json::fromConnectionRequest` `0xc230`: `code:-1`, `method:0`, `params{pid, clientVersion}` |
| Method table | `fromGetDevicesRequest` `0xc4c0` (1), `fromGetDeviceInfoRequest` `0xc5d0` (2), `fromGetLedIdForKeyNameRequest` `0xd4d0` (6), `fromGetLedPositionsRequest` `0xc6a0` (7), `fromGetLedColorsRequest` `0xd260` (8), `fromSetLayerPriorityRequest` `0xd400` (9), `fromSetLedColorsRequest` `0xcde0` (10), `fromRequestControl` `0xd5f0` (12), `fromReleaseControlRequest` `0xd720` (13), `performSubscribeForEventsRequest` `0x17cf0` (14), `fromConfigureKeyEventRequest` `0xc7c0` (16), `CorsairReadDeviceProperty` `0xab90` (4) |
| Color payload `{"id","value"}` | `sdk4::json::fromLedColor` `0xd800` (`r<<16|g<<8|b|a<<24`) |
| Error mapping 0–7 | `sdk4::json::getError` `0xead0`; names at `0x1ede5`–`0x1ee5f` |
| Session states | `CSS_*` at `0x1ee6d`–`0x1eec8`; `RequestRouter::start` `0x177a0` |
| Event model | `EventHandler`/`CallbackExecutor` symbols; `CorsairKeyEvent` / `deviceConnectionStatusChangedEvent` consts |
| Device types / data types | `CDT_*` `0x1ed0c`–`0x1eddd`; `CT_*` `0x1eed6`–`0x1ef37` |
| JSON key vocabulary | `__cstring` `0x1eba0`–`0x1ecd5` |

**Known unknowns** (documented honestly): method ids 3, 11, 15; exact `CorsairAccessLevel` value names (valid range observed 0–3); runtime behavior of the connect handshake against a live iCUE host (this analysis is static); Windows named-pipe path (the Windows SDK binary was not analyzed — external knowledge); OpenRGB protocol details cited from OpenRGB's public SDK documentation.
