import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  ChevronRight,
  Coins,
  Flame,
  HandCoins,
  Landmark,
  Medal,
  MessageSquareText,
  Vote,
  Wallet,
} from "lucide-react";
import Layout from "@/components/Layout";
import { formatKSh } from "@/lib/utils";
import { useSeo } from "@/lib/seo";

const highlights = [
  { label: "Active members", value: "42" },
  { label: "Community balance", value: formatKSh(450000) },
  { label: "Open tasks", value: "08" },
];

const votes = [
  {
    title: "Solar microgrid contribution",
    status: "2 days left",
    progress: 78,
    summary: "32 of 42 members voted",
  },
  {
    title: "Update monthly contribution",
    status: "5 votes needed",
    progress: 45,
    summary: "Voting is still open",
  },
];

const stewards = [
  { name: "Zara Mwangi", role: "Treasurer", focus: "Contributions" },
  { name: "Samuel Okafor", role: "Records steward", focus: "Records" },
  { name: "Kofi Mensah", role: "Secretary", focus: "Meetings" },
];

const bounties = [
  {
    title: "Draft the monthly update",
    meta: "2 volunteer places",
    detail: "Summarize savings progress, treasury moves, and community wins.",
  },
  {
    title: "Audit transaction records",
    meta: "Treasurer review",
    detail: "Verify internal notes against the public community history.",
  },
  {
    title: "Organize the next meetup",
    meta: "Before the next meeting",
    detail: "Coordinate venue, attendance, and volunteer roles for the gathering.",
  },
];

const onboardingChoices = [
  {
    title: "Monthly savings",
    detail: "Regular contributions and pooled funds for the group.",
    icon: Wallet,
  },
  {
    title: "Community support",
    detail: "Manage welfare requests, care work, and mutual support.",
    icon: HandCoins,
  },
  {
    title: "Meetings and events",
    detail: "Plan gatherings, assign tasks, and record what members agree.",
    icon: Flame,
  },
  {
    title: "Shared business",
    detail: "Track pooled investments, expenses, and group decisions.",
    icon: Landmark,
  },
];

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-border/80 bg-surface/80 px-4 py-3">
      <p className="font-display text-lg font-bold text-foreground">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default function Index() {
  useSeo({
    title: "Community contributions, decisions, and shared funds",
    description:
      "Baraza helps savings groups, SACCOs, and community collectives run transparent treasury, voting, and contribution workflows without exposing members to technical complexity.",
    path: "/",
  });

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] pb-14 pt-10 sm:pb-16 sm:pt-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:gap-10">
          <div className="rise rise-1 flex items-center justify-between gap-4 rounded-full border border-border/70 bg-card/70 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur">
            <div>
              <p className="font-display text-base font-bold text-primary">Baraza</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Community finance and governance
              </p>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Bell className="h-4 w-4" />
              <div className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <BadgeCheck className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(20rem,0.98fr)] lg:items-start">
            <div className="min-w-0 max-w-2xl">
              <div className="rise rise-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Shared money, clear decisions
              </div>
              <h1 className="rise rise-3 mt-5 max-w-[11ch] font-display text-[1.9rem] font-black leading-[0.98] tracking-[-0.03em] text-foreground min-[360px]:text-4xl sm:text-6xl xl:text-7xl">
                Manage contributions, decisions, and shared funds in one place.
              </h1>
              <p className="rise rise-4 mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Baraza helps savings groups, SACCOs, cooperatives, and community organizations
                collect dues, vote on proposals, and keep every member informed.
              </p>

              <div className="rise rise-5 mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/communities"
                  className="btn-warm inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-extrabold uppercase tracking-[0.14em]"
                >
                  Find a community
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/create/purpose"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/35 bg-card/70 px-6 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:bg-primary/10"
                >
                  Create a community
                </Link>
              </div>

              <div className="rise rise-5 mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <StatPill key={item.label} {...item} />
                ))}
              </div>
            </div>

            <div className="rise rise-4 min-w-0 overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/78 p-3 shadow-[var(--shadow-deep)] backdrop-blur sm:p-5">
              <div className="min-w-0 rounded-[1.25rem] border border-border/70 bg-surface p-4 sm:p-5">
                <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Example community
                    </p>
                    <h2 className="mt-2 text-balance font-display text-xl font-black leading-tight text-foreground sm:text-2xl">
                      Every member sees the same records
                    </h2>
                  </div>
                  <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Member view
                  </div>
                </div>

                <div className="mt-5 min-w-0 overflow-hidden rounded-[1rem] border border-border/70 bg-background/80 p-4 sm:mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Available community balance
                  </p>
                  <div className="mt-2 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
                    <p className="max-w-full whitespace-nowrap font-display text-2xl font-black tabular-nums text-primary min-[390px]:text-3xl sm:text-4xl">{formatKSh(450000)}</p>
                    <span className="text-sm font-bold text-confirmed sm:pb-1">Updated today</span>
                  </div>
                  <div className="mt-5 h-24 rounded-[0.9rem] bg-[linear-gradient(180deg,hsl(var(--surface-hover))_0%,transparent_100%)] p-3">
                    <div className="flex h-full items-end gap-2">
                      {[38, 56, 52, 76, 70, 88, 100].map((bar, index) => (
                        <div key={bar} className="flex-1">
                          <div
                            className="w-full rounded-full bg-[var(--gradient-primary)]"
                            style={{ height: `${bar}%`, opacity: index === 6 ? 1 : 0.72 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {votes.map((voteItem) => (
                    <div
                      key={voteItem.title}
                      className="rounded-[1rem] border border-border/70 bg-background/72 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="max-w-[16ch] text-sm font-bold leading-5 text-foreground">
                          {voteItem.title}
                        </p>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                          {voteItem.status}
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[var(--gradient-warm)]"
                          style={{ width: `${voteItem.progress}%` }}
                        />
                      </div>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {voteItem.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y border-border/70 bg-surface/70 py-10 sm:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rise rise-2 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Choose your starting point
              </p>
              <h2 className="mt-2 font-display text-2xl font-black text-foreground sm:text-3xl">
                What does your community need to manage?
              </h2>
            </div>
            <div className="hidden rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground sm:block">
              Start here
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {onboardingChoices.map((choice, index) => {
              const Icon = choice.icon;
              return (
                <div
                  key={choice.title}
                  className="rise rounded-[1.2rem] border border-border/70 bg-card/82 p-5 shadow-[var(--shadow-card)]"
                  style={{ animationDelay: `${0.08 * (index + 1)}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[0.9rem] bg-primary/12 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {choice.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {choice.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="container mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rise rise-2 rounded-[1.4rem] border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <Medal className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-2xl font-black text-foreground">
                Community stewards
              </h2>
            </div>
            <div className="mt-6 space-y-5">
              {stewards.map((person, index) => (
                <div key={person.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full border border-border/70 bg-surface text-sm font-black text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{person.name}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {person.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-bold text-primary">{person.focus}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Current focus
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rise rise-3 min-w-0 rounded-[1.4rem] border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-primary" />
                <h2 className="text-balance font-display text-xl font-black leading-tight text-foreground sm:text-2xl">
                  Open community tasks
                </h2>
              </div>
              <Link
                to="/bounties"
                className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-bold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary/10 hover:text-foreground"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {bounties.map((bounty) => (
                <div
                  key={bounty.title}
                  className="rounded-[1rem] border border-border/70 bg-background/75 p-4"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-[0.75rem] bg-primary/12 text-primary">
                    <MessageSquareText className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold leading-5 text-foreground">
                    {bounty.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{bounty.detail}</p>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                    {bounty.meta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rise rise-4 relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--secondary))_100%)] p-8 text-primary-foreground shadow-[var(--shadow-warm)] sm:p-10">
            <div className="absolute -right-10 -top-10 opacity-15">
              <Vote className="h-40 w-40" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                One shared record
              </p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">
                Give every member a clear view of the community.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/88 sm:text-base sm:leading-7">
                Keep contributions, balances, proposals, votes, and assigned work together so
                members can understand what happened and what comes next.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/create/purpose"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-background px-6 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-primary transition-transform hover:scale-[1.02]"
                >
                  Create a community
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/communities"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                >
                  View communities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
