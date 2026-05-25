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
    title: "Launch a chama DAO for your chama, SACCO, or co-op",
    description:
      "Baraza is a phone-first treasury and governance platform for chamas, SACCOs, welfare groups, and co-operatives. Collect M-Pesa dues, submit proposals, vote, and manage shared funds on Solana.",
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
