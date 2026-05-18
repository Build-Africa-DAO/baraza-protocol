import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  Link2,
  MousePointer2,
  ShieldCheck,
  Smartphone,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FlowKey = "member" | "organizer";

interface FlowStep {
  title: string;
  detail: string;
  icon: LucideIcon;
  stat: string;
}

const flows: Record<FlowKey, { label: string; title: string; steps: FlowStep[] }> = {
  member: {
    label: "Member",
    title: "Join, pay, vote, and track the shared treasury.",
    steps: [
      {
        title: "Open invite",
        detail: "A member follows the DAO link and reviews the rules before joining.",
        icon: Link2,
        stat: "01",
      },
      {
        title: "Pay dues",
        detail: "M-Pesa payment confirmation is attached to the membership request.",
        icon: Smartphone,
        stat: "KSh",
      },
      {
        title: "Vote",
        detail: "Active members vote on proposals with visible quorum progress.",
        icon: Vote,
        stat: "73%",
      },
      {
        title: "Verify",
        detail: "Treasury activity stays visible after every contribution and decision.",
        icon: CheckCircle2,
        stat: "Live",
      },
    ],
  },
  organizer: {
    label: "Organizer",
    title: "Create the group, set rules, admit members, and release funds.",
    steps: [
      {
        title: "Create DAO",
        detail: "Set the group name, type, dues, quorum, approval, and vote window.",
        icon: ClipboardList,
        stat: "4m",
      },
      {
        title: "Invite group",
        detail: "Share one joining path for wallet users and phone-first members.",
        icon: Users,
        stat: "Link",
      },
      {
        title: "Confirm money",
        detail: "Payment attestations connect off-chain collections to on-chain state.",
        icon: Banknote,
        stat: "Paid",
      },
      {
        title: "Release by rule",
        detail: "Approved proposals become controlled treasury movement.",
        icon: ShieldCheck,
        stat: "Rule",
      },
    ],
  },
};

function FlowPoint({ step, index }: { step: FlowStep; index: number }) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.04 }}
      className="relative min-w-0"
    >
      <div className="mb-4 flex items-center gap-3 md:block">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/20 bg-background/70 text-primary shadow-[0_10px_28px_hsl(84_17%_2%/0.3)] md:mx-auto">
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary md:absolute md:right-0 md:top-0">
          {step.stat}
        </span>
      </div>
      <div className="md:text-center">
        <h3 className="font-display text-base font-bold text-foreground">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
      </div>
    </motion.div>
  );
}

export default function FlowWalkthrough() {
  const [activeFlow, setActiveFlow] = useState<FlowKey>("member");
  const flow = flows[activeFlow];

  return (
    <section className="relative scroll-mt-16 border-b border-primary/10 py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto">
          <div className="mb-7 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Flow walkthrough</p>
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Two paths, one shared source of truth
            </h2>
          </div>

          <div className="relative min-h-[36rem] overflow-hidden rounded-2xl border border-border/70 bg-card/45 p-4 shadow-[var(--shadow-deep)] md:min-h-[34rem] md:p-8">
            <div className="pointer-events-none absolute inset-0 ambient-globe-layer opacity-35" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/45" aria-hidden />
            <div className="relative flex min-h-[31rem] flex-col justify-center md:min-h-[28rem]">
              <div className="relative mx-auto mb-10 grid w-full max-w-xl grid-cols-2 rounded-2xl border border-border/75 bg-surface/85 p-1.5 shadow-[0_18px_44px_hsl(84_17%_2%/0.52)]">
                {(Object.keys(flows) as FlowKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFlow(key)}
                    className={cn(
                      "rounded-xl px-5 py-3 text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 md:text-xl",
                      activeFlow === key
                        ? "bg-secondary text-secondary-foreground shadow-[0_8px_22px_hsl(84_17%_2%/0.28)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={activeFlow === key}
                  >
                    {flows[key].label}
                  </button>
                ))}
                <MousePointer2 className="pointer-events-none absolute -bottom-8 left-[52%] h-7 w-7 rotate-[-18deg] fill-secondary text-background drop-shadow-[0_3px_0_hsl(0_0%_0%/0.75)] md:-bottom-10 md:h-9 md:w-9" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFlow}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="mx-auto mb-8 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
                    {flow.title}
                  </p>

                  <div className="relative grid gap-5 md:grid-cols-4 md:gap-6">
                    <div className="pointer-events-none absolute left-[12%] right-[12%] top-[1.35rem] hidden h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent md:block" />
                    {flow.steps.map((step, index) => (
                      <FlowPoint key={step.title} step={step} index={index} />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
