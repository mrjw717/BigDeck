import React from "react";

interface KeyImageProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Resolve an asset reference to a URL the renderer can stream directly.
 * bigdeck-asset:// is handled by the main process with streaming + MIME
 * sniffing, so animated GIF/WebP play natively without IPC base64 roundtrips.
 */
function resolveAssetUrl(src: string): string {
  if (
    src.startsWith("bigdeck-asset://") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }
  // Absolute filesystem path (drag-dropped external file) — route through the
  // asset protocol, which serves absolute paths as-is.
  if (src.startsWith("/")) {
    return `bigdeck-asset://${encodeURIComponent(src)}`;
  }
  return src;
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
