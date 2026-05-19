import { Link } from "react-router-dom";
import { ArrowRight, Bot, Compass, LayoutDashboard, Sparkles, WalletCards } from "lucide-react";
import { useAshaChat } from "@/contexts/AshaChatContext";

const platformLinks = [
  {
    icon: Compass,
    label: "Discover",
    title: "Find active communities",
    detail: "Browse chamas, SACCOs, co-ops, and welfare groups with live filters.",
    to: "/communities",
  },
  {
    icon: WalletCards,
    label: "Launch",
    title: "Create the DAO rules",
    detail: "Set dues, quorum, voting windows, and payment paths in one guided flow.",
    to: "/create",
  },
  {
    icon: LayoutDashboard,
    label: "Operate",
    title: "Run treasury decisions",
    detail: "Track members, proposals, balances, and releases from the dashboard.",
    to: "/profile",
  },
];

const aiPrompts = [
  "Help me choose the best DAO setup for a welfare group",
  "Explain how M-Pesa dues connect to voting",
  "What should members see before joining?",
];

export default function AIPlatformSection() {
  const { open } = useAshaChat();

  return (
    <section className="relative py-12 md:py-16" id="ai-platform">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-5 shadow-[var(--shadow-card)] md:p-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Website + platform + AI
            </div>
            <h2 className="font-display text-3xl font-black leading-tight md:text-4xl">
              One place to understand, launch, and manage a community DAO.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Baraza now works as both the public website and the operating platform:
              visitors learn the model, organizers launch communities, members vote,
              and Asha helps everyone move through the right next step.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => open("Help me set up a community DAO on Baraza")}
                className="btn-warm inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold"
              >
                Ask Asha AI
                <Bot className="h-4 w-4" />
              </button>
              <Link
                to="/communities"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 px-5 py-3 text-sm font-extrabold transition-colors hover:border-primary/50"
              >
                Enter platform
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {platformLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group rounded-2xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40 hover:bg-surface"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary">
                      {item.label}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold leading-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                  <ArrowRight className="mt-5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border/70 bg-surface/70 p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="inline-flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Asha AI guide</p>
                <p className="text-sm text-muted-foreground">Fast answers for organizers and members.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => open(prompt)}
                  className="rounded-full border border-border/70 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
