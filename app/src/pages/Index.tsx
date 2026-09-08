import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AIPlatformSection from "@/components/AIPlatformSection";
import FlowWalkthrough from "@/components/FlowWalkthrough";
import FaqSection from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";
import CTASection from "@/components/CTASection";
import { useAccount } from "@/contexts/AccountContext";
import { useSeo } from "@/lib/seo";

export default function Index() {
  useSeo({
    title: "Group money for chamas, SACCOs, and cooperatives",
    description:
      "Baraza is for savings groups that already collect dues and decide together. Members sign in with a phone number and pay on M-Pesa.",
    path: "/",
  });

  const account = useAccount();
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (!id) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  if (account.ready && account.authenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <AIPlatformSection />
      <FlowWalkthrough />
      <FaqSection />
      <ContactSection />
      <CTASection />
    </Layout>
  );
}
