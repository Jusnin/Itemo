import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/** Empty screens are the first thing a new viewer sees — they have to look
 *  designed rather than broken (docs/TODO.md T4.4). */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Icon size={24} strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-1 max-w-[16rem] text-sm text-ink-soft">{body}</p>
      {action && (
        <Link
          href={action.href}
          className="tap mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
