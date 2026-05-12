import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, CreditCard, Link2, Settings2, ShieldCheck, Users } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const steps = [
  { icon: CreditCard, title: "Join with M-Pesa", desc: "Start from phone-first dues and reconcile payment before membership activates." },
  { icon: Link2, title: "Link wallet", desc: "Attach an embedded or external Solana wallet for credentials and signatures." },
  { icon: Settings2, title: "Set group rules", desc: "Name the group, set dues, define quorum, and choose approval thresholds." },
  { icon: Users, title: "Invite members", desc: "Members join the same treasury view before money starts moving." },
  { icon: ShieldCheck, title: "Operate in public", desc: "Collect, vote, release, and audit with the same on-chain trail." },
];

const summary = [
  { label: "Setup time", value: "4 min" },
  { label: "Treasury mode", value: "Shared" },
  { label: "Decision rule", value: "Quorum" },
];

export default function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid overflow-hidden rounded-2xl border border-border/70 bg-card/75 shadow-[var(--shadow-deep)] lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="border-b border-border/70 p-8 md:p-10 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Launch a treasury</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Bring the group online with rules everyone can see
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Start with a working treasury, not a blank workspace. Baraza gives members a shared
              dashboard from the first contribution to the final vote.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/create" tabIndex={-1}>
                <ShimmerButton
                  background="linear-gradient(135deg, #F4D06F, #FF8811)"
                  shimmerColor="rgba(255,255,255,0.5)"
                  className="w-full justify-center rounded-lg px-7 py-3.5 text-sm font-bold sm:w-auto"
                >
                  Start a Group
                  <ArrowRight className="h-4 w-4" />
                </ShimmerButton>
              </Link>
              <Link to="/communities" className="btn-ghost justify-center rounded-lg px-7 py-3.5 text-sm">
                Explore Communities
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {summary.map((item) => (
                <div key={item.label} className="rounded-lg border border-border/60 bg-background/35 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">{item.label}</p>
                  <p className="mt-1 font-display text-sm font-bold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 bg-surface/45 p-5 md:grid-cols-2 md:p-6">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="rounded-xl border border-border/70 bg-background/35 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-display text-xs text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
