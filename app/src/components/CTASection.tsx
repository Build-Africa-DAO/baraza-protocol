import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toTitleCase } from "@/lib/utils";

export default function CTASection() {
  return (
    <section className="audience-band relative z-10 w-full bg-primary text-foreground">
      <div className="page-shell">
        <div className="grid items-end gap-10 pb-12 pt-6 sm:pb-16 sm:pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14 lg:pb-20 lg:pt-8">
          <figure className="relative z-10 mx-auto -mt-20 mb-6 w-[min(100%,36rem)] origin-bottom rotate-[5deg] bg-white p-3 shadow-[0_18px_40px_hsl(0_0%_0%/0.22)] sm:-mt-28 sm:mb-8 sm:w-[min(100%,40rem)] sm:p-4 lg:order-2 lg:mb-0 lg:-mt-40 lg:w-[min(100%,42rem)] lg:justify-self-end">
            <img
              src="/cta/group.jpg"
              alt="Illustrated chama collecting dues and inspecting a shared record together"
              width={1024}
              height={768}
              className="aspect-[4/3] w-full object-cover"
            />
          </figure>

          <div className="pb-2 text-center lg:order-1 lg:pb-6 lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
              Start the group
            </p>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight md:text-5xl">
              {toTitleCase("Put the Next Contribution Where Every Member Can See It.")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 opacity-85 sm:text-base lg:mx-0">
              Launch a chama, SACCO, or cooperative in minutes. Members join with a phone number and
              pay into a record they can inspect.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg">
                <Link to="/create/purpose">
                  Launch a Group
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/communities">Browse Groups</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
