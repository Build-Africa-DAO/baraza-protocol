import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DAO_CREATION_FEE_KES,
  PAYBILL_ADDON_FEE_KES,
  USSD_ADDON_FEE_KES,
} from "@/lib/constants";
import { Reveal, REVEAL_STAGGER } from "@/components/landing/motion";
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

function GlowCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const reactId = useId();
  const filterId = `paybill-outline-${reactId.replace(/:/g, "")}`;
  const [size, setSize] = useState({ w: 0, h: 0 });

  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const speed = useTransform(velocity, (value) => Math.min(1, Math.abs(value) / 420));
  const glow = useSpring(speed, { stiffness: 140, damping: 22, mass: 0.4 });
  const lineOpacity = useTransform(glow, [0, 1], [0.55, 1]);
  const strokeWidth = useTransform(glow, [0, 1], [2, 3.25]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const inset = 1.5;
  const radius = 16;
  const width = Math.max(0, size.w - inset * 2);
  const height = Math.max(0, size.h - inset * 2);

  return (
    <article ref={ref} className={cn("relative", className)}>
      {!reduce && size.w > 0 && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${size.w} ${size.h}`}
          fill="none"
        >
          <defs>
            <filter id={filterId} x="-50%" y="-40%" width="200%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.rect
            x={inset}
            y={inset}
            width={width}
            height={height}
            rx={radius}
            stroke="hsl(var(--primary))"
            filter={`url(#${filterId})`}
            style={{ opacity: lineOpacity, strokeWidth }}
          />
        </svg>
      )}
      {children}
    </article>
  );
}

function PlanBody({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <>
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
    </>
  );
}

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 py-12 lg:py-[3.75rem]">
      <div className="page-shell">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Pricing
          </p>
        </Reveal>
        <Reveal delay={REVEAL_STAGGER}>
          <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-3xl font-black leading-tight text-foreground md:text-4xl">
            {toTitleCase("What it costs to start a group")}
          </h2>
        </Reveal>
        <Reveal delay={REVEAL_STAGGER * 2}>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-muted-foreground sm:text-base">
            One setup charge when you open the group. Member dues are set by you, including nothing.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-10 px-2 sm:px-4 lg:grid-cols-3 lg:items-center lg:gap-12">
          {plans.map((plan, index) => {
            const cardClass = cn(
              "relative flex h-full flex-col rounded-2xl border p-5 shadow-[0_14px_32px_hsl(0_0%_0%/0.08)] dark:shadow-[0_14px_32px_hsl(0_0%_0%/0.35)] sm:p-6",
              plan.featured
                ? "border-primary bg-gradient-to-b from-primary/15 via-card to-card lg:scale-[1.08] lg:px-7 lg:py-10"
                : "border-border bg-card",
            );

            return (
              <Reveal key={plan.name} delay={index * REVEAL_STAGGER} className="h-full">
                {plan.featured ? (
                  <GlowCard className={cardClass}>
                    <PlanBody plan={plan} />
                  </GlowCard>
                ) : (
                  <article className={cardClass}>
                    <PlanBody plan={plan} />
                  </article>
                )}
              </Reveal>
            );
          })}
        </div>

        <Reveal>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-6 text-muted-foreground">
          Member dues go to the group. Baraza takes 2% on inbound dues. Payouts have no platform fee.
          You can pass a 0.5% mobile-money carrier cost to members, or absorb it.
        </p>
        </Reveal>
      </div>
    </section>
  );
}
