import type { ReactNode } from "react";

/**
 * Auth shell — editorial split on the Baraza dark system. A warm brand panel
 * with the concentric-ring assembly motif sits beside the form. The panel is
 * desktop-only; on mobile the form stands alone (the card carries its own mark).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-baraza-black md:grid md:grid-cols-[clamp(18rem,38%,30rem)_1fr]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-baraza-surface px-12 py-16 text-baraza-white md:flex md:flex-col md:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -bottom-28 h-[26rem] w-[26rem] rounded-full opacity-[0.12]"
          style={{
            background:
              "repeating-radial-gradient(circle, #c8f060 0 2px, transparent 2px 28px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <RingMark />
          <span className="font-display text-sm font-bold uppercase tracking-[0.2em]">
            Baraza
          </span>
        </div>

        <div className="relative">
          <h2 className="max-w-sm font-display text-4xl font-bold leading-[1.1] tracking-[-0.02em]">
            Every great community starts with one decision.
          </h2>
          <p className="mt-4 max-w-xs text-sm text-baraza-muted">
            Your people, your fund, your decisions — all in one place.
          </p>
        </div>
      </aside>

      {/* Form column */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

/** Concentric-ring logo mark (community assembly motif). */
function RingMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`relative inline-grid place-items-center ${className}`}>
      <span className="absolute inset-0 rounded-full border-2 border-baraza-lime/30" />
      <span className="absolute inset-[6px] rounded-full border-2 border-baraza-teal/50" />
      <span className="absolute inset-[12px] rounded-full bg-baraza-lime" />
    </span>
  );
}
