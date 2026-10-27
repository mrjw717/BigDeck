import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import bigdeckIcon from "../../../assets/icons/bigdeck-icon.svg";
import {
  Plus,
  Copy,
  Trash2,
  Pencil,
} from "lucide-react";
import { KeyImage } from "./KeyImage";
import { LayerStack } from "./LayerStack";
import { useDeviceStore } from "../stores/deviceStore";
import { useProfileStore } from "../stores/profileStore";
import { DEVICE_SPECS } from "../../shared/constants";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { ContextMenu } from "./ContextMenu";
import { SortableKey } from "./SortableKey";
import type {
  DeviceInfo,
  Profile,
  KeyConfig,
  KeyLayer,
} from "../../shared/types";

interface StreamdeckViewProps {
  device: DeviceInfo | null;
  profile?: Profile | null;
  selectedKeyIndex: number | null;
  onKeySelect: (keyIndex: number) => void;
}

// Helper hook for resize observation
function useResizeObserver(ref: React.RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observeTarget = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      });
    });

    resizeObserver.observe(observeTarget);

    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, [ref]);

  return dimensions;
}

function getKeyBackgroundStyle(
  config: KeyConfig | undefined,
  isPressed: boolean,
): React.CSSProperties {
  if (!config) return {};

  const img = config.image;

  // Layer-driven keys: the legacy `image` background is ignored by the
  // hardware renderer whenever a non-empty layers array exists
  // (KeyRenderer.renderKeyImageEx: layers.length > 0 wins) — the background
  // comes from the background LAYER inside LayerStack, in stack order. So the
  // button itself must not paint the legacy background underneath it.
  if (!config.layers?.length) {
    const gradientDir = img?.backgroundGradientDirection || 135;
    const pressedGradientDir =
      img?.pressedBackgroundGradientDirection ||
      img?.backgroundGradientDirection ||
      135;

    if (
      isPressed &&
      img?.pressedBackgroundGradientStart &&
      img?.pressedBackgroundGradientEnd
    ) {
      return {
        background: `linear-gradient(${pressedGradientDir}deg, ${img.pressedBackgroundGradientStart}, ${img.pressedBackgroundGradientEnd})`,
      };
    }
    if (isPressed && img?.pressedBackgroundColor) {
      return { backgroundColor: img.pressedBackgroundColor };
    }
    if (img?.backgroundGradientStart && img?.backgroundGradientEnd) {
      return {
        background: `linear-gradient(${gradientDir}deg, ${img.backgroundGradientStart}, ${img.backgroundGradientEnd})`,
      };
    }
    return img?.backgroundColor
      ? { backgroundColor: img.backgroundColor }
      : {};
  }

  return {};
}

interface DeckKeyProps {
  keyIndex: number;
  config?: KeyConfig;
  isSelected: boolean;
  isDropTarget: boolean;
  clipboardActive: boolean;
  onKeyClick: (e: React.MouseEvent, index: number) => void;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
  onClear: (index: number) => void;
  onSelect: (index: number) => void;
}

/**
 * A single key cell. Memoized, and subscribes ONLY to its own pressed state —
 * a hardware press re-renders the pressed key, not the whole grid.
 */
const DeckKey = React.memo(function DeckKey({
  keyIndex,
  config,
  isSelected,
  isDropTarget,
  clipboardActive,
  onKeyClick,
  onContextMenu,
  onClear,
  onSelect,
}: DeckKeyProps) {
  const isPressed = useDeviceStore((s) => s.pressedKeys.has(keyIndex));

  const hasAction = !!config?.action;
  const hasImage = !!config?.image;
  const hasLayers = !!(
    config?.layers &&
    config.layers.length > 0 &&
    config.layers.some((l) => l.visible !== false)
  );
  const hasPressedLayers = !!(
    config?.pressedLayers &&
    config.pressedLayers.length > 0 &&
    config.pressedLayers.some((l) => l.visible !== false)
  );
  const isEmpty = !hasAction && !hasImage && !hasLayers && !hasPressedLayers;

  return (
    <div className="relative w-full h-full group/key">
      {/* Native action drops are handled at the GRID level (the container
          computes the nearest key from the pointer position) — the
          data-key-index attribute is what the resolver measures against.
          No per-key drag handlers: gaps and padding resolve to the nearest
          key instead of rejecting the drop. */}
      <button
        data-key-index={keyIndex}
        onClick={(e) => onKeyClick(e, keyIndex)}
        onContextMenu={(e) => onContextMenu(e, keyIndex)}
        className={`
           streamdeck-key relative transition-all duration-200 rounded-xl overflow-hidden border-2 w-full h-full
           ${isPressed ? "active ring-4 ring-primary/30 scale-95" : ""}
           ${isSelected ? "selected ring-2 ring-primary bg-primary/10 border-primary" : "border-border/50 hover:border-primary/50"}
           ${isDropTarget ? "ring-4 ring-green-400/70 bg-green-500/20 border-green-400 scale-105 z-10" : ""}
           ${isEmpty ? "empty border-dashed bg-muted/5 backdrop-blur-sm opacity-50 hover:opacity-100 hover:bg-muted/10" : "bg-muted/20 shadow-lg opacity-100"}
         `}
        style={getKeyBackgroundStyle(config, isPressed)}
      >
        {/* Key Content — precedence mirrors KeyRenderer.renderKeyImageEx:
            a non-empty `layers` array replaces the legacy `image` field
            entirely (the hardware ignores `image` when layers exist), so the
            preview must show the layer composite, never the legacy image. */}
        {(hasLayers || hasPressedLayers) ? (
          <LayerStack
            layers={
              isPressed && hasPressedLayers
                ? config?.pressedLayers || []
                : config?.layers || []
            }
          />
        ) : hasImage ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {config?.image?.type === "text" && (
              <span
                className="text-center px-1 font-bold leading-tight tracking-tight whitespace-pre-wrap"
                style={{
                  color: config.image.textColor,
                  fontSize: `${config.image.fontSize || 12}px`,
                }}
              >
                {config.image.text}
              </span>
            )}
            {config?.image?.type === "icon" && (
              <KeyImage
                src={config.image.source}
                className="w-10 h-10 object-contain drop-shadow-md"
              />
            )}
            {config?.image?.type === "static" && (
              <KeyImage
                src={config.image.source}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        ) : hasAction ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-1 text-primary">
              <Plus size={16} className="opacity-40" />
            </div>
            <div className="text-[9px] font-black text-center text-muted-foreground uppercase tracking-widest truncate w-full">
              {config?.label ||
                (config?.action ? config.action.name : "") ||
                (config?.action ? config.action.type.replace("-", " ") : "")}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/key:opacity-100 transition-opacity bg-primary/5">
            <Plus size={24} className="text-primary/40" />
          </div>
        )}

        {/* Label Overlay - 2 line support */}
        {config?.label && (
          <div
            className={`
              absolute left-0 right-0 text-[10px] font-black tracking-tighter text-center px-1 py-1 leading-[1.1]
              ${config.labelPosition === "top" ? "top-0 bg-gradient-to-b from-black/60 to-transparent" : ""}
              ${config.labelPosition === "center" ? "top-1/2 -translate-y-1/2" : ""}
              ${config.labelPosition === "bottom" || !config.labelPosition ? "bottom-0 bg-gradient-to-t from-black/60 to-transparent" : ""}
            `}
            style={{ color: config.labelColor || "#ffffff" }}
          >
            <div className="line-clamp-2 break-words">{config.label}</div>
          </div>
        )}

        {/* Drop Zone Indicator */}
        {isDropTarget && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl z-10">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-pulse">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Highlight for Clipboards */}
        {clipboardActive && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary opacity-0 group-hover/key:opacity-100 transition-opacity ring-2 ring-background" />
        )}
      </button>

      {/* Quick Actions Overlay */}
      {!isEmpty && (
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover/key:opacity-100 transition-all duration-200 z-20 scale-90 group-hover/key:scale-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear(keyIndex);
            }}
            className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            aria-label={`Delete key ${keyIndex + 1}`}
            title="Delete"
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}
      {!isEmpty && (
        <div className="absolute -top-2 -left-2 flex gap-1 opacity-0 group-hover/key:opacity-100 transition-all duration-200 z-20 scale-90 group-hover/key:scale-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(keyIndex);
            }}
            className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            aria-label={`Edit key ${keyIndex + 1}`}
            title="Edit"
          >
            <Pencil size={10} />
          </button>
        </div>
      )}
    </div>
  );
});

export function StreamdeckView({
  device,
  selectedKeyIndex,
  onKeySelect,
}: StreamdeckViewProps) {
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const updateKeyConfig = useProfileStore((s) => s.updateKeyConfig);
  const profile = activeProfile;

  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } =
    useResizeObserver(containerRef);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    keyIndex: number;
  } | null>(null);
  const [clipboard, setClipboard] = useState<Partial<KeyConfig> | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const specs = useMemo(
    () => (device ? DEVICE_SPECS[device.type] : null),
    [device],
  );
  const currentPage = profile?.pages[profile.activePage];
  const keys = currentPage?.keys || [];

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, keyIndex: number) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, keyIndex });
      onKeySelect(keyIndex);
    },
    [onKeySelect],
  );

  const handleCopy = useCallback(
    (index: number) => {
      const config = keys.find((k) => k.keyIndex === index);
      if (config) {
        const { id, keyIndex, ...rest } = config;
        setClipboard(rest);
      }
      setContextMenu(null);
    },
    [keys],
  );

  const handlePaste = useCallback(
    async (index: number) => {
      if (clipboard) {
        await updateKeyConfig(index, {
          ...clipboard,
          action: clipboard.action
            ? { ...clipboard.action, id: crypto.randomUUID() }
            : undefined,
        });
      }
      setContextMenu(null);
    },
    [clipboard, updateKeyConfig],
  );

  const handleClear = useCallback(
    async (index: number) => {
      await updateKeyConfig(index, {
        action: undefined,
        image: undefined,
        label: undefined,
        layers: [],
        pressedLayers: [],
        syncPressedState: undefined,
        labelPosition: undefined,
        labelColor: undefined,
      });
      setContextMenu(null);
    },
    [updateKeyConfig],
  );

  const handleKeyClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();

      let newSelection = new Set(selectedIndices);

      if (e.shiftKey && lastSelectedIndex !== null) {
        // Range selection
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          newSelection.add(i);
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle selection
        if (newSelection.has(index)) {
          newSelection.delete(index);
        } else {
          newSelection.add(index);
        }
        setLastSelectedIndex(index);
      } else {
        // Single selection
        newSelection = new Set([index]);
        setLastSelectedIndex(index);
        onKeySelect(index);
      }

      setSelectedIndices(newSelection);
    },
    [selectedIndices, lastSelectedIndex, onKeySelect],
  );

  const handleDuplicate = useCallback(
    async (index: number) => {
      const config = keys.find((k) => k.keyIndex === index);
      if (config && specs && index < specs.keyCount - 1) {
        const { id, keyIndex, ...rest } = config;
        await updateKeyConfig(index + 1, {
          ...rest,
          action: rest.action
            ? { ...rest.action, id: crypto.randomUUID() }
            : undefined,
        });
      }
      setContextMenu(null);
    },
    [keys, specs, updateKeyConfig],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedOverIndex(null);

      if (over && active.id !== over.id) {
        const activeIndex = parseInt(active.id as string);
        const overIndex = parseInt(over.id as string);

        const activeConfig = keys.find((k) => k.keyIndex === activeIndex);
        const overConfig = keys.find((k) => k.keyIndex === overIndex);

        // Helper: does a key have meaningful content?
        const hasContent = (cfg: typeof activeConfig) =>
          cfg &&
          (!!cfg.action ||
            (cfg.layers &&
              cfg.layers.length > 0 &&
              cfg.layers.some((l) => l.visible !== false)) ||
            (cfg.pressedLayers &&
              cfg.pressedLayers.length > 0 &&
              cfg.pressedLayers.some((l) => l.visible !== false)) ||
            !!cfg.image ||
            !!cfg.label);

        const srcHasContent = hasContent(activeConfig);
        const tgtHasContent = hasContent(overConfig);

        // Skip if source is empty — nothing to move
        if (!srcHasContent) return;

        // Helper: strip identity fields from a config
        const stripId = (cfg: typeof activeConfig) => {
          if (!cfg) return {};
          const { id, keyIndex, ...rest } = cfg;
          return {
            ...rest,
            action: rest.action
              ? { ...rest.action, id: crypto.randomUUID() }
              : undefined,
          };
        };

        const cleared = {
          action: undefined,
          image: undefined,
          label: undefined,
          layers: [] as KeyLayer[],
          pressedLayers: [] as KeyLayer[],
          syncPressedState: undefined,
          labelPosition: undefined as "top" | "center" | "bottom" | undefined,
          labelColor: undefined,
        };

        if (tgtHasContent) {
          // SWAP: exchange both keys' configs — no data lost
          const aData = stripId(activeConfig);
          const bData = stripId(overConfig);
          await Promise.all([
            updateKeyConfig(overIndex, aData),
            updateKeyConfig(activeIndex, bData),
          ]);
        } else {
          // MOVE: source → target, clear source
          const aData = stripId(activeConfig);
          await Promise.all([
            updateKeyConfig(overIndex, aData),
            updateKeyConfig(activeIndex, cleared),
          ]);
        }
        // Hardware updates flow automatically: updateKeyConfig persists the
        // profile, main diffs it, and only these two keys re-render + write.
      }
    },
    [keys, updateKeyConfig],
  );

  const handleNativeDrop = useCallback(
    async (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      try {
        const dataStr = e.dataTransfer.getData("bigdeck/action");
        if (dataStr) {
          const actionPayload = JSON.parse(dataStr);
          const targetKey = keys.find((k) => k.keyIndex === targetIndex);
          const draggedAppearance = actionPayload.appearance?.layers?.length > 0;

          const action = { ...actionPayload, id: crypto.randomUUID() };
          delete action.appearance;
          delete action.label;

          const update: any = {
            action,
            label: actionPayload.name || actionPayload.label,
          };

          if (draggedAppearance) {
            // Dragged item brings its own appearance — always apply it
            update.layers = actionPayload.appearance.layers;
          }
          // If no dragged appearance, key keeps whatever layers it already has

          await updateKeyConfig(targetIndex, update);
        }
      } catch (err) {
        console.error("Failed to handle native drop:", err);
      }
    },
    [keys, updateKeyConfig],
  );

  // ------------------------------------------------------------------
  // Grid-level native drop handling. The whole keys grid is the drop
  // surface: during dragover the pointer resolves to the NEAREST key
  // center (gaps, padding and bezel included), so dropping anywhere on
  // the device body lands on a key instead of requiring pixel-perfect
  // aim on a single small button.
  // ------------------------------------------------------------------
  const keysGridRef = useRef<HTMLDivElement>(null);

  const computeKeyIndexFromPoint = useCallback(
    (x: number, y: number): number | null => {
      const grid = keysGridRef.current;
      if (!grid) return null;
      const gridRect = grid.getBoundingClientRect();
      if (
        x < gridRect.left ||
        x > gridRect.right ||
        y < gridRect.top ||
        y > gridRect.bottom
      ) {
        return null;
      }
      const cells = grid.querySelectorAll<HTMLElement>("[data-key-index]");
      let bestIndex: number | null = null;
      let bestDist = Infinity;
      cells.forEach((el) => {
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - x;
        const dy = r.top + r.height / 2 - y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = Number(el.dataset.keyIndex);
        }
      });
      return bestIndex;
    },
    [],
  );

  const handleGridDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      const idx = computeKeyIndexFromPoint(e.clientX, e.clientY);
      if (idx !== null) setDraggedOverIndex(idx);
    },
    [computeKeyIndexFromPoint],
  );

  const handleGridDragLeave = useCallback((e: React.DragEvent) => {
    // Child transitions fire dragleave constantly — only clear when the
    // pointer genuinely left the grid.
    const grid = keysGridRef.current;
    if (
      grid &&
      e.relatedTarget instanceof Node &&
      grid.contains(e.relatedTarget)
    ) {
      return;
    }
    setDraggedOverIndex(null);
  }, []);

  const handleGridDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const idx = computeKeyIndexFromPoint(e.clientX, e.clientY);
      setDraggedOverIndex(null);
      if (idx !== null) {
        void handleNativeDrop(e, idx);
      }
    },
    [computeKeyIndexFromPoint, handleNativeDrop],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        const index = Array.from(selectedIndices)[0];
        if (index !== undefined) handleCopy(index);
      }
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        selectedIndices.forEach((index) => handlePaste(index));
      }
      if (e.ctrlKey && e.key === "x") {
        e.preventDefault();
        const firstIndex = Array.from(selectedIndices)[0];
        if (firstIndex !== undefined) {
          handleCopy(firstIndex);
          selectedIndices.forEach((index) => handleClear(index));
          setSelectedIndices(new Set());
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        selectedIndices.forEach((index) => handleClear(index));
        setSelectedIndices(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndices, handleCopy, handlePaste, handleClear]);

  if (!device || !specs) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
        <div className="w-24 h-24 flex items-center justify-center mb-6 animate-pulse">
          <img
            src={bigdeckIcon}
            className="w-full h-full object-contain opacity-50"
            alt="Disconnected"
          />
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">
          DISCONNECTED
        </h2>
        <p className="text-muted-foreground max-w-sm text-sm font-medium">
          Connect your Elgato Stream Deck to begin orchestration.
        </p>
      </div>
    );
  }

  const renderKey = (keyIndex: number) => {
    const config = keys.find((k) => k.keyIndex === keyIndex);
    const isSelected = selectedIndices.has(keyIndex);

    return (
      <SortableKey
        key={keyIndex}
        id={keyIndex.toString()}
        disabled={!!contextMenu}
        isSelected={isSelected}
      >
        <DeckKey
          keyIndex={keyIndex}
          config={config}
          isSelected={isSelected}
          isDropTarget={draggedOverIndex === keyIndex}
          clipboardActive={!!clipboard}
          onKeyClick={handleKeyClick}
          onContextMenu={handleContextMenu}
          onClear={handleClear}
          onSelect={onKeySelect}
        />
      </SortableKey>
    );
  };

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative p-8"
      ref={containerRef}
    >
      {/* Device Header */}
      <div className="absolute top-4 left-0 right-0 z-10 animate-in fade-in duration-700 pointer-events-none">
        <h2 className="text-2xl font-black tracking-tighter uppercase text-center opacity-10">
          {specs.name}
        </h2>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Device Frame Container */}
        <div
          className="relative"
          style={{
            transition: "transform 0.2s ease-out",
            willChange: "transform",
            aspectRatio: `${specs.columns * 1.1 + 0.2} / ${specs.rows * 1.1 + 0.2}`,
            height: "auto",
            width: "auto",
            maxHeight: "100%",
            maxWidth: "100%",
            ...(() => {
              if (!specs || containerWidth === 0 || containerHeight === 0)
                return {};
              const gap = 20;
              const keySize = 100;
              const padding = 40;

              const contentW =
                specs.columns * keySize +
                (specs.columns - 1) * gap +
                padding * 2;
              const contentH =
                specs.rows * keySize +
                (specs.rows - 1) * gap +
                padding * 2;
              const ratio = contentW / contentH;

              const availW = containerWidth - 64;
              const availH = containerHeight - 64;
              const availRatio = availW / availH;

              if (availRatio > ratio) {
                return { height: availH, width: availH * ratio };
              } else {
                return { width: availW, height: availW / ratio };
              }
            })(),
          }}
        >
          {/* Main Device Body */}
          <div className="w-full h-full bg-[#1a1a1a] rounded-[32px] shadow-2xl relative overflow-hidden border border-white/5 mx-auto">
            {/* Soft Glow Behind */}
            <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10" />

            {/* Inner Bezel / Gloss */}
            <div className="absolute inset-0 rounded-[32px] ring-1 ring-white/10 pointer-events-none z-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10" />

            {/* Keys Grid — THE drop surface for native action drops */}
            <div
              ref={keysGridRef}
              onDragOver={handleGridDragOver}
              onDragLeave={handleGridDragLeave}
              onDrop={handleGridDrop}
              className="w-full h-full grid"
              style={{
                padding: "6%",
                gap: "4%",
                gridTemplateColumns: `repeat(${specs.columns}, 1fr)`,
                gridTemplateRows: `repeat(${specs.rows}, 1fr)`,
                willChange: "transform",
              }}
            >
              <SortableContext
                items={Array.from({ length: specs.keyCount }, (_, i) =>
                  i.toString(),
                )}
                strategy={rectSortingStrategy}
              >
                {Array.from({ length: specs.keyCount }, (_, i) => renderKey(i))}
              </SortableContext>
            </div>

            {/* Outer Glow (Simulated by separate div behind) */}
            <div className="absolute -inset-4 bg-primary/20 blur-[40px] rounded-[50px] -z-10 transition-all duration-1000 opacity-60"></div>
          </div>
        </div>
      </DndContext>

      {/* Context Menu Portal */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onCopy={() => handleCopy(contextMenu.keyIndex)}
          onPaste={() => handlePaste(contextMenu.keyIndex)}
          onCut={() => {
            handleCopy(contextMenu.keyIndex);
            handleClear(contextMenu.keyIndex);
          }}
          onClear={() => handleClear(contextMenu.keyIndex)}
          onDuplicate={() => handleDuplicate(contextMenu.keyIndex)}
          onClose={() => setContextMenu(null)}
          canPaste={!!clipboard}
        />
      )}

      {/* Keyboard Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Ctrl+C • Ctrl+V • Del • Right Click
        </p>
      </div>
    </div>
  );
}
