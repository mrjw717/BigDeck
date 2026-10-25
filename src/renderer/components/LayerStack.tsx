import React from "react";
import { KeyImage } from "./KeyImage";
import type { KeyLayer } from "../../shared/types";

/**
 * Renders key layers as ONE z-ordered stack. This is the preview half of the
 * single visual-truth contract with the hardware renderer:
 *
 *   src/main/actions/KeyRenderer.ts renderWithLayers():
 *     [...layers].filter(l => l.visible).sort((a, b) => a.order - b.order)
 *     then composites FIRST-to-LAST via sharp overlays — i.e. ascending
 *     `order`, 0 = bottom of the stack, higher values paint on top; ties
 *     keep stored-array order (V8 sort is stable).
 *
 * The JSX below is the exact same pipeline in CSS: identical filter, sort,
 * and children order (later siblings paint above earlier ones). ALL layer
 * types — including background — participate in the same stack; grouping by
 * type would scramble the z-order the hardware respects. The layer LIST UI
 * (LayerEditor) is the top-first mirror of this: its row 0 shows the HIGHEST
 * order (front of the stack).
 */
export function LayerStack({ layers }: { layers: KeyLayer[] }) {
  const sorted = [...layers]
    .filter((l) => l.visible !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sorted.map((l) => {
        if (l.type === "background") {
          const style: React.CSSProperties = { opacity: l.opacity };
          if (l.backgroundGradientStart && l.backgroundGradientEnd) {
            style.background = `linear-gradient(${l.backgroundGradientDirection || 135}deg, ${l.backgroundGradientStart}, ${l.backgroundGradientEnd})`;
          } else {
            style.background = l.backgroundColor || "#000000";
          }
          return <div key={l.id} className="absolute inset-0" style={style} />;
        }

        if (l.type === "text") {
          if (!l.text) return null;
          return (
            <div
              key={l.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: l.opacity }}
            >
              <span
                className="text-center px-1 font-bold leading-tight tracking-tight whitespace-pre-wrap"
                style={{
                  color: l.textColor || "#ffffff",
                  fontSize: `${l.fontSize || 14}px`,
                }}
              >
                {l.text}
              </span>
            </div>
          );
        }

        // image / icon layer
        if (!l.source) return null;
        return (
          <div
            key={l.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: l.opacity }}
          >
            <KeyImage
              src={l.source}
              className={
                l.type === "icon"
                  ? "w-10 h-10 object-contain drop-shadow-md"
                  : "w-full h-full object-contain"
              }
            />
          </div>
        );
      })}
    </div>
  );
}
