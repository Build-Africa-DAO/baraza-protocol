import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DAO_CREATION_FEE_KES,
  PAYBILL_ADDON_FEE_KES,
  USSD_ADDON_FEE_KES,
} from "@/lib/constants";
import { toTitleCase, cn } from "@/lib/utils";

function formatLaunchKes(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

const launchKes = DAO_CREATION_FEE_KES;
const paybillKes = DAO_CREATION_FEE_KES + PAYBILL_ADDON_FEE_KES;
const ussdKes = DAO_CREATION_FEE_KES + PAYBILL_ADDON_FEE_KES + USSD_ADDON_FEE_KES;

const plans = [
  {
    name: toTitleCase("Launch"),
    description: "Open a chama, SACCO, or cooperative. Members pay on a prompt if you set dues.",
    priceKes: launchKes,
    cta: "Start a Group",
    featured: false,
    features: [
      "Group page every member can open",
      "Set monthly dues, a one-time fee, or nothing",
      "Votes before money leaves",
      "Receipts stay on the group page",
    ],
  },
  {
    name: toTitleCase("Paybill"),
    description: "Same launch, plus a dedicated M-Pesa Paybill so members do not share a personal number.",
    priceKes: paybillKes,
    cta: "Start with Paybill",
    featured: true,
    features: [
      "Everything in Launch",
      "Dedicated 6-digit Safaricom Paybill",
      "Members pay dues without a personal number",
      "Paybill shows on the group dashboard after launch",
    ],
  },
  {
    name: toTitleCase("Feature Phone"),
    description: "Paybill plus a USSD shortcode for members who vote and pay without a smartphone.",
    priceKes: ussdKes,
    cta: "Start with USSD",
    featured: false,
    features: [
      "Everything in Paybill",
      "Dedicated USSD shortcode",
      "Feature-phone members can check, vote, and pay",
      "Shortcode shows on the group dashboard after launch",
    ],
  },
] as const;

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 py-12 lg:py-[3.75rem]">
      <div className="page-shell">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Pricing
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-3xl font-black leading-tight text-foreground md:text-4xl">
          {toTitleCase("What it costs to start a group")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-muted-foreground sm:text-base">
          One setup charge when you open the group. Member dues are set by you, including nothing.
        </p>

        <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-10 px-2 sm:px-4 lg:grid-cols-3 lg:items-center lg:gap-12">
          {plans.map((plan) => {
            return (
              <article
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-5 shadow-[0_14px_32px_hsl(0_0%_0%/0.08)] dark:shadow-[0_14px_32px_hsl(0_0%_0%/0.35)] sm:p-6",
                  plan.featured
                    ? "border-primary bg-gradient-to-b from-primary/15 via-card to-card lg:scale-[1.03] lg:p-7"
                    : "border-border",
                )}
              >
                {plan.featured && (
                  <span className="absolute right-4 top-4 rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background">
                    Most Popular
                  </span>
                )}

                <h3 className={cn("font-display text-2xl font-black text-foreground", plan.featured && "pr-24")}>
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>

                <p className="mt-5 flex items-end gap-2">
                  <span className="font-display text-4xl font-black tracking-tight text-foreground tabular-nums">
                    {formatLaunchKes(plan.priceKes)}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">once</span>
                </p>

                <Button asChild size="lg" variant={plan.featured ? "default" : "outline"} className="mt-5 w-full">
                  <Link to="/create/purpose">{plan.cta}</Link>
                </Button>

                <ul className="mt-6 flex flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-6 text-muted-foreground">
          Member dues go to the group. Baraza takes 2% on inbound dues. Payouts have no platform fee.
          You can pass a 0.5% mobile-money carrier cost to members, or absorb it.
        </p>
      </div>
    </section>
  );
}
