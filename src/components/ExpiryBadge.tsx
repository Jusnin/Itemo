import type { ExpiryStatus } from "@/lib/format";

const TONE = {
  expired: "bg-danger-soft text-danger",
  soon: "bg-warn-soft text-warn",
  ok: "bg-canvas text-ink-soft",
} as const;

export function ExpiryBadge({ status }: { status: ExpiryStatus | null }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE[status.tone]}`}>
      {status.label}
    </span>
  );
}
