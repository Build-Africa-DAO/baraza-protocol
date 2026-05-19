import { useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  Link2,
  MousePointer2,
  PlayCircle,
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
    title: "Launch the group, set rules, admit members, and release funds.",
    steps: [
      {
        title: "Launch DAO",
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

function FlowPoint({ step }: { step: FlowStep }) {
  const Icon = step.icon;

  return (
    <div className="relative min-w-0">
      <div className="mb-4 flex items-center gap-3 md:block">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg md:mx-auto">
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex rounded-md px-2 py-1 text-[11px] font-bold md:absolute md:right-0 md:top-0">
          {step.stat}
        </span>
      </div>
      <div className="md:text-center">
        <h3 className="font-display text-base font-bold">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed">{step.detail}</p>
      </div>
    </div>
  );
}

export default function FlowWalkthrough() {
  const [activeFlow, setActiveFlow] = useState<FlowKey>("member");
  const flow = flows[activeFlow];

  return (
    <section id="flow-walkthrough" className="relative scroll-mt-16 pb-7 pt-4 md:pb-10 md:pt-6">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto">
          <div className="mb-5 text-center md:mb-7">
            <p className="text-xs font-semibold uppercase tracking-widest">Video tutorial</p>
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold leading-tight md:text-4xl">
              Two paths, one shared source of truth
            </h2>
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
              <PlayCircle className="h-4 w-4" />
              90-second product walkthrough
            </div>
          </div>

          <div className="relative min-h-[32rem] overflow-hidden rounded-2xl p-4 md:min-h-[31rem] md:p-8">
            <div className="relative flex min-h-[27rem] flex-col justify-center md:min-h-[25rem]">
              <div className="relative mx-auto mb-10 grid w-full max-w-xl grid-cols-2 rounded-2xl p-1.5">
                {(Object.keys(flows) as FlowKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFlow(key)}
                    className={cn(
                      "rounded-xl px-5 py-3 text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 md:text-xl",
                      activeFlow === key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={activeFlow === key}
                  >
                    {flows[key].label}
                  </button>
                ))}
                <MousePointer2 className="pointer-events-none absolute -bottom-8 left-[52%] h-7 w-7 rotate-[-18deg] md:-bottom-10 md:h-9 md:w-9" />
              </div>

              <div>
                <p className="mx-auto mb-8 max-w-2xl text-center text-base leading-relaxed md:text-lg">
                  {flow.title}
                </p>

                <div className="relative grid gap-5 md:grid-cols-4 md:gap-6">
                  <div className="pointer-events-none absolute left-[12%] right-[12%] top-[1.35rem] hidden h-px md:block" />
                  {flow.steps.map((step) => (
                    <FlowPoint key={step.title} step={step} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
