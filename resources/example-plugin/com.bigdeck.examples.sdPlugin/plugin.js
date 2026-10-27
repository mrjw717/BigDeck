// ============================================================================
// BigDeck Examples — BigDeck's bundled Stream Deck SDK v2 plugin
//
// A REAL, installable plugin (resources/example-plugin, seeded into
// <userData>/sdplugins at startup) that doubles as working documentation for
// writing SD plugins against BigDeck's compatibility host:
//
//   manifest.json — SDK v2 manifest: identity, OS[linux] (verified on
//                   BigDeck), CodePath: plugin.js, two actions
//   plugin.js     — this file: connects to the host's WebSocket server using
//                   the spec argv, registers, and serves two actions
//
// Actions:
//   com.bigdeck.examples.log         "Log Timestamp"
//       Appends one line (ISO timestamp + context) to plugin.log NEXT TO
//       this file, then setTitle()s the running press count onto the key.
//   com.bigdeck.examples.openassets  "Open Test Assets"
//       Opens the BigDeck test-assets folder with xdg-open. The folder path
//       arrives through the SDK's global settings (BigDeck pushes it at
//       startup when a test-assets dir exists next to the app); the
//       BIGDECK_TEST_ASSETS env var is the fallback.
//
// Zero dependencies: the WebSocket client below is a minimal RFC 6455
// implementation (text frames, client-side masking, ping/pong) so the plugin
// installs and runs without bundling node_modules.
//
// Test hook: BIGDECK_EXAMPLE_NO_OPEN=1 makes the open-assets action log a
// dry-run line instead of spawning xdg-open (used by ExamplePlugin.test.ts —
// a real spawn would open a file manager on the dev machine).
// ============================================================================

const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ACTION_LOG = "com.bigdeck.examples.log";
const ACTION_OPEN_ASSETS = "com.bigdeck.examples.openassets";

// ---------------------------------------------------------------------------
// Spec spawn argv: plugin.js -port <wsPort> -pluginUUID <uuid>
//                           -registerEvent registerPlugin -info <url-json>
// ---------------------------------------------------------------------------

function argvValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const port = Number(argvValue("-port"));
const pluginUUID = argvValue("-pluginUUID");
const registerEvent = argvValue("-registerEvent") || "registerPlugin";
const infoRaw = argvValue("-info");

// Plugin dir = the installed .sdPlugin folder (this file's directory; the
// host launches us with cwd set here too). The log lives next to plugin.js.
const LOG_FILE = path.join(__dirname, "plugin.log");

function appendLog(line) {
  try {
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} ${line}\n`);
  } catch {
    // A read-only plugin dir must never kill the plugin over a log line.
  }
}

// ---------------------------------------------------------------------------
// Minimal RFC 6455 WebSocket client (text frames only, zero dependencies)
// ---------------------------------------------------------------------------

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

/** Masked client→server frame (0x1 = text, 0xA = pong). */
function encodeMaskedFrame(payload, opcode) {
  const mask = crypto.randomBytes(4);
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x80 | opcode, 0x80 | len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  const masked = Buffer.allocUnsafe(len);
  for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i % 4];
  return Buffer.concat([header, mask, masked]);
}

/**
 * Parse ONE complete frame from the front of `buf` (server→client frames are
 * unmasked). Returns null while the frame is still incomplete.
 */
function readFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    const big = buf.readBigUInt64BE(2);
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("frame too large");
    len = Number(big);
    offset = 10;
  }
  const maskLen = masked ? 4 : 0;
  if (buf.length < offset + maskLen + len) return null;
  let payload = buf.subarray(offset + maskLen, offset + maskLen + len);
  if (masked) {
    const mask = buf.subarray(offset, offset + 4);
    const unmasked = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) unmasked[i] = payload[i] ^ mask[i % 4];
    payload = unmasked;
  }
  return { opcode, payload, rest: buf.subarray(offset + maskLen + len) };
}

/**
 * Connect to ws://127.0.0.1:<port>/ and hand the caller a tiny session
 * { send(obj), close() } once the upgrade handshake completed.
 */
function connectWebSocket(port, handlers) {
  const key = crypto.randomBytes(16).toString("base64");
  const req = http.request({
    host: "127.0.0.1",
    port,
    path: "/",
    headers: {
      Connection: "Upgrade",
      Upgrade: "websocket",
      "Sec-WebSocket-Key": key,
      "Sec-WebSocket-Version": "13",
    },
  });

  req.on("upgrade", (res, socket, head) => {
    const expected = crypto
      .createHash("sha1")
      .update(key + WS_GUID)
      .digest("base64");
    if (res.headers["sec-websocket-accept"] !== expected) {
      handlers.onError(new Error("websocket handshake: bad Sec-WebSocket-Accept"));
      socket.destroy();
      return;
    }

    let buffer = Buffer.from(head);
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      try {
        let frame;
        while ((frame = readFrame(buffer)) !== null) {
          buffer = Buffer.from(frame.rest);
          if (frame.opcode === 0x1) {
            handlers.onMessage(JSON.parse(frame.payload.toString("utf8")));
          } else if (frame.opcode === 0x9) {
            // ping → pong (0xA), same payload, masked like every client frame.
            socket.write(encodeMaskedFrame(frame.payload, 0xa));
          } else if (frame.opcode === 0x8) {
            socket.destroy();
            return;
          }
          // pongs (0xA) and others: nothing to do.
        }
      } catch (err) {
        handlers.onError(err);
        socket.destroy();
      }
    });
    socket.on("close", () => handlers.onClose());
    socket.on("error", handlers.onError);

    handlers.onOpen({
      send: (obj) =>
        socket.write(encodeMaskedFrame(Buffer.from(JSON.stringify(obj), "utf8"), 0x1)),
      close: () => socket.destroy(),
    });
  });

  // The server answered with a plain HTTP response — no websocket for us.
  req.on("response", (res) => {
    handlers.onError(new Error(`websocket handshake refused (${res.statusCode})`));
  });
  req.on("error", handlers.onError);
  req.end();
}

// ---------------------------------------------------------------------------
// Plugin logic
// ---------------------------------------------------------------------------

let session = null;
let globalSettings = {};
const pressCounts = { [ACTION_LOG]: 0, [ACTION_OPEN_ASSETS]: 0 };

function send(obj) {
  if (session) session.send(obj);
}

/** testAssetsDir: global settings first (set by BigDeck), env fallback. */
function resolveTestAssetsDir() {
  const fromSettings =
    typeof globalSettings.testAssetsDir === "string" && globalSettings.testAssetsDir.length > 0
      ? globalSettings.testAssetsDir
      : null;
  const fromEnv =
    typeof process.env.BIGDECK_TEST_ASSETS === "string" &&
    process.env.BIGDECK_TEST_ASSETS.length > 0
      ? process.env.BIGDECK_TEST_ASSETS
      : null;
  return fromSettings || fromEnv;
}

function openInFileManager(dir) {
  if (process.env.BIGDECK_EXAMPLE_NO_OPEN === "1") {
    appendLog(`openassets: BIGDECK_EXAMPLE_NO_OPEN=1 — dry run, would open "${dir}"`);
    return;
  }
  const child = spawn("xdg-open", [dir], { detached: true, stdio: "ignore" });
  child.unref();
  appendLog(`openassets: opened "${dir}"`);
}

function handleKeyDown(msg) {
  switch (msg.action) {
    case ACTION_LOG: {
      pressCounts[ACTION_LOG] += 1;
      appendLog(`log: timestamp=${new Date().toISOString()} context=${msg.context}`);
      send({ event: "setTitle", context: msg.context, payload: { title: String(pressCounts[ACTION_LOG]) } });
      send({ event: "showOk", context: msg.context });
      break;
    }

    case ACTION_OPEN_ASSETS: {
      pressCounts[ACTION_OPEN_ASSETS] += 1;
      const dir = resolveTestAssetsDir();
      if (!dir) {
        appendLog("openassets: no test-assets dir configured (no global settings, no BIGDECK_TEST_ASSETS)");
        send({ event: "showAlert", context: msg.context });
        break;
      }
      if (!fs.existsSync(dir)) {
        appendLog(`openassets: configured dir does not exist: "${dir}"`);
        send({ event: "showAlert", context: msg.context });
        break;
      }
      openInFileManager(dir);
      send({ event: "showOk", context: msg.context });
      break;
    }

    default:
      appendLog(`keyDown: unknown action "${msg.action}"`);
      break;
  }
}

appendLog(
  `plugin starting: pid=${process.pid} uuid=${pluginUUID || "?"} port=${port || "?"} node=${process.version}`,
);

if (!port || !pluginUUID) {
  appendLog("plugin aborting: missing -port/-pluginUUID argv");
  process.exit(1);
}

connectWebSocket(port, {
  onOpen: (ws) => {
    session = ws;
    send({ event: registerEvent, uuid: pluginUUID });
  },

  onMessage: (msg) => {
    switch (msg.event) {
      case "didRegisterPlugin":
        appendLog("registered with BigDeck");
        // Ask for our global settings (testAssetsDir) — the host also pushes
        // them on registration; this round-trip is the SDK-canonical flow.
        send({ event: "getGlobalSettings", context: "" });
        break;

      case "didReceiveGlobalSettings":
        globalSettings = msg.payload && typeof msg.payload === "object" ? msg.payload : {};
        appendLog(`global settings: testAssetsDir=${globalSettings.testAssetsDir ?? "<unset>"}`);
        break;

      case "willAppear":
        appendLog(`willAppear: action=${msg.action} context=${msg.context}`);
        break;

      case "willDisappear":
        appendLog(`willDisappear: action=${msg.action} context=${msg.context}`);
        break;

      case "keyDown":
        handleKeyDown(msg);
        break;

      default:
        // didReceiveSettings, keyUp, ... — nothing to do for this plugin.
        break;
    }
  },

  onClose: () => {
    // The host closed the socket (disable/stop/quit) — exit cleanly so the
    // host's process table sees a stop, not a crash.
    appendLog("connection closed, exiting");
    process.exit(0);
  },

  onError: (err) => {
    appendLog(`connection error: ${err && err.message ? err.message : err}`);
    process.exit(1);
  },
});

// Stay alive until the host closes the connection.
setInterval(() => {}, 1 << 30);
