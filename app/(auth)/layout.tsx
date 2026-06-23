import type { ReactNode } from "react";

/**
 * Auth shell — editorial split. A deep, warm "assembly" brand panel sits
 * beside the functional form. On mobile the panel collapses to a compact band
 * above the form. The concentric rings evoke a baraza: people gathered to
 * decide together.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col md:grid md:grid-cols-[clamp(18rem,38%,30rem)_1fr]">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-[#1c1714] px-6 py-8 text-[#f5f3ef] md:flex md:flex-col md:justify-between md:px-12 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-[26rem] w-[26rem] rounded-full opacity-[0.14] md:-right-20 md:top-auto md:-bottom-28"
          style={{
            background:
              "repeating-radial-gradient(circle, #f97316 0 2px, transparent 2px 28px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 font-mono text-lg font-bold text-white">
            B
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.2em]">
            Baraza
          </span>
        </div>

        <div className="relative mt-6 md:mt-0">
          <h2 className="max-w-sm font-mono text-2xl font-bold leading-tight md:text-4xl">
            Where your community decides together.
          </h2>
          <p className="mt-3 max-w-xs text-sm text-[#f5f3ef]/70">
            Your people, your fund, your decisions — all in one place.
          </p>
        </div>
      </aside>

      {/* Form column */}
      <main className="flex flex-1 items-center justify-center bg-[#f5f3ef] px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
