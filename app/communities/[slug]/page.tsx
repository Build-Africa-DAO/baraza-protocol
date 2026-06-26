import { notFound } from "next/navigation";
import { COMMUNITIES, getCommunityBySlug } from "@/app/lib/mock/communities";
import { DESIGN_ONLY, noindex } from "@/app/lib/design-only";
import CommunityDashboardClient from "./CommunityDashboardClient";

// DESIGN-ONLY mode: the dashboard renders from local mock fixtures. This Server
// Component resolves the [slug] segment to a community (404 if unknown) and
// hands the id to the client, where the GSAP-animated view lives. The whole
// route 404s unless DESIGN_ONLY is explicitly enabled, so the mock data can
// never surface on a public domain. When the backend returns, the real
// community + aggregate queries land here as props.

export function generateStaticParams() {
  // Prebuild nothing unless DESIGN_ONLY is on — keeps mock slugs out of prod.
  if (!DESIGN_ONLY) return [];
  return Object.values(COMMUNITIES).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = getCommunityBySlug(slug);
  return {
    title: community ? `${community.name} · Baraza` : "Community · Baraza",
    ...noindex,
  };
}

export default async function CommunityDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!DESIGN_ONLY) notFound();

  const { slug } = await params;
  const community = getCommunityBySlug(slug);
  if (!community) notFound();

  return <CommunityDashboardClient communityId={community.id} />;
}
