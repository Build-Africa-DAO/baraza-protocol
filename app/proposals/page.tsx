import { notFound } from "next/navigation";
import ProposalsClient from "./ProposalsClient";
import { DESIGN_ONLY, noindex } from "@/app/lib/design-only";

export const metadata = {
  title: "Proposals · Baraza",
  ...noindex,
};

// DESIGN-ONLY mode: the page renders from local mock fixtures via the client
// component (votes are in-memory). It 404s unless DESIGN_ONLY is explicitly
// enabled, so the mock data can never surface on a public domain. When the
// backend returns, this server component is where the real data fetch lives.
export default function ProposalsPage() {
  if (!DESIGN_ONLY) notFound();
  return <ProposalsClient />;
}
