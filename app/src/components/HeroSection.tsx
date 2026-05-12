import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Users,
  Vote,
  Wallet,
} from "lucide-react";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Sample groups modeled", value: "180+" },
  { label: "Sample member records", value: "2.4K+" },
  { label: "Sample funds visible", value: "KSh 12M+" },
];

const contributions = [
  { name: "Mary Wanjiku", detail: "paid monthly dues", amount: "KSh 2,500" },
  { name: "Otieno Family Trust", detail: "paid welfare top-up", amount: "KSh 5,000" },
  { name: "Karanja", detail: "added receipt", amount: "Verified" },
];

const timeline = ["Proposal created", "Member review", "Voting live", "Execution pending"];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

function ProductDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-4 rounded-[1.25rem] border border-primary/10 bg-primary/[0.03]" />
      <div className="relative overflow-hidden rounded-2xl border border-primary/18 bg-[#392F5A]/95 shadow-[0_28px_90px_hsl(254_31%_8%/0.72)]">
        <div className="flex items-center justify-between border-b border-primary/12 bg-[#31284e] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
              <Landmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Umoja Welfare Group</p>
              <p className="text-xs text-muted-foreground">128 members</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary sm:flex">
            <Wallet className="h-3.5 w-3.5" />
            Wallet connected
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="col-span-2 rounded-xl border border-accent/18 bg-accent/8 p-4 sm:col-span-1">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
                <CircleDollarSign className="h-3.5 w-3.5" />
                Community fund
              </div>
              <p className="font-display text-2xl font-bold leading-none text-foreground">KSh 1,248,500</p>
              <p className="mt-2 text-xs text-muted-foreground">All deposits and approvals recorded.</p>
            </div>
            <div className="rounded-xl border border-primary/14 bg-primary/7 p-4">
              <p className="text-xs text-muted-foreground">Dues collected</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">94%</p>
              <div className="mt-3 h-2 rounded-full bg-background/70">
                <div className="h-full w-[94%] rounded-full bg-primary" />
              </div>
            </div>
            <div className="rounded-xl border border-primary/14 bg-primary/7 p-4">
              <p className="text-xs text-muted-foreground">Next payout</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">12 days</p>
              <p className="mt-3 text-xs text-primary">Schedule locked</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/14 bg-surface/80 p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-secondary/16 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Vote className="h-3.5 w-3.5" />
                  Voting live
                </div>
                <h3 className="font-display text-base font-semibold leading-snug text-foreground">
                  Buy water tanks for Pipeline estate
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 text-accent" />
                Closes Friday
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                ["Yes", "68%", "bg-primary"],
                ["No", "21%", "bg-orange"],
                ["Abstain", "11%", "bg-muted-foreground"],
              ].map(([label, value, color]) => (
                <div key={label} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <div className="h-2 rounded-full bg-background/70">
                    <div className={cn("h-full rounded-full", color)} style={{ width: value }} />
                  </div>
                  <span className="text-right font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden gap-4 sm:grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-xl border border-primary/14 bg-background/45 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <ReceiptText className="h-3.5 w-3.5" />
                Recent activity
              </div>
              <div className="space-y-3">
                {contributions.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-accent">{entry.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-primary/14 bg-background/45 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Governance
              </div>
              <div className="space-y-3">
                {timeline.map((step, index) => {
                  const active = index <= 2;
                  return (
                    <div key={step} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground/50")} />
                      <span className={active ? "text-foreground" : "text-muted-foreground"}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-primary/10 pt-20 pb-10 sm:pt-28 sm:pb-12 lg:pt-32">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <DotPattern
          width={28}
          height={28}
          cr={1}
          className="fill-primary/7 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
        />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] xl:gap-14"
        >
          <div className="max-w-2xl">
            <motion.div
              variants={item}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary sm:mb-6"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Live governance for community funds
            </motion.div>

            <motion.h1
              variants={item}
              className="font-display text-3xl font-bold leading-[1.08] tracking-normal text-foreground sm:text-5xl lg:text-6xl"
            >
              Run your community fund with every vote and shilling visible
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8"
            >
              Baraza gives chamas, SACCOs, welfare groups, and co-ops one shared workspace
              for contributions, proposals, votes, and treasury records.
            </motion.p>

            <motion.div variants={item} className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link to="/create" tabIndex={-1} className="sm:w-auto">
                <ShimmerButton
                  background="linear-gradient(135deg, #F4D06F, #FF8811)"
                  shimmerColor="rgba(255,255,255,0.5)"
                  className="w-full justify-center rounded-xl px-6 py-3.5 text-sm font-bold sm:w-auto"
                >
                  Start Your Group
                  <ArrowRight className="h-4 w-4" />
                </ShimmerButton>
              </Link>
              <Link to="/communities" className="btn-ghost justify-center px-6 py-3.5 text-sm sm:w-auto">
                Browse Communities
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-8 hidden max-w-xl grid-cols-3 gap-3 sm:grid">
              {stats.map((stat) => (
                <div key={stat.label} className="border-l border-primary/18 pl-3">
                  <p className="font-display text-lg font-bold text-foreground sm:text-xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={item}>
            <ProductDashboard />
          </motion.div>
        </motion.div>

        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="mt-10 hidden flex-wrap items-center gap-3 border-t border-primary/10 pt-5 text-xs text-muted-foreground sm:flex"
        >
          <span className="inline-flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" />
            Built for chamas, SACCOs, co-ops, and welfare groups
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-primary/40 sm:inline-block" />
          <span>Collect dues, approve spending, and keep every member aligned.</span>
        </motion.div>
      </div>
    </section>
  );
}
