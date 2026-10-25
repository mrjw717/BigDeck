# BigDeck - Linux Streamdeck Controller

## Architecture Overview

BigDeck is an Electron-based application for controlling Elgato Streamdeck devices on Linux. It features a beautiful modern UI, robust device handling, and extensive customization options.

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Electron 28+ | Cross-platform desktop app with native capabilities |
| **Frontend** | React 18 + TypeScript | Modern UI with type safety |
| **Styling** | Tailwind CSS + shadcn/ui | Beautiful, themeable components |
| **State** | Zustand | Lightweight, performant state management |
| **Device I/O** | node-hid + elgato-stream-deck | Direct USB/HID communication |
| **IPC** | Electron IPC | Secure main/renderer communication |
| **Build** | electron-builder | .deb packaging for Linux |
| **Daemon** | systemd service | Background operation without GUI |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BigDeck App                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Renderer Process                      │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │    │
│  │  │  React UI   │ │   Zustand   │ │  Theme System   │   │    │
│  │  │  (shadcn)   │ │   Store     │ │  (dark/light)   │   │    │
│  │  └──────┬──────┘ └──────┬──────┘ └────────┬────────┘   │    │
│  │         │               │                  │            │    │
│  │         └───────────────┴──────────────────┘            │    │
│  │                         │                               │    │
│  │                    IPC Bridge                           │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────┴───────────────────────────────┐    │
│  │                     Main Process                         │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │    │
│  │  │   Device     │ │   Action     │ │   Profile    │    │    │
│  │  │   Manager    │ │   Engine     │ │   Manager    │    │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘    │    │
│  │         │                │                 │            │    │
│  │  ┌──────┴────────────────┴─────────────────┴───────┐   │    │
│  │  │              Plugin System                       │   │    │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │    │
│  │  │  │Keyboard │ │  App    │ │ Script  │  ...      │   │    │
│  │  │  │Shortcuts│ │Launcher │ │ Runner  │           │   │    │
│  │  │  └─────────┘ └─────────┘ └─────────┘           │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                         │                               │    │
│  │  ┌──────────────────────┴──────────────────────────┐   │    │
│  │  │           Network Control (Optional)             │   │    │
│  │  │  ┌─────────┐ ┌─────────┐ ┌───────────────┐     │   │    │
│  │  │  │  HTTP   │ │WebSocket│ │  REST API     │     │   │    │
│  │  │  └─────────┘ └─────────┘ └───────────────┘     │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                      USB/HID Layer                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │  Streamdeck     │ │  Streamdeck XL  │ │  Streamdeck     │    │
│  │  (15 keys)      │ │  (32 keys)      │ │  Mini (6 keys)  │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Module Breakdown

### 1. Device Manager (`src/main/device/`)
- **DeviceDetector**: USB enumeration and hot-plug detection
- **DeviceConnection**: HID communication wrapper
- **DeviceRegistry**: Track multiple connected devices

### 2. Action Engine (`src/main/actions/`)
- **ActionRunner**: Execute configured actions
- **KeyboardAction**: Send key combinations via xdotool/ydotool
- **AppLauncherAction**: Launch applications
- **MultimediaAction**: Control media playback
- **ScriptAction**: Run shell/Python scripts
- **MacroAction**: Record and playback sequences

### 3. Profile Manager (`src/main/profiles/`)
- **ProfileStore**: Load/save profile configurations
- **ProfileSwitcher**: Auto-switch based on active window
- **ProfileExporter**: Import/export profiles

### 4. Image Renderer (`src/main/renderer/`)
- **ImageProcessor**: Resize and convert images for keys
- **GifAnimator**: Handle animated GIF playback
- **IconGenerator**: Generate text/icon overlays

### 5. Plugin System (`src/main/plugins/`)
- **PluginLoader**: Load external plugins
- **PluginAPI**: Expose safe APIs to plugins
- **BuiltinPlugins**: Default action types

### 6. Network Control (`src/main/network/`)
- **HTTPServer**: REST API for remote control
- **WebSocketServer**: Real-time updates
- **AuthManager**: Token-based authentication

## Data Flow

1. **Device Event** → Device Manager → IPC → Renderer (UI update)
2. **Key Press** → Device Manager → Action Engine → Execute Action
3. **UI Config Change** → IPC → Profile Manager → Device Manager (update key)
4. **Profile Switch** → Profile Manager → Action Engine → Device Manager

## File Structure

```
BigDeck/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Main entry point
│   │   ├── device/              # Device management
│   │   ├── actions/             # Action execution
│   │   ├── profiles/            # Profile management
│   │   ├── plugins/             # Plugin system
│   │   ├── network/             # Network control
│   │   └── utils/               # Utilities
│   ├── renderer/                # React frontend
│   │   ├── App.tsx              # Main React app
│   │   ├── components/          # UI components
│   │   ├── stores/              # Zustand stores
│   │   ├── hooks/               # Custom hooks
│   │   └── styles/              # Tailwind config
│   ├── shared/                  # Shared types/constants
│   └── preload/                 # Electron preload scripts
├── plugins/                     # Built-in plugins
├── assets/                      # Icons, images
├── scripts/                     # Build scripts
├── debian/                      # Debian packaging
└── systemd/                     # Systemd service files
```

## Hardware Specifics & Protocols

### 1. Device Differences
- **Original V1 / Mini**: 
  - Requirement: **RAW (BGR/RGB)** image buffers.
  - Quirk: Sending PNG/JPEG headers results in "static columns" visual artifacts.
  - Resolution: 72x72px.
- **XL / MK.2**:
  - Requirement: **JPEG** image buffers.
  - Quirk: Susceptible to **USB Flooding** if 32 keys are updated simultaneously without delay.
  - Resolution: 96x96px (XL), 72x72px (MK.2).

### 2. Stability Mechanisms
- **Single-writer pipeline**: The renderer never pushes images to hardware. It saves key config; the main process diffs per-key config hashes and re-renders ONLY changed keys, each with a trailing `120ms` debounce (slider drags coalesce per key). Latest-write-wins via per-key generation counters.
- **Write lanes**: Per device, a single pump serializes USB writes across two lanes:
  - *Control lane* (config images, pressed states, clears, brightness): FIFO, never dropped, always drained first — edits and presses preempt animation frames.
  - *Animation lane*: latest-frame-wins per key; superseded frames are dropped before reaching USB, so slow devices can't back up.
- **Animation playback**: One global `50ms` timer advances all animated keys with time-based catch-up (late frames are skipped, never burst — animations keep real-time sync). Re-applying identical frames (content hash) is a no-op, so key presses and profile re-applies never restart running animations.
- **Frame budget**: Animated GIF/WebP are decoded in ONE pass (`sharp(..., { animated: true })`, ~14x faster than per-page extraction), then sampled to max `60` frames with sub-`50ms` delays coalesced — total loop duration is preserved. Rendered layer frames are cached by file mtime.
- **USB Anti-Flood**: Writes are fully serialized per device (one in flight at a time), which prevents the XL driver crash that concurrent writes caused.
- **Auto-Profile Switching**: On connection, if the active profile does not match the device type (e.g. Original Profile on XL Device), the system automatically attempts to switch to or create a matching profile to ensure correct key mapping.
- **Persistence**: Profile writes are debounced (`500ms` trailing) and flushed on quit — typing/slider drags no longer rewrite the full profiles file per keystroke.
- **Debouncing**: 
  - Hardware: `80ms` debounce on physical key presses to filter switch noise.
  - Global Action: `1000ms` debounce to prevent accidental rapid-fire execution.

## Security Considerations

1. **No Root Required**: Use udev rules for USB access
2. **IPC Validation**: Sanitize all IPC messages
3. **Plugin Sandbox**: Limit plugin capabilities
4. **Network Auth**: Token-based API authentication

## Development Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Basic Electron app structure
- [ ] Device detection and connection
- [ ] Simple key configuration UI
- [ ] Keyboard shortcut actions
- [ ] App launcher actions

### Phase 2: Core Features (Week 3-4)
- [ ] Profile system
- [ ] Image display on keys
- [ ] Multimedia controls
- [ ] Dark/Light theme

### Phase 3: Advanced Features (Week 5-6)
- [ ] Animated GIF support
- [ ] Macro recording
- [ ] Auto-profile switching
- [ ] Plugin system

### Phase 4: Polish (Week 7-8)
- [ ] Network control API
- [ ] Daemon mode
- [ ] .deb packaging
- [ ] Documentation

## Dependencies

### Runtime
- `@elgato-stream-deck/node` - Official Elgato SDK
- `node-hid` - USB HID access
- `uiohook-napi` - Global keyboard hooks
- `sharp` - Image processing (incl. one-pass animated GIF/WebP decode)

### Development
- `electron-builder` - App packaging
- `vite` - Fast bundling
- `typescript` - Type safety
- `eslint` + `prettier` - Code quality
