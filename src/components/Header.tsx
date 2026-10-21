import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function Header({ title, back = "/", action }: { title: string; back?: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-1 border-b border-line bg-surface/95 px-2 py-3 backdrop-blur">
      <Link
        href={back}
        className="tap -ml-1 grid h-9 w-9 place-items-center rounded-full text-ink-soft active:bg-canvas"
        aria-label="Back"
      >
        <ChevronLeft size={22} />
      </Link>
      <h1 className="flex-1 text-base font-semibold">{title}</h1>
      {action}
    </header>
  );
}
