"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { photoUrl } from "@/lib/store";

/** Photos live as blobs in IndexedDB, so the src resolves asynchronously. */
export function Photo({
  photoId,
  alt,
  className = "",
  iconSize = 22,
}: {
  photoId: string | null;
  alt: string;
  className?: string;
  iconSize?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void photoUrl(photoId).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [photoId]);

  if (!src) {
    return (
      <div className={`grid place-items-center bg-canvas text-ink-faint ${className}`} role="img" aria-label={alt}>
        <Package size={iconSize} strokeWidth={1.5} />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- blob URL, no loader applies
  return <img src={src} alt={alt} className={`object-cover bg-canvas ${className}`} />;
}
