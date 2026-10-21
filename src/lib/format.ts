import type { StockItem } from "./types";

export function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 864e5);
}

export type ExpiryTone = "expired" | "soon" | "ok";

export interface ExpiryStatus {
  tone: ExpiryTone;
  label: string;
}

/** Null when there is nothing worth flagging — keeps the UI quiet by default. */
export function expiryStatus(item: Pick<StockItem, "nextExpiry">): ExpiryStatus | null {
  if (!item.nextExpiry) return null;
  const days = daysUntil(item.nextExpiry);
  if (days < 0) return { tone: "expired", label: "Expired" };
  if (days === 0) return { tone: "soon", label: "Expires today" };
  if (days <= 7) return { tone: "soon", label: `${days}d left` };
  return { tone: "ok", label: formatDate(item.nextExpiry) };
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatShort(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function photoUrl(photoId: string | null): string | null {
  return photoId ? `/api/photo/${photoId}` : null;
}
