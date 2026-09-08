import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PolaroidGallery from "@/components/PolaroidGallery";

export default function HeroSection() {
  return (
    <section id="home" className="relative overflow-x-clip scroll-mt-20 bg-background pt-10 pb-16 sm:pt-16 sm:pb-20 lg:pt-20">
      <div className="page-shell">
        <div className="mx-auto max-w-3xl text-center xl:max-w-5xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            For chamas, SACCOs, and cooperatives
          </p>
          <h1 className="font-display text-[clamp(2.4rem,5.2vw,5.25rem)] font-black leading-[0.94] tracking-tight text-foreground">
            Run the Chama Where Every Member Can See the Money.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Put the monthly collection on a page the whole group can open.
            Members sign in with a phone number.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/create/purpose">
                Start a Group
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/communities">Browse Groups</Link>
            </Button>
          </div>
        </div>

        <PolaroidGallery />
      </div>
    </section>
  );
}
