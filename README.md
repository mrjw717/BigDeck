# BigDeck

> A Linux Stream Deck controller — drag-and-drop keys, live device sync,
> app-focus profile switching, Elgato `.sdPlugin` compatibility, and
> system-level audio/keyboard control. Built for KDE and every other
> Linux desktop.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux-green.svg)
![Electron](https://img.shields.io/badge/electron-28.x-blue.svg)

---

## Table of Contents

1. [Features](#features)
2. [Supported Hardware](#supported-hardware)
3. [Requirements](#requirements)
4. [Installation](#installation)
5. [Development](#development)
6. [Usage](#usage)
7. [Profiles & App-Focus Switching](#profiles--app-focus-switching)
8. [Elgato Profile Import](#elgato-profile-import)
9. [Plugins](#plugins)
10. [Actions](#actions)
11. [Docs](#docs)
12. [Known Limitations](#known-limitations)
13. [Troubleshooting](#troubleshooting)
14. [Project Structure](#project-structure)
15. [License](#license)

---

## Features

**Deck**
- Live hardware sync — every edit renders to the deck instantly
- Drag-and-drop actions with **grid-snapping drop targets** (release
  anywhere on the deck; the nearest key wins)
- Multi-page profiles, drag reorder, per-key layer editor
  (background/image/icon/text layers, opacity, fit, gradients,
  chroma-key knockout), pressed states, animated GIFs
- Custom frameless titlebar (minimize / maximize / close built into the UI)
- Light / dark / system theme

**Profiles**
- App-focus auto-switching: bind an installed app (picked from your
  `.desktop` files — no paths) or a CLI command to a profile; focusing that
  app activates it, unbound apps fall back to your **default profile**
- Elgato **`.streamDeckProfile` import** with a full conversion report
- Profiles are the shareable unit — JSON in/out

**Actions** (17 drag-ready templates, all wired end-to-end)
- Keyboard shortcuts (uinput-native — works on KDE/GNOME Wayland)
- Launch app · Open URL · Open folder
- Media control · **Mute Mic / Mute Speakers** (system-level via pactl)
- **Soundboard** (paplay/pw-play/ffplay) · Run script (**file mode** —
  bash/python/node) · Macro (key/text/delay steps)
- Sleep · Close app · Key brightness · Switch profile/page
- SD-plugin passthroughs for installed Elgato plugins

**System integration**
- **Native keyboard injection** via kernel uinput — no ydotool, no wtype,
  no daemons, no group membership; one sudo udev install covers deck + keys
- udev rules for the deck, keyboard injection, and global-shortcut devices
- systemd unit for background operation, `.deb` packaging

**Elgato compatibility**
- `.sdPlugin` **plugin host** — official WebSocket protocol (spawn argv,
  registration handshake, per-context settings), install from
  `.streamDeckPlugin`, locale-aware action names
- **`.sdIconPack` import** — 1,900+ Elgato SVG icons
- **`.sdLayoutEx` groundwork** — full schema parser + PNG renderer for
  SD+/Neo InfoBar layouts (device wiring next phase)

---

## Supported Hardware

| Model | Status |
| --- | --- |
| Stream Deck XL (incl. 2022 `006c`) | Fully supported (primary test device) |
| Original / MK.2 | Supported |
| Mini / Mini MK.2 | Supported |
| Stream Deck + | Keys supported; dials/LCD via layouts groundwork |
| Pedal | Supported actions/triggers |

## Requirements

- Linux (Ubuntu 22.04+ / Debian 12+ / Fedora / Arch)
- Node.js 18+ (development only)
- `libusb-1.0-0`, `libudev1` (auto-installed via `.deb`)
- A Vulkan ICD for Electron GPU acceleration
  (`sudo apt install mesa-vulkan-drappers` equivalent — see Troubleshooting)
- **udev rules** (one sudo command — installs deck access *and* keyboard
  injection): `npm run udev:install`

## Installation

### Option 1: Development build

```bash
git clone https://github.com/mrjw717/BigDeck.git
cd BigDeck
npm install
npm run udev:install        # one sudo: deck USB + keyboard injection rules
npm run dev                 # starts TS/preload/renderer watchers
npm run start:dev           # launches the app (separate terminal)
```

`npm run start:dev` sets `ELECTRON_OZONE_PLATFORM_HINT=auto` (native
Wayland, X11 fallback) — correct sizing on scaled screens.

### Option 2: Package

```bash
npm run build
npm run package:deb         # release/bigdeck_<version>_amd64.deb
```

## Development

Two processes make up dev mode:

| Command | What it does |
| --- | --- |
| `npm run dev` | Watchers: main TS, preload, renderer (vite) |
| `npm run start:dev` | Launches the Electron app against the watched build |

DevTools are opt-in: `BIGDECK_DEVTOOLS=1 npm run start:dev`.

Gates: `npm run typecheck` · `npm test` · `npm run build:main` ·
`npm run build:renderer` — all must pass before pushing.

## Usage

1. Connect your Stream Deck — it appears under Devices (hot-plug safe)
2. Activate a profile or edit the default — hardware syncs live
3. Drag actions from the library onto keys (drop anywhere on the deck;
   the nearest key snaps)
4. **Key Editor** → Action (assign) and Appearance (layers, label, fit)
5. Settings → Keyboard diagnostics verify the injection chain

Config lives at `~/.config/bigdeck/`.

## Profiles & App-Focus Switching

- **Default profile**: star it in the Profiles view. Unbound apps fall
  back to it.
- **Auto-switch rules**: Settings → App Focus Switching → pick an
  installed app (or type a CLI command) → bind a profile. Focusing that
  app activates the profile; the KWin journal follower does the tracking
  on KDE Wayland (no extra software), xdotool on X11.
- **Import**: Profiles view → Import Elgato Profile (`.streamDeckProfile`).
  Titles become labels, hotkeys convert from macOS keycodes, images come
  along, and every skip is reported honestly.

## Plugins

BigDeck hosts **official Elgato `.sdPlugin` plugins** (WebSocket protocol,
spawn + registration, per-context settings, locale-aware names):

- Plugins view → Elgato SD Plugins: install from `.streamDeckPlugin`,
  enable/disable, localized action names, Linux-compatibility badge
- BigDeck Examples plugin ships installed (working Node sample)

Known limit: official Elgato plugins ship mac/win binaries — actions
import and display, and execute only when the plugin has a Linux-capable
codepath. The legacy built-in stub plugin system was removed in favor of
this host.

## Actions

See the **Actions** section above for the catalog, and
[`docs/PLUGIN-ACTIONS-MATRIX.md`](docs/PLUGIN-ACTIONS-MATRIX.md) for the
Elgato-parity matrix (34 built-in actions audited).

## Docs

| Doc | Contents |
| --- | --- |
| [`docs/AUDIT-2026-10-25.md`](docs/AUDIT-2026-10-25.md) | Architecture audit, Elgato RE findings, device-layer bug autopsy |
| [`docs/SDPLUGIN-COMPAT.md`](docs/SDPLUGIN-COMPAT.md) | The full Elgato plugin-hosting contract |
| [`docs/PLUGIN-ACTIONS-MATRIX.md`](docs/PLUGIN-ACTIONS-MATRIX.md) | 34 Elgato built-ins audited vs BigDeck |
| [`docs/WIRING-AUDIT-2026-10-25.md`](docs/WIRING-AUDIT-2026-10-25.md) | IPC/store/event wiring audit |
| [`docs/ICON-PACKS.md`](docs/ICON-PACKS.md) | Icon pack formats |
| [`docs/iCUE-INTEGRATION.md`](docs/iCUE-INTEGRATION.md) | Corsair iCUE/OpenRGB design |
| [`docs/adr/`](docs/adr/) | ADR-0001 Flow Creator · ADR-0002 Screensaver profiles · ADR-0003 Shader engine |
| [`docs/DEVLOG-2026-10-27.md`](docs/DEVLOG-2026-10-27.md) | Session dev log — RE findings, hardware-test fixes |

## Known Limitations

- **Official Elgato plugin actions** (Discord mute, camera, …) need the
  plugin's mac/win binary — keys import with art but execute only with a
  Linux-capable codepath. System-level equivalents (mic/speaker mute) are
  built in and recommended.
- **Wayland injection scope**: uinput keystrokes follow OS focus; apps
  using X11 global grabs see them when an XWayland window is focused.
  System mutes (pactl) are unaffected.
- **Stream Deck + dials/LCD**: layout schema + renderer groundwork done;
  device writes land with the dial phase.
- **Electron 28**: correct Wayland sizing today; fully crisp fractional
  scaling wants an Electron ≥30 bump.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Deck shows "No Device" | `npm run udev:install` (sudo), then replug the deck |
| Keyboard shortcut keys do nothing | Settings → Keyboard Shortcuts → run the diagnostics; on KDE Wayland the built-in uinput path needs the udev rules installed |
| Window wrong size on scaled Wayland | Fixed via native Wayland; report if it regresses |
| Black squares on keys | The active page has no image for those keys — assign something |
| Logs | `~/.config/bigdeck/bigdeck/logs/bigdeck.log` (+ `error.log`) |
| App closes immediately (`vkCreateInstance`) | Install a Vulkan ICD, or launch with `LIBGL_ALWAYS_SOFTWARE=1 … --disable-gpu` |

## Project Structure

```
BigDeck/
├── src/
│   ├── main/
│   │   ├── device/        # DeviceManager (dual-lane write pump, uinput)
│   │   ├── actions/       # ActionEngine, ActionExecutor, KeyRenderer,
│   │   │                  # HardwareSync, ActionTickService
│   │   ├── profiles/      # ProfileManager + Elgato profile importer
│   │   ├── plugins/sd/    # Elgato .sdPlugin host (WS, spawn, contexts)
│   │   ├── layouts/       # .sdLayoutEx schema + renderer (SD+ groundwork)
│   │   ├── apps/          # Installed-app scanner (desktop files)
│   │   ├── focus/         # FocusWatcher (KWin journal / xdotool)
│   │   ├── network/       # REST + WebSocket control
│   │   └── utils/
│   ├── preload/           # Secure IPC bridge
│   ├── renderer/          # React + Tailwind UI
│   └── shared/            # Types, constants, IPC definitions
├── docs/                  # Audits, compat specs, ADRs, dev logs
├── resources/             # Example SD plugin, icon packs (seeded)
├── test-assets/           # Scripts/images/sounds for hand-testing
├── udev/                  # Deck USB + uinput keyboard-injection rules
├── systemd/               # Background service
└── scripts/               # Rebuild + packaging helpers
```

## License

MIT © BigDeck Team. See [LICENSE](LICENSE).
