export const metadata = {
  title: "Dashboard · Baraza",
};

// Placeholder — receives the post-login redirect so it doesn't 404.
// The full member dashboard is built next session (BARAZA_USER_FLOW_SPEC.md
// Phase 4), including the auth guard that redirects unauthenticated users.
export default function Dashboard() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f5f3ef] px-6 text-center text-[#1a1a1a]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 font-mono text-lg font-bold text-white">
        B
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight">
        Welcome to Baraza
      </h1>
      <p className="mt-2 text-sm text-black/60">Your dashboard is coming.</p>
    </main>
  );
}
