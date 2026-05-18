import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Landmark,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import Layout from "@/components/Layout";
import { DotPattern } from "@/components/ui/dot-pattern";

const evaluationChecks = [
  {
    icon: Users,
    title: "Membership is clear",
    detail: "Members should know the joining fee, monthly dues, voting rights, renewal rules, and who can approve or suspend membership.",
  },
  {
    icon: Landmark,
    title: "Treasury rules are visible",
    detail: "A strong DAO explains where money is held, who can prepare releases, what approvals are required, and how members review fund movement.",
  },
  {
    icon: Vote,
    title: "Voting rules are fair",
    detail: "Look for quorum, approval threshold, voting period, one-member-one-vote or weighted-vote policy, and a clear rule against double voting.",
  },
  {
    icon: ShieldCheck,
    title: "Records can be verified",
    detail: "Good communities preserve proposal outcomes, vote receipts, payment confirmations, treasury activity, and membership status changes.",
  },
];

const scoreRows = [
  ["Excellent", "4 checks passed", "Ready to join or launch with confidence."],
  ["Promising", "3 checks passed", "Ask for the missing policy before moving funds."],
  ["Needs review", "2 checks passed", "Clarify governance, treasury, or membership rules first."],
  ["High risk", "0-1 checks passed", "Do not collect dues or activate membership yet."],
];

export default function Evaluate() {
  return (
    <Layout>
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/8 blur-[90px]" />
          <DotPattern
            width={24}
            height={24}
            cr={1}
            className="fill-primary/6 [mask-image:radial-gradient(ellipse_70%_45%_at_50%_0%,black,transparent)]"
          />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Best-practice evaluation
            </div>
            <h1 className="font-display text-4xl font-black leading-tight text-foreground md:text-5xl">
              Evaluate a Community DAO before members commit money.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Use this checklist to compare communities, prepare a new DAO, or decide what
              needs to be fixed before treasury deposits, votes, and membership activation go live.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {evaluationChecks.map(({ icon: Icon, title, detail }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
                className="baraza-card p-5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="baraza-card p-6">
              <h2 className="font-display text-2xl font-bold text-foreground">How to evaluate</h2>
              <div className="mt-5 space-y-4">
                {[
                  "Open the DAO profile and read the membership, treasury, and voting rules.",
                  "Check that every spending proposal has a purpose, amount, deadline, and approval status.",
                  "Confirm membership activation is separate from payment confirmation.",
                  "Ask for missing records before joining, voting, or moving funds.",
                ].map((step) => (
                  <div key={step} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-confirmed" />
                    <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="baraza-card p-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Score guide</h2>
              <div className="mt-5 divide-y divide-border/60 rounded-lg border border-border/60">
                {scoreRows.map(([label, score, meaning]) => (
                  <div key={label} className="grid gap-2 p-4 sm:grid-cols-[7rem_8rem_1fr] sm:items-center">
                    <p className="font-display text-sm font-bold text-foreground">{label}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{score}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{meaning}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-8 rounded-lg border border-accent/25 bg-accent/8 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Best practice: never show a member as active just because payment arrived.
                  Wait for reconciliation, membership minting, and confirmed membership state.
                </p>
              </div>
              <Link to="/create" className="btn-warm shrink-0 justify-center text-sm">
                Create with these rules
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
