import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toTitleCase } from "@/lib/utils";

export default function CTASection() {
  return (
    <section className="relative z-10 w-full py-12 lg:py-[3.75rem]">
      <div className="page-shell">
        <div className="audience-band relative overflow-hidden rounded-[2rem] bg-primary text-foreground lg:rounded-[2.75rem]">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                Your group
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-black leading-tight md:text-5xl">
                {toTitleCase("Move the Books Off WhatsApp")}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 opacity-85 sm:text-base sm:leading-8">
                Name the group, set the dues, and send a link. Members pay with M-Pesa
                and open the same record on their phone. If someone asks where last month
                went, you open the group page instead of digging through a chat. Money
                leaves after a vote, and the receipt stays where everyone can see it.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link to="/create/purpose">
                    Start a Group
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/#faq">Read the FAQ</Link>
                </Button>
              </div>
            </div>

            <div className="relative min-h-[20rem] overflow-hidden sm:min-h-[24rem] lg:min-h-[28rem]">
              <div className="absolute left-1/2 top-[18%] w-[20rem] -translate-x-1/2 sm:w-[22rem] lg:top-[16%] lg:w-[88%] lg:max-w-[26rem]">
                <div className="rounded-[2.6rem] bg-foreground p-[0.65rem] shadow-[0_24px_50px_hsl(0_0%_0%/0.28)]">
                  <div className="relative overflow-hidden rounded-[2rem] bg-background">
                    <span className="absolute left-1/2 top-2.5 z-10 h-[1.25rem] w-[6.25rem] -translate-x-1/2 rounded-full bg-foreground" />
                    <img
                      src="/gallery/gallery-vote.jpg"
                      alt="Two members checking a vote on a phone"
                      width={720}
                      height={900}
                      className="aspect-[9/17] w-full object-cover object-[center_20%]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
