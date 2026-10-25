// ============================================================================
// Fake Stream Deck plugin (integration-test fixture).
//
// Spawned by SDPluginProcess through the REAL spawn path with the spec
// argv, connects to the host as a WS client, registers, and then:
//  - echoes every inbound event back as
//      { event: "logMessage", payload: { echo: <event>, body: <message> } }
//    so tests can assert on what the host delivered via the host's
//    "plugin-message" event stream;
//  - on willAppear: performs a per-context settings round-trip
//    (setSettings followed by getSettings);
//  - on keyDown: sends a setImage with a 1x1 PNG data-URL (exercises the
//    sharp/DeviceManager path end to end).
//
// It requires the `ws` package from the BigDeck checkout via NODE_PATH,
// which SDPluginHost.test.ts points at the repo's node_modules (real
// plugins ship their own dependencies — this fixture doesn't bundle any).
// ============================================================================

const WebSocket = require("ws");

/** 1x1 PNG, transparent — resized by the host to the device key size. */
const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function argvValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const port = argvValue("-port");
const pluginUUID = argvValue("-pluginUUID");
const registerEvent = argvValue("-registerEvent");
const infoRaw = argvValue("-info");

const info = JSON.parse(decodeURIComponent(infoRaw || encodeURIComponent("{}")));
const ws = new WebSocket(`ws://127.0.0.1:${port}`);

function send(obj) {
  ws.send(JSON.stringify(obj));
}

function echo(event, body) {
  send({ event: "logMessage", payload: { echo: event, body } });
}

ws.on("open", () => {
  send({ event: registerEvent || "registerPlugin", uuid: pluginUUID });
});

ws.on("error", (err) => {
  console.error("fixture ws error:", err.message);
  process.exit(1);
});

let registered = false;

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  const event = msg.event;

  switch (event) {
    case "didRegisterPlugin": {
      registered = true;
      // Confirm handshake echoes carry the spawn -info we were launched with.
      send({
        event: "logMessage",
        payload: {
          echo: "didRegisterPlugin",
          body: {
            spawn: {
              pluginUUID,
              registerEvent,
              infoApplicationPlatform: info.application && info.application.platform,
            },
          },
        },
      });
      send({ event: "getGlobalSettings", context: "" });
      // getTile probe: the host must answer didReceiveTile (empty stub
      // payload) instead of going silent — plugins await that reply.
      send({ event: "getTile", context: "" });
      // Spec-tolerance probe: an event BigDeck does not implement. The host
      // must log and ignore it (never crash or close).
      send({ event: "someFutureElgatoEvent", payload: { hello: true } });
      break;
    }

    case "willAppear": {
      if (!registered) break;
      // Settings round-trip: write, then read back (host replies
      // didReceiveSettings, which is echoed like any other event).
      send({
        event: "setSettings",
        context: msg.context,
        payload: { echoed: true, from: "fixture" },
      });
      send({ event: "getSettings", context: msg.context });
      echo(event, msg);
      break;
    }

    case "keyDown": {
      send({
        event: "setImage",
        context: msg.context,
        payload: { image: TINY_PNG_DATA_URL, target: 0 },
      });
      echo(event, msg);
      break;
    }

    default:
      echo(event, msg);
      break;
  }
});

// Stay alive until killed by the host.
setInterval(() => {}, 1 << 30);
