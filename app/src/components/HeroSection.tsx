import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Sample groups modeled", value: "180+" },
  { label: "Sample member records", value: "2.4K+" },
  { label: "Sample funds visible", value: "KSh 12M+" },
];

const communityTypes = ["community", "DAO", "SACCO", "co-operative", "chama", "welfare group"];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

function RotatingCommunityText() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsChanging(true);

      window.setTimeout(() => {
        setActiveIndex((index) => (index + 1) % communityTypes.length);
        setIsChanging(false);
      }, 180);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  const activeType = communityTypes[activeIndex];

  return (
    <span className="block overflow-hidden">
      <span className="block">
        <span className="text-secondary">Create</span>{" "}
        <span className="text-accent">your</span>
      </span>
      <span className="block min-h-[1.05em] text-primary">
        <span
          className={cn(
            "inline-block whitespace-nowrap transition-all duration-200 ease-out",
            isChanging ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
          )}
        >
          {activeType}
        </span>
      </span>
    </span>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-primary/10 pt-20 pb-10 sm:pt-28 sm:pb-12 lg:pt-32">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 ambient-globe-layer" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
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
          className="max-w-2xl"
        >
          <motion.div
            variants={item}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary sm:mb-6"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Community DAO treasury, voting, and membership
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display text-5xl font-black leading-[0.92] tracking-normal text-foreground sm:text-6xl lg:text-7xl"
            aria-live="polite"
          >
            <RotatingCommunityText />
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8"
          >
            Browse chamas, SACCOs, welfare groups, and co-operatives with shared
            treasury visibility, member voting, and phone-first M-Pesa participation.
          </motion.p>

          <motion.div variants={item} className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <Link to="/communities" tabIndex={-1} className="sm:w-auto">
              <ShimmerButton
                background="linear-gradient(135deg, #F4D06F, #FF8811)"
                shimmerColor="rgba(255,255,255,0.5)"
                className="w-full justify-center rounded-xl px-8 py-4 text-base font-extrabold uppercase tracking-wide sm:w-auto"
              >
                Browse Community DAOs
                <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
            </Link>
            <Link to="/create" className="btn-ghost justify-center px-6 py-4 text-sm font-bold sm:w-auto">
              Create a Community DAO
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="border-l border-primary/18 pl-3">
                <p className="font-display text-lg font-bold text-foreground sm:text-xl">{stat.value}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{stat.label}</p>
              </div>
            ))}
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
