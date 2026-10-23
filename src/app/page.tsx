"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

const EXIT_MS = 380;

export default function WelcomePage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  // The next screen is static — prefetching makes the transition land on a
  // ready page rather than a blank one.
  useEffect(() => {
    router.prefetch("/home");
  }, [router]);

  function enter(event: React.MouseEvent) {
    event.preventDefault();
    if (leaving) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return router.push("/home");

    setLeaving(true);
    window.setTimeout(() => router.push("/home"), EXIT_MS);
  }

  return (
    <main className="flex min-h-dvh flex-col overflow-hidden bg-surface">
      <div
        className={`relative flex flex-1 items-center justify-center px-6 pt-10 ${
          leaving ? "leaving-art" : "enter"
        }`}
      >
        <div className="relative w-full max-w-[20rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/brand/folder.png")} alt="" className="w-full" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/brand/logo-light.png")}
            alt="ITEMO!"
            className="absolute left-[61%] top-[52%] w-[52%] -translate-x-1/2 -translate-y-1/2"
          />
        </div>
      </div>

      <section
        className={`welcome-panel bg-canvas px-8 pb-10 pt-12 text-center ${
          leaving ? "leaving-panel" : "enter"
        }`}
      >
        <h1 className="text-[2rem] font-extrabold uppercase tracking-tight text-ink">Welcome</h1>
        <p className="mt-1.5 text-[0.8125rem] font-medium italic text-ink-faint">
          Know what you own, buy only what you need
        </p>

        <div className="mx-auto mt-7 max-w-[17rem] space-y-3">
          <a
            href="/home"
            onClick={enter}
            className="tap block rounded-full bg-accent py-3.5 font-semibold text-white"
          >
            Login
          </a>
          <a
            href="/home"
            onClick={enter}
            className="tap block rounded-full border border-ink bg-surface py-3.5 font-semibold text-ink"
          >
            Sign Up
          </a>
        </div>

        <p className="mt-6 text-xs text-ink-faint">Demo mode — no account needed.</p>
      </section>
    </main>
  );
}
