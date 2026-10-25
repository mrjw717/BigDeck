import React from "react";
import { resolveAssetUrl } from "../utils/assets";

interface KeyImageProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function KeyImage({
  src,
  alt = "",
  className = "",
  style,
}: KeyImageProps) {
  if (!src || src.trim() === "") return null;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).style.display = "none";
  };

  return (
    <img
      src={resolveAssetUrl(src)}
      alt={alt}
      className={className}
      onError={handleError}
      style={{ display: "block", userSelect: "none", ...style }}
      draggable={false}
    />
  );
}
