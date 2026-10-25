import React from "react";
import { KeyImage } from "./KeyImage";
import type { KeyLayer } from "../../shared/types";

/**
 * Renders key layers as ONE z-ordered stack, matching the hardware composite
 * exactly: visible layers sorted ascending by `order`; later layers paint on
 * top. ALL layer types (including background) participate in the same stack —
 * grouping by type would scramble the z-order the hardware respects.
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
