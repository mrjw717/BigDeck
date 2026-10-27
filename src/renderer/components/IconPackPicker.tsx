import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ImageOff, Search, X } from "lucide-react";
import type {
  IconEntry,
  IconFile,
  IconPackSummary,
} from "../../main/assets/IconPack";

// ============================================================================
// IconPackPicker — Elgato .sdIconPack browser for icon layers (LayerEditor).
//
// APPLY DECISION — what lands in `layer.source`:
// The absolute file path returned by `assets.getIcon().file`
// (<userData>/iconpacks/<packId>/icons/<iconId>). Both consumers accept it
// as-is, so no copy step is needed:
//   - Hardware (KeyRenderer icon branch): layer.source goes through
//     resolveAssetPath, which passes any non-`bigdeck-asset://` string
//     through unchanged and reads it with sharp at SVG density. (The
//     elgato-<name> managed-assets convention belongs to the profile
//     importer's key images, not to icon packs.)
//   - UI preview (LayerStack → KeyImage → resolveAssetUrl): absolute paths
//     are re-encoded as `bigdeck-asset://local/?p=...`, which the protocol
//     handler serves straight from disk.
// ============================================================================

/** Grid cap — the Elgato packs ship up to 845 icons; render a bounded window. */
const MAX_VISIBLE_ICONS = 120;

/** data: URL cache shared across every open picker instance. */
const dataUrlCache = new Map<string, string | null>();

/** One grid cell: lazily resolves its thumbnail through assets.getIcon. */
function IconThumb({ packId, icon }: { packId: string; icon: IconEntry }) {
  const cacheKey = `${packId}::${icon.id}`;
  const [dataUrl, setDataUrl] = useState<string | null>(
    () => dataUrlCache.get(cacheKey) ?? null,
  );

  useEffect(() => {
    const cached = dataUrlCache.get(cacheKey);
    if (cached !== undefined) {
      setDataUrl(cached);
      return;
    }
    let disposed = false;
    window.bigdeck?.assets
      .getIcon(packId, icon.id)
      .then((icon_: IconFile | null) => {
        dataUrlCache.set(cacheKey, icon_?.dataUrl ?? null);
        if (!disposed) setDataUrl(icon_?.dataUrl ?? null);
      })
      .catch(() => {
        dataUrlCache.set(cacheKey, null);
        if (!disposed) setDataUrl(null);
      });
    return () => {
      disposed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, icon.id]);

  if (!dataUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
        <ImageOff size={14} />
      </div>
    );
  }
  return (
    <img
      src={dataUrl}
      alt={icon.name}
      className="w-full h-full object-contain p-1.5"
      draggable={false}
    />
  );
}

interface IconPackPickerProps {
  /** Current layer source (absolute icon path when one is applied). */
  source: string;
  /** Called with the absolute file path of the picked icon. */
  onApply: (source: string) => void;
  /** Clear the layer source entirely. */
  onClear: () => void;
}

export function IconPackPicker({
  source,
  onApply,
  onClear,
}: IconPackPickerProps) {
  const [packs, setPacks] = useState<IconPackSummary[] | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [icons, setIcons] = useState<IconEntry[] | null>(null);
  const [search, setSearch] = useState("");

  // Load packs once, then the selected pack's icon index.
  useEffect(() => {
    let disposed = false;
    window.bigdeck?.assets
      .listIconPacks()
      .then((list) => {
        if (disposed) return;
        setPacks(list);
        setSelectedPackId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => {
        if (!disposed) setPacks([]);
      });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPackId) {
      setIcons([]);
      return;
    }
    let disposed = false;
    window.bigdeck?.assets
      .listIcons(selectedPackId)
      .then((list) => {
        if (!disposed) setIcons(list);
      })
      .catch(() => {
        if (!disposed) setIcons([]);
      });
    return () => {
      disposed = true;
    };
  }, [selectedPackId]);

  // Search across the display name AND the pack-provided tags (the official
  // picker searches tags; some packs rely on them entirely).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!icons) return null;
    if (!q) return icons;
    return icons.filter(
      (icon) =>
        icon.name.toLowerCase().includes(q) ||
        icon.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [icons, search]);

  const visible = filtered?.slice(0, MAX_VISIBLE_ICONS) ?? [];

  /** Resolve the picked icon to its absolute path and hand it to the layer. */
  const applyIcon = async (icon: IconEntry) => {
    if (!selectedPackId) return;
    try {
      const resolved = await window.bigdeck?.assets.getIcon(
        selectedPackId,
        icon.id,
      );
      if (resolved?.file) onApply(resolved.file);
    } catch (error) {
      console.error("Failed to resolve icon:", error);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground block">
        Icon Packs (Elgato .sdIconPack)
      </label>

      {/* Pack dropdown */}
      <div className="relative">
        <select
          value={selectedPackId ?? ""}
          onChange={(e) => {
            setSelectedPackId(e.target.value || null);
            setIcons(null);
          }}
          className="w-full h-9 px-3 pr-8 bg-muted/40 border-2 border-border rounded-lg text-sm outline-none appearance-none cursor-pointer"
          aria-label="Icon pack"
        >
          {(packs ?? []).length === 0 && <option value="">No packs installed</option>}
          {(packs ?? []).map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.name} ({pack.iconCount})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons and tags..."
          className="w-full h-8 pl-8 pr-3 bg-muted/40 border-2 border-border rounded-lg text-xs outline-none focus:border-primary"
          aria-label="Search icons"
        />
      </div>

      {/* Icon grid */}
      {filtered === null ? (
        <div className="text-center py-4 text-muted-foreground/50 text-xs">
          Loading icons...
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground/50 text-xs border-2 border-dashed border-border rounded-xl">
          No icons match
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
          {visible.map((icon) => {
            const applied = source.endsWith(`/${icon.id}`);
            return (
              <button
                key={icon.id}
                onClick={() => void applyIcon(icon)}
                title={`Use icon: ${icon.name}`}
                aria-label={`Use icon: ${icon.name}`}
                className={`aspect-square rounded-lg overflow-hidden border-2 flex items-center justify-center bg-black/30 transition-all ${
                  applied
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <IconThumb packId={selectedPackId!} icon={icon} />
              </button>
            );
          })}
        </div>
      )}

      {filtered !== null && filtered.length > visible.length && (
        <p className="text-[10px] text-muted-foreground">
          Showing {visible.length} of {filtered.length} — refine the search to
          see more.
        </p>
      )}

      {/* Applied source line */}
      {source ? (
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-1 truncate text-[10px] text-muted-foreground font-mono">
            {source}
          </span>
          <button
            onClick={onClear}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors flex-none"
            aria-label="Clear icon source"
            title="Clear icon"
          >
            <X size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
