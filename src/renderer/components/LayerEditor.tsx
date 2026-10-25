import React, { useState, useCallback, useMemo } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Type,
  Image as ImageIcon,
  Square,
  Palette,
  ChevronDown,
  ChevronRight,
  Upload,
} from "lucide-react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KeyLayer, LayerType } from "../../shared/types";
import { AssetImage } from "./AssetImage";

interface LayerEditorProps {
  layers: KeyLayer[];
  onChange: (layers: KeyLayer[]) => void;
  assets: string[];
  onUploadAsset: () => void;
  onDropAsset?: (assetName: string) => void;
}

const LAYER_TYPES: { type: LayerType; label: string; icon: React.ReactNode }[] =
  [
    { type: "background", label: "Background", icon: <Palette size={14} /> },
    { type: "text", label: "Text", icon: <Type size={14} /> },
    { type: "icon", label: "Icon", icon: <Square size={14} /> },
    { type: "image", label: "Image", icon: <ImageIcon size={14} /> },
  ];

/**
 * `order` semantics (shared with src/main/actions/KeyRenderer.ts
 * renderWithLayers): layers composite ascending by `order` — 0 is the BOTTOM
 * of the stack, higher values paint on top. New layers therefore go to the
 * TOP with max(order) + 1 (NOT layers.length, which is only correct when the
 * stored array happens to be sorted 0..N-1 with no gaps/duplicates).
 */
const topOrder = (layers: KeyLayer[]): number =>
  layers.reduce((max, l) => Math.max(max, l.order ?? 0), -1) + 1;

interface SortableLayerProps {
  layer: KeyLayer;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<KeyLayer>) => void;
  onDelete: () => void;
  assets: string[];
  onUploadAsset: () => void;
}

function SortableLayer({
  layer,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  assets,
  onUploadAsset,
}: SortableLayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const layerTypeInfo = LAYER_TYPES.find((t) => t.type === layer.type);

  const renderLayerConfig = () => {
    switch (layer.type) {
      case "background":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Solid Color
              </label>
              <input
                type="color"
                value={layer.backgroundColor || "#000000"}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="w-full h-9 rounded-lg bg-muted/40 border-2 border-border overflow-hidden cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Gradient
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={layer.backgroundGradientStart || "#000000"}
                  onChange={(e) =>
                    onUpdate({ backgroundGradientStart: e.target.value })
                  }
                  className="flex-1 h-9 rounded-lg bg-muted/40 border-2 border-border overflow-hidden cursor-pointer"
                />
                <input
                  type="color"
                  value={layer.backgroundGradientEnd || "#000000"}
                  onChange={(e) =>
                    onUpdate({ backgroundGradientEnd: e.target.value })
                  }
                  className="flex-1 h-9 rounded-lg bg-muted/40 border-2 border-border overflow-hidden cursor-pointer"
                />
              </div>
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Text Content
              </label>
              <textarea
                value={layer.text || ""}
                onChange={(e) => onUpdate({ text: e.target.value })}
                placeholder="Enter text..."
                rows={2}
                className="w-full p-2 bg-muted/40 border-2 border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Color
                </label>
                <input
                  type="color"
                  value={layer.textColor || "#ffffff"}
                  onChange={(e) => onUpdate({ textColor: e.target.value })}
                  className="w-full h-9 rounded-lg bg-muted/40 border-2 border-border overflow-hidden cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Size: {layer.fontSize || 14}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={layer.fontSize || 14}
                  onChange={(e) =>
                    onUpdate({ fontSize: parseInt(e.target.value) })
                  }
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>
        );

      case "icon":
      case "image":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Source
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={layer.source || ""}
                  onChange={(e) => onUpdate({ source: e.target.value })}
                  placeholder="Path or URL..."
                  className="flex-1 h-9 px-3 bg-muted/40 border-2 border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
                <button
                  onClick={onUploadAsset}
                  className="px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                >
                  <Upload size={14} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Fit
              </label>
              <select
                value={layer.fit || "contain"}
                onChange={(e) =>
                  onUpdate({
                    fit: e.target.value as "contain" | "cover" | "fill",
                  })
                }
                className="w-full h-9 px-3 bg-muted/40 border-2 border-border rounded-lg text-sm outline-none"
              >
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
              </select>
            </div>
            {assets.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Library
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-24 overflow-y-auto">
                  {assets.map((asset) => (
                    <div
                      key={asset}
                      className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        layer.source ===
                        `bigdeck-asset://${encodeURIComponent(asset)}`
                          ? "border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() =>
                        onUpdate({
                          source: `bigdeck-asset://${encodeURIComponent(asset)}`,
                        })
                      }
                    >
                      <AssetImage
                        src={`bigdeck-asset://${encodeURIComponent(asset)}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-2 rounded-xl overflow-hidden transition-all ${
        isDragging
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card/50"
      }`}
    >
      <div className="flex items-center gap-2 p-2 bg-muted/20">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical size={14} />
        </button>

        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {layerTypeInfo?.icon}
        </div>

        <span className="text-xs font-semibold flex-1">
          {layerTypeInfo?.label} #{index + 1}
        </span>

        <button
          onClick={() => onUpdate({ visible: !layer.visible })}
          className={`p-1 rounded transition-colors ${
            layer.visible ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        <button
          onClick={onToggleExpand}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <button
          onClick={onDelete}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 border-t border-border space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Opacity: {Math.round(layer.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={layer.opacity * 100}
              onChange={(e) =>
                onUpdate({ opacity: parseInt(e.target.value) / 100 })
              }
              className="w-full accent-primary"
            />
          </div>
          {renderLayerConfig()}
        </div>
      )}
    </div>
  );
}

export function LayerEditor({
  layers,
  onChange,
  assets,
  onUploadAsset,
  onDropAsset,
}: LayerEditorProps) {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Display TOP-FIRST (highest `order` first — the Photoshop-style layer list
  // convention): visual row 0 is the layer that paints on top of the key in
  // BOTH the preview (LayerStack) and on hardware (KeyRenderer). Stable sort
  // keeps ties in stored-array order.
  const displayLayers = useMemo(
    () => [...layers].sort((a, b) => b.order - a.order),
    [layers],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayLayers.findIndex((l) => l.id === active.id);
      const newIndex = displayLayers.findIndex((l) => l.id === over.id);
      // Reorder within the top-first display sequence, then map visual rows
      // back to `order`: row 0 (top) gets the HIGHEST order, the last row
      // gets 0 (bottom). This is the inverse of the visual index — writing
      // `order: i` here would invert every drag (the dragged-to-top layer
      // would end up composited at the BOTTOM, hidden behind the rest).
      const reordered = arrayMove(displayLayers, oldIndex, newIndex);
      const count = reordered.length;
      onChange(
        reordered.map((layer, i) => ({ ...layer, order: count - 1 - i })),
      );
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const asset = e.dataTransfer.getData("bigdeck/asset");
      if (asset) {
        if (onDropAsset) onDropAsset(asset);
        return;
      }
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const filePath = (file as unknown as { path: string }).path;
        if (filePath) {
          const newLayer: KeyLayer = {
            id: crypto.randomUUID(),
            type: "image",
            visible: true,
            opacity: 1,
            order: topOrder(layers), // dropped assets land on TOP
            source: filePath,
            fit: "contain",
          };
          onChange([...layers, newLayer]);
          setExpandedLayer(newLayer.id);
        }
      }
    },
    [layers, onChange, onDropAsset],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const addLayer = (type: LayerType) => {
    const newLayer: KeyLayer = {
      id: crypto.randomUUID(),
      type,
      visible: true,
      opacity: 1,
      order: topOrder(layers), // new layers start on TOP of the stack
      ...(type === "background" && { backgroundColor: "#000000" }),
      ...(type === "text" && {
        text: "Text",
        textColor: "#ffffff",
        fontSize: 14,
      }),
      ...(type === "icon" && { source: "", fit: "contain" }),
      ...(type === "image" && { source: "", fit: "cover" }),
    };
    onChange([...layers, newLayer]);
    setExpandedLayer(newLayer.id);
    setShowAddMenu(false);
  };

  const updateLayer = (id: string, updates: Partial<KeyLayer>) => {
    onChange(layers.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLayer = (id: string) => {
    onChange(layers.filter((l) => l.id !== id));
    if (expandedLayer === id) {
      setExpandedLayer(null);
    }
  };

  return (
    <div
      className="space-y-3"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold">Layers</label>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus size={12} />
            Add Layer
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[140px] overflow-hidden">
              {LAYER_TYPES.map((lt) => (
                <button
                  key={lt.type}
                  onClick={() => addLayer(lt.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                >
                  {lt.icon}
                  {lt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {layers.length === 0 ? (
        <div
          className={`text-center py-6 text-muted-foreground/50 text-xs border-2 border-dashed rounded-xl transition-colors ${
            isDragOver
              ? "border-primary bg-primary/5 text-primary"
              : "border-border"
          }`}
        >
          {isDragOver
            ? "Drop to add layer"
            : 'No layers yet. Click "Add Layer" or drag an asset here.'}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayLayers.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              className={`space-y-2 transition-colors ${
                isDragOver ? "opacity-60" : ""
              }`}
            >
              {displayLayers.map((layer, index) => (
                <SortableLayer
                  key={layer.id}
                  layer={layer}
                  index={index}
                  isExpanded={expandedLayer === layer.id}
                  onToggleExpand={() =>
                    setExpandedLayer(
                      expandedLayer === layer.id ? null : layer.id,
                    )
                  }
                  onUpdate={(updates) => updateLayer(layer.id, updates)}
                  onDelete={() => deleteLayer(layer.id)}
                  assets={assets}
                  onUploadAsset={onUploadAsset}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border">
        Top row = front. Drag layers to reorder. Drop assets to add image
        layers.
      </div>
    </div>
  );
}
