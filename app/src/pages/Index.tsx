import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import { CommunityMarquee } from "@/components/CommunityMarquee";
import CTASection from "@/components/CTASection";

export default function Index() {
  return (
    <Layout>
      <HeroSection />
      <CommunityMarquee />
      <FeaturesSection />
      <CTASection />
    </Layout>
  );
}
