"use client";

import { useState } from "react";

// Image with graceful degradation: if the brand asset file has not been added
// to public/ yet, the element hides itself instead of showing a broken icon,
// so the surrounding CSS-composed layout still looks intentional.
export function SafeImage({
  src,
  alt,
  className,
  style,
  eager,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
}) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={eager ? "eager" : "lazy"}
      onError={() => setMissing(true)}
    />
  );
}
