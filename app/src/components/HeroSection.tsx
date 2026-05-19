import { Link } from "react-router-dom";
import { useEffect, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Banknote, ShieldCheck, Users, Vote, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Built on Solana", value: "Solana" },
  { label: "Phone-first onboarding", value: "M-Pesa" },
  { label: "Solana · Stellar live", value: "Multi-chain" },
];

const communityTypes = ["chama", "SACCO", "co-op", "welfare group", "community DAO"];

const walkthroughFrames: Array<{
  label: string;
  title: string;
  detail: string;
  progress: string;
  icon: LucideIcon;
}> = [
  {
    label: "Invite",
    title: "Share the DAO link",
    detail: "Members open the invite and review the rules before joining.",
    progress: "25%",
    icon: Users,
  },
  {
    label: "Dues",
    title: "Confirm payments",
    detail: "M-Pesa confirmations attach to member requests and treasury records.",
    progress: "50%",
    icon: Banknote,
  },
  {
    label: "Vote",
    title: "Reach quorum",
    detail: "Active members vote and see the decision status update clearly.",
    progress: "75%",
    icon: Vote,
  },
  {
    label: "Release",
    title: "Move funds by rule",
    detail: "Approved proposals become governed treasury movement.",
    progress: "100%",
    icon: ShieldCheck,
  },
];

function RotatingCommunityText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % communityTypes.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="block max-w-[11ch] overflow-hidden sm:max-w-none">
      <span className="block text-foreground">
        Launch your
      </span>
      <span className="relative block min-h-[1.08em]">
        <AnimatePresence mode="wait">
          <motion.span
          key={communityTypes[index]}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
            transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
            className="absolute left-0 top-0 inline-block max-w-full bg-gradient-to-r from-primary via-warm to-accent bg-clip-text text-transparent"
          >
            {communityTypes[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

function HeroPreview() {
  const [activeFrame, setActiveFrame] = useState(0);
  const frame = walkthroughFrames[activeFrame];
  const Icon = frame.icon;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveFrame((index) => (index + 1) % walkthroughFrames.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, []);

  const handleScrollToFlow = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("flow-walkthrough");
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", "#flow-walkthrough");
  };

  return (
    <div className="mt-4 block min-[860px]:mt-0">
      <div className="relative mx-auto max-w-md min-[860px]:ml-auto">
        <a
          href="#flow-walkthrough"
          aria-label="See the full flow walkthrough"
          onClick={handleScrollToFlow}
          className="group relative block overflow-hidden rounded-xl p-3 sm:rounded-2xl sm:p-4 focus-visible:outline-none focus-visible:ring-2"
        >
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest">Flow preview</p>
              <p className="mt-1 font-display text-xl font-black sm:text-2xl">How it works</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
              4 steps
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <div className="relative aspect-[16/8.4] w-full overflow-hidden rounded-lg p-3 sm:aspect-video sm:rounded-xl sm:p-4">
            <div className="pointer-events-none absolute inset-3 z-0 rounded-lg" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="rounded-full px-3 py-1 text-[11px] font-bold">
                  {frame.label}
                </span>
              </div>

              <div>
                <h3 className="font-display text-lg font-black leading-tight sm:text-2xl">{frame.title}</h3>
                <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed sm:mt-2 sm:text-sm">{frame.detail}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg p-2.5 sm:mt-4 sm:p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
              <span>Walkthrough progress</span>
              <span>{frame.progress}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{ width: frame.progress }}
              />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:mt-3" aria-hidden>
            {walkthroughFrames.map((step, index) => (
              <span
                key={step.label}
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  index === activeFrame ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </a>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-2 sm:pt-20 sm:pb-3 lg:pt-20">
      <div className="container relative z-10 mx-auto max-w-7xl px-4">
        <div className="min-[860px]:grid min-[860px]:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)] min-[860px]:items-center min-[860px]:gap-10">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold sm:mb-6">
              <ShieldCheck className="h-3.5 w-3.5" />
              Community DAO treasury, voting, and membership
            </div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
              Most popular: SACCOs and welfare groups
            </div>

            <h1
              className="font-display text-[clamp(3rem,12vw,4.6rem)] font-black leading-[0.9] tracking-tight sm:text-[clamp(4rem,6.7vw,5.45rem)]"
              aria-live="polite"
            >
              <RotatingCommunityText />
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 sm:mt-5 sm:text-lg sm:leading-8">
              Browse chamas, SACCOs, welfare groups, and co-operatives with shared
              treasury visibility, member voting, and phone-first M-Pesa participation.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3 min-[860px]:flex-col min-[1040px]:flex-row">
              <Link
                to="/communities"
                className="btn-warm inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-extrabold uppercase tracking-wide sm:w-auto min-[860px]:w-full min-[1040px]:w-auto"
              >
                Browse Community DAOs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/create" className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-extrabold uppercase tracking-wide sm:w-auto min-[860px]:w-full min-[1040px]:w-auto">
                Launch a Community DAO
              </Link>
            </div>

            <div className="mt-4 grid max-w-xl grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="border-l pl-3">
                  <p className="font-display text-lg font-bold sm:text-xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] leading-4">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <HeroPreview />
        </div>

        <div className="mt-5 hidden flex-wrap items-center gap-3 border-t pt-4 text-xs min-[860px]:flex">
          <span className="inline-flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Built for chamas, SACCOs, co-ops, and welfare groups
          </span>
          <span className="hidden h-1 w-1 rounded-full sm:inline-block" />
          <span>Collect dues, approve spending, and keep every member aligned.</span>
        </div>
      </div>
    </section>
  );
}
