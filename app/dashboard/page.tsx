import { t } from "@/app/lib/i18n";

export const metadata = {
  title: "Dashibodi · Baraza",
};

// Placeholder — receives the post-login redirect so it doesn't 404.
// The full member dashboard is built next session (BARAZA_USER_FLOW_SPEC.md
// Phase 4), including the auth guard that redirects unauthenticated users.
export default function Dashboard() {
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
