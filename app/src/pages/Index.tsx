import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import AIPlatformSection from "@/components/AIPlatformSection";
import FlowWalkthrough from "@/components/FlowWalkthrough";
import ShowReelSection from "@/components/ShowReelSection";
import FeaturesSection from "@/components/FeaturesSection";
import { CommunityMarquee } from "@/components/CommunityMarquee";
import CTASection from "@/components/CTASection";
import { useSeo } from "@/lib/seo";

export default function Index() {
  useSeo({
    title: "Launch treasury tools for your DAO",
    description:
      "Baraza is a phone-first treasury and governance platform for DAOs and communities. Collect M-Pesa dues in KES, submit proposals, vote, and manage shared funds.",
    path: "/",
  });

  return (
    <Layout>
      <HeroSection />
      <AIPlatformSection />
      <FlowWalkthrough />
      <ShowReelSection />
      <CommunityMarquee />
      <FeaturesSection />
      <CTASection />
    </Layout>
  );
}
