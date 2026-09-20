import { lazy, Suspense, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import { useAccount } from "@/contexts/AccountContext";
import { useSeo } from "@/lib/seo";

// Everything under the hero shares one chunk and arrives after first paint.
// The fallback keeps the footer below the fold so nothing visible shifts.
const BelowTheFold = lazy(() => import("@/components/landing/BelowTheFold"));

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
      <Suspense fallback={<div className="min-h-screen" aria-hidden />}>
        <BelowTheFold />
      </Suspense>
    </Layout>
  );
}
