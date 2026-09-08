import { Link } from "react-router-dom";
import { CircleDollarSign, Eye, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CircleDollarSign,
    title: "Who Has Paid",
    tilt: "group-hover:rotate-12",
    description:
      "Set the monthly amount. Members pay on their phone. The paid list lives on the group page, so you are not chasing people in WhatsApp.",
  },
  {
    icon: Vote,
    title: "Before Money Leaves",
    tilt: "group-hover:-rotate-[14deg]",
    description:
      "To spend, someone writes a proposal. Members vote. If the vote does not pass, the money stays put.",
  },
  {
    icon: Eye,
    title: "Where It Went",
    tilt: "group-hover:rotate-[10deg]",
    description:
      "Payments and payouts sit on one list. If someone asks about last month, you open the group page instead of digging through a chat.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="scroll-mt-20 pt-14 pb-36 lg:pb-48" id="features">
      <div className="page-shell">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What you get
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-black leading-tight text-foreground md:text-4xl">
          The Same Numbers for Every Member
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="group">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-xl font-bold text-foreground">{feature.title}</h3>
                  <Icon
                    className={`h-10 w-10 shrink-0 text-primary origin-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 ${feature.tilt} motion-reduce:transition-none motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100`}
                    strokeWidth={1.6}
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg">
            <Link to="/#how-it-works">How It Works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
