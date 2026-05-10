import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { BorderBeam } from "@/components/ui/border-beam";

const perks = [
  "Free to start — no upfront cost",
  "On-chain security, no middlemen",
  "Works for Chamas, SACCOs, Welfare groups",
  "Members vote, funds move transparently",
];

export default function CTASection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-border/60"
          style={{ background: "var(--gradient-surface)" }}
        >
          {/* Border beam */}
          <BorderBeam size={300} duration={15} colorFrom="#FFB703" colorTo="#219EBC" />

          {/* Dot pattern */}
          <DotPattern
            width={20}
            height={20}
            cr={1}
            className="fill-primary/6 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,black,transparent)]"
          />

          {/* Ambient glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/8 blur-[80px] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 p-10 md:p-16 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left copy */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                Get started today
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                Ready to bring your{" "}
                <span className="text-gradient-primary">group online?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                Whether it's a Chama, SACCO, or welfare group — Baraza makes managing your
                community simple, transparent, and powerful.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-center gap-4 lg:justify-start justify-center">
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
                <Link to="/communities" className="btn-ghost text-sm px-6 py-3.5">
                  Explore Communities
                </Link>
              </div>
            </div>

            {/* Right: Quick steps */}
            <div className="flex-shrink-0 w-full lg:w-72">
              <div className="space-y-3">
                {[
                  { step: "01", title: "Connect Wallet", desc: "Use Phantom, Solflare, or Backpack" },
                  { step: "02", title: "Create Your Group", desc: "Name it, set membership fee" },
                  { step: "03", title: "Invite Members", desc: "Share your community link" },
                  { step: "04", title: "Vote & Manage Funds", desc: "Transparent, on-chain governance" },
                ].map((s, i) => (
                  <div
                    key={s.step}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-card/60 border border-border/50 backdrop-blur-sm"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <span className="font-display text-xs font-bold text-primary/60 min-w-[28px] pt-0.5">
                      {s.step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
