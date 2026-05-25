import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import AIPlatformSection from "@/components/AIPlatformSection";
import FlowWalkthrough from "@/components/FlowWalkthrough";
import FeaturesSection from "@/components/FeaturesSection";
import { CommunityMarquee } from "@/components/CommunityMarquee";
import CTASection from "@/components/CTASection";
import { useSeo } from "@/lib/seo";

export default function Index() {
  useSeo({
    title: "Launch treasury tools for your chama, SACCO, or co-op",
    description:
      "Baraza is a phone-first treasury and governance platform for chamas, SACCOs, welfare groups, and co-operatives. Collect M-Pesa dues in KES, submit proposals, vote, and manage shared funds.",
    path: "/",
  });

  return (
    <Layout>
      <HeroSection />
      <AIPlatformSection />
      <FlowWalkthrough />
      <CommunityMarquee />
      <FeaturesSection />
      <CTASection />
    </Layout>
  );
}
