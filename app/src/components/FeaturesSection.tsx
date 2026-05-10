import { motion } from "framer-motion";
import { Users, Vote, PiggyBank, Eye, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

const features = [
  {
    Icon: Users,
    name: "Create Your Group",
    description: "Set up your Chama, SACCO, or welfare group in minutes. Name it, set a membership fee, and invite members.",
    className: "lg:col-span-1",
    iconClassName: "text-primary",
  },
  {
    Icon: PiggyBank,
    name: "Pool Funds Transparently",
    description: "Every contribution is recorded on-chain. Members see every deposit, withdrawal, and balance in real time — no hidden ledgers.",
    className: "lg:col-span-2",
    iconClassName: "text-accent",
    featured: true,
  },
  {
    Icon: Vote,
    name: "Democratic Voting",
    description: "Propose spending. Every member votes — support or object. Decisions only pass when the community agrees.",
    className: "lg:col-span-2",
    iconClassName: "text-secondary",
    featured: true,
  },
  {
    Icon: Eye,
    name: "Full Transparency",
    description: "Every shilling is tracked. Fund balance, history, and outcomes are visible to all members.",
    className: "lg:col-span-1",
    iconClassName: "text-primary",
  },
  {
    Icon: ShieldCheck,
    name: "Secure by Design",
    description: "No middlemen. Smart contracts on Solana ensure funds are only moved when your community says so.",
    className: "lg:col-span-1",
    iconClassName: "text-accent",
  },
  {
    Icon: MessageCircle,
    name: "Asha AI Guide",
    description: "Your built-in AI community advisor. Ask questions, get help with decisions, and navigate the platform effortlessly.",
    className: "lg:col-span-1",
    iconClassName: "text-secondary",
  },
  {
    Icon: Zap,
    name: "Instant Settlement",
    description: "Payments settle in seconds on Solana — no bank delays, no weekend holds, no excuses.",
    className: "lg:col-span-1",
    iconClassName: "text-primary",
  },
];

// Decorative backgrounds for featured cards
function VotingVisual() {
  const options = [
    { label: "Build borehole", votes: 78, color: "bg-primary" },
    { label: "School supplies", votes: 52, color: "bg-accent" },
    { label: "Emergency fund", votes: 34, color: "bg-secondary/60" },
  ];
  return (
    <div className="absolute inset-0 flex items-start justify-end p-4 opacity-30 group-hover:opacity-50 transition-opacity">
      <div className="w-48 space-y-2">
        {options.map((o) => (
          <div key={o.label} className="space-y-0.5">
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>{o.label}</span>
              <span>{o.votes}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full", o.color)} style={{ width: `${o.votes}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FundVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-end p-6 opacity-25 group-hover:opacity-40 transition-opacity">
      <div className="text-right space-y-1">
        {["KSh 500", "KSh 1,200", "KSh 800", "KSh 2,000"].map((amt, i) => (
          <div key={i} className="flex items-center gap-2 justify-end">
            <span className="text-[10px] text-muted-foreground">Member {i + 1}</span>
            <span className="text-xs font-semibold text-accent">{amt}</span>
            <div className="w-2 h-2 rounded-full bg-primary/60" />
          </div>
        ))}
        <div className="pt-1 border-t border-border/40 text-xs font-bold text-primary">
          Total: KSh 4,500
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="py-24 relative" id="features">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-primary mb-3"
          >
            Platform Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Everything your community needs
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            From collecting dues to making collective decisions — Baraza handles it all, on-chain.
          </motion.p>
        </div>

        {/* Bento grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <BentoGrid className="auto-rows-[14rem]">
            {features.map((f, i) => (
              <div key={f.name} className={cn("relative", f.className)}>
                {/* Featured cards get a border beam */}
                {f.featured && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-20">
                    <BorderBeam
                      size={180}
                      duration={10}
                      colorFrom="#219EBC"
                      colorTo="#FFB703"
                      delay={i * 2}
                    />
                  </div>
                )}

                <BentoCard
                  name={f.name}
                  description={f.description}
                  Icon={f.Icon}
                  iconClassName={f.iconClassName}
                  className="h-full"
                  background={
                    f.name === "Democratic Voting" ? <VotingVisual /> :
                    f.name === "Pool Funds Transparently" ? <FundVisual /> :
                    undefined
                  }
                />
              </div>
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
}
