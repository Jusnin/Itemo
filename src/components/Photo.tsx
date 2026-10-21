import { Package } from "lucide-react";
import { photoUrl } from "@/lib/format";

/** Photos are the product's whole personality, so the fallback has to look
 *  intentional rather than broken. */
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
  const src = photoUrl(photoId);

  if (!src) {
    return (
      <div
        className={`grid place-items-center bg-canvas text-ink-faint ${className}`}
        aria-label={alt}
        role="img"
      >
        <Package size={iconSize} strokeWidth={1.5} />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- local files, no loader needed
  return <img src={src} alt={alt} className={`object-cover bg-canvas ${className}`} />;
}
