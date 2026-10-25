import React, { useEffect, useState } from "react";
import { resolveAssetUrl } from "../utils/assets";

interface AssetImageProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}

export function AssetImage({
  src,
  alt = "",
  className = "",
  style,
  fallback,
}: AssetImageProps) {
  const [error, setError] = useState(false);

  // Reset error state when the source changes
  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || src.trim() === "" || error) {
    if (fallback) return <>{fallback}</>;
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 ${className}`}
        style={style}
      >
        <span className="text-[8px] text-muted-foreground/50">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={resolveAssetUrl(src)}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
      draggable={false}
    />
  );
}
