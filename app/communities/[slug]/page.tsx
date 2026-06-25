import { notFound } from "next/navigation";
import { COMMUNITIES, getCommunityBySlug } from "@/app/lib/mock/communities";
import CommunityDashboardClient from "./CommunityDashboardClient";

// DESIGN-ONLY mode: the dashboard renders from local mock fixtures. This Server
// Component resolves the [slug] segment to a community (404 if unknown) and
// hands the id to the client, where the GSAP-animated view lives. When the
// backend returns, the real community + aggregate queries land here as props.

export function generateStaticParams() {
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
  };
}

export default async function CommunityDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = getCommunityBySlug(slug);
  if (!community) notFound();

  return <CommunityDashboardClient communityId={community.id} />;
}
