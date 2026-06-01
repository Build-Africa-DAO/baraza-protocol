import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Landmark,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useSeo } from "@/lib/seo";

const evaluationChecks = [
  {
    icon: Users,
    title: "Membership is clear",
    detail: "Members should know the joining fee, monthly dues, voting rights, renewal rules, and who can approve or suspend membership.",
  },
  {
    icon: Landmark,
    title: "Treasury rules are visible",
    detail: "A strong group explains where money is held, who can prepare releases, what approvals are required, and how members review fund movement.",
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

const aiReviewRows = [
  ["Community rules", "Checks dues, quorum, approval threshold, voting period, and visible treasury records."],
  ["Bounties", "Flags unclear briefs, expired deadlines, missing KES reward, and closed tasks."],
  ["Proposals", "Reviews funding amount, treasury impact, voting window, quorum, and member participation."],
  ["Treasury releases", "Keeps approved votes and payment records together for member review."],
];

export default function Evaluate() {
  useSeo({
    title: "Evaluate a group before you join",
    description:
      "A practical checklist to compare DAOs, communities, SACCOs, and co-operatives on membership clarity, treasury rules, voting fairness, and dispute handling before depositing dues.",
    path: "/evaluate",
  });

  return (
    <Layout>
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Best-practice evaluation
            </div>
            <h1 className="font-display text-4xl font-black leading-tight md:text-5xl">
              Evaluate a group before members commit money.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 md:text-lg md:leading-8">
              Use this checklist to compare communities, prepare a new group, or decide what
              needs to be fixed before treasury deposits, votes, and membership activation go live.
              Asha adds an AI-assisted security review on top of the same rules inside the app.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {evaluationChecks.map(({ icon: Icon, title, detail }) => (
              <article
                key={title}
                className="baraza-card p-5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-lg font-bold">{title}</h2>
                <p className="mt-3 text-sm leading-6">{detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="baraza-card p-6">
              <h2 className="font-display text-2xl font-bold">How to evaluate</h2>
              <div className="mt-5 space-y-4">
                {[
                  "Open the group profile and read the membership, treasury, and voting rules.",
                  "Check that every spending proposal has a purpose, amount, deadline, and approval status.",
                  "Confirm membership activation is separate from payment confirmation.",
                  "Ask for missing records before joining, voting, or moving funds.",
                ].map((step) => (
                  <div key={step} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm leading-6">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="baraza-card p-6">
              <h2 className="font-display text-2xl font-bold">Score guide</h2>
              <div className="mt-5 divide-y rounded-lg border">
                {scoreRows.map(([label, score, meaning]) => (
                  <div key={label} className="grid gap-2 p-4 sm:grid-cols-[7rem_8rem_1fr] sm:items-center">
                    <p className="font-display text-sm font-bold">{label}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider">{score}</p>
                    <p className="text-sm leading-6">{meaning}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-8 baraza-card p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  Asha AI security layer
                </div>
                <h2 className="font-display text-2xl font-bold">Vetting before members trust a decision</h2>
              </div>
              <span className="rounded-lg border px-3 py-2 text-xs font-semibold text-muted-foreground">
                Review aid, not final approval
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {aiReviewRows.map(([label, detail]) => (
                <article key={label} className="rounded-lg border p-4">
                  <p className="font-display text-sm font-bold">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-8 rounded-lg border p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="max-w-2xl text-sm leading-6">
                  Best practice: never show a member as active just because payment arrived.
                  Wait for reconciliation, membership minting, and confirmed membership state.
                </p>
              </div>
              <Link to="/create" className="btn-warm shrink-0 justify-center text-sm">
                Launch with these rules
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
