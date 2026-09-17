import FeaturesSection from "@/components/FeaturesSection";
import AIPlatformSection from "@/components/AIPlatformSection";
import FlowWalkthrough from "@/components/FlowWalkthrough";
import FaqSection from "@/components/FaqSection";
import PricingSection from "@/components/PricingSection";
import ContactSection from "@/components/ContactSection";
import CTASection from "@/components/CTASection";

/** The landing page below the hero, loaded as one chunk after first paint. */
export default function BelowTheFold() {
  return (
    <>
      <FeaturesSection />
      <FlowWalkthrough />
      <AIPlatformSection />
      <PricingSection />
      <FaqSection />
      <ContactSection />
      <CTASection />
    </>
  );
}
