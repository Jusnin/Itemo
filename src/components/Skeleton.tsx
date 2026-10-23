/** Placeholder rows while IndexedDB resolves — avoids flashing an empty state. */
export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="animate-pulse divide-y divide-line rounded-card border border-line" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 p-3">
          <span className="h-12 w-12 shrink-0 rounded-lg bg-canvas" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-1/2 rounded bg-canvas" />
            <span className="block h-2.5 w-1/4 rounded bg-canvas" />
          </span>
        </li>
      ))}
    </ul>
  );
}
