# Elgato Icon Packs (`.sdIconPack`) — format & BigDeck support

Reverse-engineered from the KeyCreator app bundle
(`/tmp/opencode/kc/extracted/com.elgato.keycreator.sdPlugin/static/`) and the
Stream Deck macOS app Resources. BigDeck support lives in
`src/main/assets/IconPack.ts`.

## TL;DR

An `.sdIconPack` is a **directory** (despite the file-like extension) holding a
manifest, a JSON icon index, and **one standalone SVG file per icon**. There is
no icon font, no binary container, and no codepoint mapping — the format is
directly usable without any conversion, so BigDeck implements **full support**:
parse, import, list, and serve icons (raw SVG text + data URL).

## Directory layout

```
com.elgato.defaulticonswhite.sdIconPack/
├── manifest.json     pack metadata
├── icons.json        icon index: [{ path, name, tags[] }, ...]
├── icons/            the actual icons (one SVG per index entry)
│   ├── IconAdd-White.svg
│   ├── IconAdd-Filled-White.svg
│   └── ...
├── icon.svg          pack thumbnail (shown in the app's pack picker)
└── license.txt
```

### `manifest.json`

```json
{
    "Name": "Elgato Icons (White)",
    "Version": "2.0.0",
    "Description": "A collection of Elgato icons in white, suitable for dark backgrounds.",
    "Author": "Elgato Systems",
    "URL": "https://www.elgato.com",
    "Icon": "icon.svg",
    "License": "license.txt",
    "pinned": "true",
    "canhide": "true"
}
```

| Field | Notes |
|---|---|
| `Name`, `Version`, `Description`, `Author`, `URL` | as expected. `Name` is the only field the official app arguably needs. |
| `Icon` | pack thumbnail path, relative to the pack root. |
| `License` | path to a text file, relative to the pack root. |
| `pinned` / `canhide` | **strings** `"true"`/`"false"`, not booleans — the official app stringifies them. BigDeck accepts both. `pinned` packs can't be hidden in the official picker. |

### `icons.json`

```json
[
  {
    "path": "IconAccessibility-White.svg",
    "name": "Accessibility icon (Outlined, White)",
    "tags": ["accessibility", "inclusive", "assistive", "universal design"]
  }
]
```

- **Some packs ship this file with a UTF-8 BOM** (`com.elgato.logoiconsblack`
  / `…white` do) — `JSON.parse` rejects a leading U+FEFF, so strip it before
  parsing (BigDeck does, in `stripBom`).
- `path` is relative to the pack's **`icons/`** subdirectory (not the pack root).
- `name` is a display name; some packs (e.g. `com.elgato.elgato.sdIconPack`)
  lazily leave `name` equal to the filename and `tags` empty.
- `tags` power the official search box; treat as optional/free-form.
- The index is the source of truth for listing — entries may reference files
  that are missing on disk, so serving an icon must check the filesystem.

### `icons/*.svg`

Standalone SVGs, e.g. 144×144 viewBox, plain `<path fill="white">` elements,
no external references, no scripts. The black/white packs are identical shapes
with a different `fill` (hence paired `-Black`/`-White` packs rather than a
recoloring mechanism). Color packs (`logoiconscolor`) embed brand colors.

## Observed packs (KeyCreator static/)

| Pack | Icons | Notes |
|---|---|---|
| `com.elgato.defaulticonsblack` / `…white` | 845 each | paired outlined/filled variants |
| `com.elgato.elgato` | 219 | legacy; also ships an `andy.sketch` source file (ignored) |
| `com.elgato.logoiconsblack` / `…white` | 159 each | brand logos |
| `com.elgato.logoiconscolor` | 134 | brand logos, full color |
| `com.elgato.custom` | 0 | **empty directory, no manifest** — the user's custom pack. Importers must tolerate packs without a manifest. |

`static/defaults.json` next to the packs lists the load order:

```json
{
    "defaultIconPacks": ["com.elgato.elgato.sdIconPack", "com.elgato.logoiconscolor.sdIconPack", ...],
    "defaultLibraryName": "com.elgato.elgato"
}
```

## Related format: `.sdIcons` (app PageIcons — NOT `.sdIconPack`)

The Stream Deck app's `Resources/PageIcons/` ships `*.sdIcons` directories —
a different, simpler format used for the official app's page/icon chrome:
`manifest.json` with `{ Name, Icon, Images[] }` (paths relative to the pack
root, e.g. `Images/1IconSync.svg`) plus localized `<lang>.json` files. No
`icons.json` index, no tags. Out of scope for BigDeck's icon packs; listed
here so the two extensions aren't confused.

## BigDeck implementation

### Storage & import

Packs are **imported** (recursive copy) into `<userData>/iconpacks/`, mirroring
the `sdplugins` directory pattern. At startup the app seeds this folder from
the bundled `resources/iconpacks/` directory — packaged builds embed it via
electron-builder `extraResources` (`resources/iconpacks` →
`<resources>/iconpacks`, see electron-builder.yml); dev runs read the repo
checkout directly. User-imported packs are never overwritten by a re-seed.

### API (`src/main/assets/IconPack.ts` — `IconPackManager`)

| Method | Behavior |
|---|---|
| `listIconPacks()` | scan `packsDir` for `*.sdIconPack` dirs with a readable `manifest.json`; broken packs are skipped with a warning. |
| `listIcons(packId)` | parse `icons.json`; entries without a `path` are dropped; missing index → `[]`. |
| `getIconSvgOrFile(packId, iconId)` | `{ file, svg, dataUrl }` — absolute path, raw SVG text (`.svg` only), and a ready-to-use `data:` URL. `null` when missing. Path-traversal ids are rejected (resolution is checked to stay inside the pack's `icons/` dir). |
| `installFromFile(srcDir)` | copy one `.sdIconPack` dir in, replacing any previous install. |
| `importAllFrom(srcDir)` | import every `*.sdIconPack` in a folder; already-installed names are skipped (user copy wins); broken packs are reported in `failed` and their partial copy removed. Never throws. |

Icon ids are the `icons.json` `path` (e.g. `IconAdd-White.svg`) — stable and
unique within a pack. Pack ids are the directory name (`com.elgato.elgato.sdIconPack`).

### IPC / renderer

New `assets.*` channels (preloaded as `window.bigdeck.assets.*`):

| Channel | Renderer API | Returns |
|---|---|---|
| `assets.listIconPacks` | `assets.listIconPacks()` | `IconPackSummary[]` |
| `assets.listIcons` | `assets.listIcons(packId)` | `IconEntry[]` |
| `assets.getIcon` | `assets.getIcon(packId, iconId)` | `IconFile \| null` |

Renderer usage: prefer `getIcon(...).dataUrl` for `<img src>`; use `.svg` to
inline and recolor (e.g. replace `fill="white"` with `currentColor`).

The KeyEditor icon layer's BuiltInIcons stub is **deliberately untouched**
(separate work) — the backend surface above is everything the UI phase needs.

## Known unknowns

- The official app's pack *picker* UI metadata (ordering, pin behavior) is
  approximated from `manifest.json` fields; no traffic capture was done.
- Whether the official app supports `.sdIconPack` **zip** distributables —
  none were observed; BigDeck only imports the directory form.
