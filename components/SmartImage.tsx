"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { canResize, imageLoader } from "@/lib/imageLoader";
import { PLACEHOLDER_IMAGE } from "@/types";

// next/image + манай loader (lib/imageLoader.ts): хэмжээг өөрчилж болох зурагт srcset, бусдад энгийн зураг.
// Аль ч тохиолдолд lazy loading, async decoding нь next/image-ээс ирнэ. remotePatterns хэрэггүй —
// Next.js-ийн өөрийн боловсруулагчийг ашиглахгүй.
// Зураг ачаалагдахгүй бол (устгагдсан холбоос гэх мэт) ерөнхий зургаар солино — хоосон карт үлдэхгүй.
export default function SmartImage({
  src,
  alt,
  onError,
  ...props
}: Omit<ImageProps, "src" | "alt" | "loader"> & { src: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // src өөрчлөгдвөл (өөр газар) дахин оролдоно.
  const shown = failedSrc === src && src !== PLACEHOLDER_IMAGE ? PLACEHOLDER_IMAGE : src;
  const resizable = canResize(shown);
  return (
    <Image
      src={shown}
      alt={alt}
      loader={resizable ? imageLoader : undefined}
      unoptimized={!resizable}
      onError={(event) => {
        setFailedSrc(src);
        onError?.(event);
      }}
      {...props}
    />
  );
}
