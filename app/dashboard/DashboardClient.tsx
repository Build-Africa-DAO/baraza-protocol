"use client";

import { useT } from "@/app/lib/LocaleContext";

/**
 * Client shell for the dashboard placeholder.
 * Separated from dashboard/page.tsx so the Server Component wrapper can
 * keep its `metadata` export (Next.js App Router disallows metadata in
 * "use client" modules). This component is trivially simple today; it
 * will grow as Phase 4 (BARAZA_USER_FLOW_SPEC.md) lands.
 */
export default function DashboardClient() {
  const t = useT();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-baraza-black px-6 text-center text-baraza-white">
      <span className="relative inline-grid h-12 w-12 place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-baraza-lime/30" />
        <span className="absolute inset-[7px] rounded-full border-2 border-baraza-teal/50" />
        <span className="absolute inset-[14px] rounded-full bg-baraza-lime" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-[-0.02em]">
        {t("dashboard.welcome")}
      </h1>
      <p className="mt-2 text-sm text-baraza-muted">{t("dashboard.coming")}</p>
    </main>
  );
}
