import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AIPlatformSection from "@/components/AIPlatformSection";
import FlowWalkthrough from "@/components/FlowWalkthrough";
import FaqSection from "@/components/FaqSection";
import CTASection from "@/components/CTASection";
import { useAccount } from "@/contexts/AccountContext";
import { useSeo } from "@/lib/seo";

export default function Index() {
  useSeo({
    title: "Group money for chamas, SACCOs, and cooperatives",
    description:
      "Baraza helps savings groups collect dues, vote on spending, and release funds with a shared record. Join with a phone number — no seed phrases.",
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
      <CTASection />
    </Layout>
  );
}
