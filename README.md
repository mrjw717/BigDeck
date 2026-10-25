# BigDeck

> A fully customizable Linux Stream Deck controller with drag-and-drop editing, live device sync, and plugin support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux-green.svg)
![Electron](https://img.shields.io/badge/electron-28.x-blue.svg)

---

## Table of Contents

1. [Features](#features)
2. [Supported Hardware](#supported-hardware)
3. [Requirements](#requirements)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Customization Highlights](#customization-highlights)
7. [Network + Plugins](#network--plugins)
8. [Scripts & Automation](#scripts--automation)
9. [Troubleshooting](#troubleshooting)
10. [Project Structure](#project-structure)
11. [Contributing](#contributing)
12. [License](#license)

---

## Features

- **Live Deck Sync** – Active profile/page is rendered to hardware instantly (screensaver suppression included).
- **Drag & Drop Editor** – Drop actions onto keys, reorder pages, and rename/duplicate directly from the UI.
- **Multi-Page Profiles** – Unlimited pages per profile with per-page labels and ordering.
- **Appearance Designer** – Upload custom images/GIFs, set gradients, text overlays, and labels per key.
- **Action Catalog** – Keyboard shortcuts, app launchers, media controls, URLs, scripts, macros, plus plugin actions.
- **Profile Intelligence** – Auto-switch rules, per-device profiles, import/export, and JSON backups.
- **Network Control** – REST + WebSocket server for remote automation (optional).
- **System Integration** – udev rules (no root), systemd unit, `.deb` packaging, and rebuild script for rapid iteration.

---

## Supported Hardware

All official Elgato Stream Deck models:

| Model | Keys | Notes |
| --- | --- | --- |
| Original / MK.2 | 15 | Fully supported |
| Mini / Mini MK.2 | 6 | Fully supported |
| XL / XL V2 | 32 | Fully supported |
| Stream Deck + | 8 keys + dials | Keys supported (dials in progress) |
| Pedal | 3 | Supported actions/triggers |

---

## Requirements

- **Linux** (Ubuntu 22.04+, Debian 12+, Fedora 39+, Arch latest)
- **Node.js 18+** (development only)
- **System packages**:
  - `libusb-1.0-0`, `libudev1` (auto-installed via `.deb`)
  - **Vulkan ICD** for GPU acceleration. At least one `*.json` driver definition must exist in `/usr/share/vulkan/icd.d/`.
    - Detect available drivers: `ubuntu-drivers list`
    - Install recommended NVIDIA driver: `sudo ubuntu-drivers install nvidia-driver-<version>`
    - AMD/Intel (Mesa): `sudo apt install mesa-vulkan-drivers mesa-vulkan-drivers:i386`
    - Software fallback: `sudo apt install mesa-vulkan-drivers` then launch with `LIBGL_ALWAYS_SOFTWARE=1 VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/lvp_icd.json bigdeck --disable-gpu --disable-software-rasterizer`
- **udev permissions**: installed automatically; replug the deck after install.

---

## Installation

### Option 1: Official `.deb`

```bash
wget https://github.com/bigdeck/bigdeck/releases/latest/download/bigdeck_<version>_amd64.deb
sudo dpkg -i bigdeck_<version>_amd64.deb
sudo apt-get install -f   # resolve missing system deps if prompted
```

Launch via your desktop menu or `bigdeck` from a terminal.

### Option 2: Development Build

```bash
git clone https://github.com/bigdeck/bigdeck.git
cd bigdeck
npm install
npm run dev          # runs Electron + Vite in watch mode
```

### Option 3: Manual Packaging

```bash
npm run build        # build main, preload, renderer
npm run package:deb  # produces release/bigdeck_<version>_amd64.deb
```

---

## Usage

1. **Connect your Stream Deck** – confirm the device shows up under Devices in the sidebar.
2. **Activate or create a profile** – the header shows the active profile & page.
3. **Drag actions** from the side palette onto keys, or click a key to open the Key Editor.
4. **Customize appearance** – upload images/GIFs, set colors, add labels.
5. **Manage pages** – add/rename/duplicate/reorder, and switch using the header tabs.
6. **Sync to hardware** – the deck reflects every change instantly.
7. **Save/Export** – export JSON backups or import shared profiles from the Profile Manager.

Configuration files live at `~/.config/bigdeck/`:

```
~/.config/bigdeck/
├── bigdeck/
│   ├── logs/          # bigdeck.log, error.log
│   ├── plugins/       # user-provided plugins
│   └── profiles.json  # persisted profiles
├── profiles.json      # legacy export
└── settings.json
```

---

## Customization Highlights

- **Drag + Drop** – Drop any action tile onto a key, or reorder keys by dragging between slots.
- **Image Uploads** – Use custom PNG/GIF/WebP files. Assets are imported into `~/.config/bigdeck/images`.
- **Text/Icon overlays** – Choose typography, alignment, colors, and background gradients.
- **Macros** – Record sequences (keystrokes + delays) and assign them to keys.
- **Plugins** – Extend the action catalog. Drop a plugin folder into `~/.config/bigdeck/plugins/<your-plugin>` and restart.
- **Pages** – Add unlimited pages per profile, duplicate complex layouts, and treat each page as a “scene.”

---

## Network + Plugins

Enable **Network Control** in **Settings → Network**.

### REST Examples

```bash
# List profiles
curl http://localhost:8080/api/profiles

# Activate profile
curl -X POST http://localhost:8080/api/profiles/activate \
  -H "Content-Type: application/json" \
  -d '{"profileId":"<id>"}'
```

### WebSocket Snippet

```js
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', events: ['key-down'] }));
```

### Plugin Skeleton

```js
// ~/.config/bigdeck/plugins/my-plugin/index.js
module.exports = {
  id: 'my-plugin',
  name: 'My Plugin',
  actions: [
    {
      id: 'my-action',
      name: 'Say hello',
      execute: async (params, api) => {
        await api.notifications.show('Hello from plugin!');
      },
    },
  ],
};
```

---

## Scripts & Automation

| Script | Description |
| --- | --- |
| `scripts/rebuild.sh` | Bump patch version, run all builds, create `.deb`, uninstall previous build, install new build. Run this after every code change you want to test locally. |
| `npm run build:*` | Individual build targets (main, preload, renderer). |
| `npm run udev:install` | Install udev rules manually if needed. |
| `systemd/` | Contains `bigdeck.service` for optional background mode. |

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| **Deck shows “No Device”** | Ensure `udev/70-streamdeck.rules` is installed (`npm run udev:install`), replug the deck, and confirm user is in the plugdev group (if applicable). |
| **App closes immediately with `vkCreateInstance` error** | Install a Vulkan ICD (see [Requirements](#requirements)). If you cannot install a GPU driver, launch with `LIBGL_ALWAYS_SOFTWARE=1 VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/lvp_icd.json bigdeck --disable-gpu --disable-software-rasterizer`. |
| **Black squares on hardware keys** | Verify the profile contains images/actions for the active page. Blank keys are expected to render as black to avoid the Stream Deck screensaver. |
| **Logs** | Check `~/.config/bigdeck/bigdeck/logs/bigdeck.log` and `error.log`. Share these when filing issues. |
| **Uninstall** | `sudo apt remove bigdeck` plus `rm -rf ~/.config/bigdeck` if you want a clean slate. |

---

## Project Structure

```
BigDeck/
├── src/
│   ├── main/         # Electron main process (device, actions, profiles, plugins, network)
│   ├── preload/      # Secure IPC bridge
│   ├── renderer/     # React + Tailwind UI (StreamdeckView, KeyEditor, ProfileManager, etc.)
│   └── shared/       # Types, constants, IPC definitions
├── assets/           # Icons + branding (SVG + PNG)
├── scripts/          # Rebuild + tooling scripts
├── systemd/          # Background service files
├── udev/             # Stream Deck udev rules
└── release/          # Build artifacts (.deb, AppImage)
```

For a deeper dive into architecture, state management, and build workflows see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

---

## Contributing

1. Fork the repo and create a feature branch.
2. Run `npm run lint && npm test` before pushing.
3. Use `scripts/rebuild.sh` to verify the packaged build installs cleanly.
4. Open a PR with screenshots/logs for major UI or device changes.

Please read our forthcoming CONTRIBUTING guide for coding standards and review policies.

---

## License

MIT © BigDeck Team. See [LICENSE](LICENSE) for full text.

---

Made with ❤️ for the Linux automation community.
