import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, TrendingUp, Users } from "lucide-react";
import { DotPattern } from "@/components/ui/dot-pattern";
import { WordRotate } from "@/components/ui/word-rotate";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { cn } from "@/lib/utils";

const HERO_THUMBNAIL = "https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=1200&q=85&auto=format&fit=crop";

const ROTATING_WORDS = ["Chama", "SACCO", "Welfare Group", "Co-op", "Community"];

const stats = [
  { icon: Users, label: "Active Members", value: 2400, suffix: "+" },
  { icon: Shield, label: "Communities", value: 180, suffix: "+" },
  { icon: TrendingUp, label: "Funds Managed", value: 12, prefix: "KSh ", suffix: "M+" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden pt-20 pb-16">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        {/* Teal glow top-center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-primary/8 blur-[100px]" />
        {/* Gold glow bottom-right */}
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/6 blur-[80px]" />
        {/* Dot pattern overlay */}
        <DotPattern
          width={24}
          height={24}
          cr={1}
          className="fill-primary/8 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={item} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-xs font-medium text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <AnimatedShinyText shimmerWidth={80} className="text-secondary">
                Community-powered decisions on Solana
              </AnimatedShinyText>
              <Sparkles className="w-3 h-3 text-accent" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={item}>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.15] mb-6 tracking-tight">
              <span className="block text-foreground/80 text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-1">
                Your{" "}
                <WordRotate
                  words={ROTATING_WORDS}
                  className="text-gradient-primary"
                  duration={2800}
                />
              </span>
              <span className="block">
                <span className="text-foreground">runs on </span>
                <span className="text-gradient-warm">Baraza</span>
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Collect membership fees, propose ideas, vote transparently, and see every shilling
            accounted for — all on-chain, no middlemen.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/create" tabIndex={-1}>
              <ShimmerButton
                background="linear-gradient(135deg, hsl(44,100%,50%), hsl(33,97%,49%))"
                shimmerColor="rgba(255,255,255,0.5)"
                className="text-sm font-bold px-8 py-3.5 rounded-xl"
              >
                Start Your Group Free
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>
            <Link
              to="/communities"
              className="btn-ghost text-sm px-8 py-3.5"
            >
              Browse Communities
            </Link>
          </motion.div>

          {/* Video hero */}
          <motion.div variants={item} className="max-w-3xl mx-auto mb-16">
            <HeroVideoDialog
              animationStyle="from-center"
              videoSrc="https://www.youtube.com/embed/dQw4w9WgXcQ"
              thumbnailSrc={HERO_THUMBNAIL}
              thumbnailAlt="Baraza community members in a meeting"
              className="rounded-2xl shadow-[0_20px_80px_hsl(200_97%_6%/0.7)] border border-white/8"
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={item}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "baraza-card p-5 flex flex-col items-center text-center",
                  "hover:scale-[1.03] transition-transform duration-200",
                )}
              >
                <stat.icon className="w-5 h-5 mb-2 text-primary" />
                <span className="font-display text-2xl font-bold text-foreground">
                  {stat.prefix || ""}
                  <NumberTicker
                    value={stat.value}
                    className="font-display text-2xl font-bold text-foreground"
                  />
                  {stat.suffix}
                </span>
                <span className="text-xs text-muted-foreground mt-1">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
}
