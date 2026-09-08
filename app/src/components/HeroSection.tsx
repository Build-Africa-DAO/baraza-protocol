import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PolaroidGallery from "@/components/PolaroidGallery";
import LogoMarquee from "@/components/LogoMarquee";

const steps = [
  {
    title: "Collect Dues",
    detail: "Members pay with M-Pesa. The group page shows who has paid this month.",
    image: "/steps/collect-dues.jpg",
    imageFirst: true,
  },
  {
    title: "Vote First",
    detail: "Spending waits for a vote. The treasurer cannot send the money alone.",
    image: "/steps/vote-first.jpg",
    imageFirst: false,
  },
  {
    title: "Send After the Vote",
    detail: "When the vote passes, an officer sends the payout. The receipt stays on the group page.",
    image: "/steps/release-by-rule.jpg",
    imageFirst: true,
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-x-clip bg-background pt-10 pb-0 sm:pt-16 lg:pt-20">
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

        <div className="mt-16">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            How a Group Runs
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => {
              const visual = (
                <div className="relative min-h-[18rem] flex-1 overflow-hidden">
                  <img
                    src={step.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>
              );

              return (
                <article
                  key={step.title}
                  className="group flex min-h-[36rem] flex-col overflow-hidden rounded-xl bg-primary text-left text-primary-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
                >
                  {step.imageFirst && visual}
                  <div className="p-6">
                    <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                      0{index + 1}. {step.title}
                    </h2>
                    <p className="mt-3 max-w-prose text-sm leading-6 opacity-85 sm:text-base sm:leading-7">{step.detail}</p>
                  </div>
                  {!step.imageFirst && visual}
                </article>
              );
            })}
          </div>
        </div>

        <LogoMarquee />
      </div>
    </section>
  );
}
