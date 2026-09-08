import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toTitleCase } from "@/lib/utils";

export default function CTASection() {
  return (
    <section className="relative z-10 w-full py-8 sm:py-10 lg:py-12">
      <div className="page-shell">
        <div className="audience-band relative overflow-hidden rounded-[2rem] bg-primary text-foreground lg:rounded-[2.75rem]">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                Your group
              </p>
              <h2 className="mt-4 max-w-xl font-display text-3xl font-black leading-tight md:text-5xl">
                {toTitleCase("Move the Books Off WhatsApp")}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 opacity-85 sm:text-base sm:leading-8">
                Name the group, set the dues, and send a link. Members pay with M-Pesa
                and open the same record on their phone.
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
              <div className="absolute bottom-[-1.25rem] left-1/2 w-[12.75rem] -translate-x-1/2 sm:w-[15rem] lg:left-auto lg:right-[-1.35rem] lg:w-[16.75rem] lg:translate-x-0">
                <div className="rounded-[2.4rem] bg-foreground p-[0.55rem] shadow-[0_24px_50px_hsl(0_0%_0%/0.28)]">
                  <div className="relative overflow-hidden rounded-[1.85rem] bg-background">
                    <span className="absolute left-1/2 top-2 z-10 h-[1.15rem] w-[5.4rem] -translate-x-1/2 rounded-full bg-foreground" />
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
