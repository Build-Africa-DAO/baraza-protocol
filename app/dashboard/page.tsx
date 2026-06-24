import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashibodi · Baraza",
};

// Placeholder — receives the post-login redirect so it doesn't 404.
// The full member dashboard is built next session (BARAZA_USER_FLOW_SPEC.md
// Phase 4), including the auth guard that redirects unauthenticated users.
// The locale-aware body lives in DashboardClient to keep this Server
// Component eligible for `metadata` export (Next.js App Router rule).
export default function Dashboard() {
  return <DashboardClient />;
}
