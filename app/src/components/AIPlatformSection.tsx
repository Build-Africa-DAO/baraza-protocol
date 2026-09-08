import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { Reveal, REVEAL_STAGGER } from "@/components/landing/motion";
import { toTitleCase } from "@/lib/utils";

const stats = [
  { value: 27, label: toTitleCase("Group types, from chama to SACCO") },
  { value: 4, label: toTitleCase("Countries: Kenya, Uganda, Tanzania, Rwanda") },
  { value: 365, label: toTitleCase("Days a year every member can check") },
];

const groupCards = [
  { src: "/gallery/gallery-dues.jpg", alt: "Members gathered around a laptop" },
  { src: "/gallery/gallery-plan.jpg", alt: "A group planning together on a glass wall" },
  { src: "/gallery/gallery-ledger.jpg", alt: "Treasurer reviewing a shared ledger on a screen" },
  { src: "/gallery/gallery-group.jpg", alt: "Members laughing together at a desk" },
  { src: "/audience/group.jpg", alt: "A chama gathered around a laptop" },
  { src: "/contact/group.jpg", alt: "Four chama members checking a payment on their phones" },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useInView(threshold = 0.4) {
  const ref = useRef<HTMLDListElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function CountStat({
  value,
  label,
  active,
}: {
  value: number;
  label: string;
  active: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    const target = active ? value : 0;
    if (prefersReducedMotion()) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const from = displayRef.current;
    if (from === target) return;

    let raf = 0;
    const started = performance.now();
    const duration = 700;
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (target - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);

  return (
    <div className="flex flex-col items-center text-center">
      <dt
        className="font-display text-4xl font-black leading-none tracking-tight tabular-nums md:text-5xl"
        aria-label={String(value)}
      >
        {display}
      </dt>
      <dd className="mx-auto mt-2 max-w-[12rem] text-sm leading-6 opacity-75">{label}</dd>
    </div>
  );
}

function PhotoCard({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="aspect-square w-full overflow-hidden rounded-2xl bg-background p-1.5">
      <img src={src} alt={alt} className="h-full w-full rounded-xl object-cover" />
    </figure>
  );
}

export default function AIPlatformSection() {
  const { ref, inView } = useInView();
  const leftCards = groupCards.filter((_, index) => index % 2 === 0);
  const rightCards = groupCards.filter((_, index) => index % 2 === 1);

  return (
    <section className="scroll-mt-20 py-12 lg:py-[3.75rem]" id="who-its-for">
      <div className="page-shell">
        <div className="audience-band relative overflow-hidden rounded-[2rem] bg-primary text-foreground lg:rounded-[2.75rem]">
          <div className="grid lg:grid-cols-[minmax(18rem,0.48fr)_minmax(0,1.52fr)]">
            <div
              className="relative h-56 overflow-hidden sm:h-72 lg:h-auto lg:min-h-[22rem]"
              aria-hidden="true"
            >
              <div className="absolute inset-0 flex justify-center gap-5 px-5 sm:gap-6 sm:px-6 lg:justify-end lg:px-0 lg:pl-8">
                <Marquee
                  vertical
                  reverse
                  repeat={3}
                  className="h-full w-[7.25rem] overflow-visible sm:w-[8.75rem] lg:w-[10rem] [--duration:28s] [--gap:1rem]"
                >
                  {leftCards.map((card) => (
                    <PhotoCard key={card.src} src={card.src} alt="" />
                  ))}
                </Marquee>
                <Marquee
                  vertical
                  repeat={3}
                  className="h-full w-[7.25rem] overflow-visible sm:w-[8.75rem] lg:w-[10rem] [--duration:28s] [--gap:1rem]"
                >
                  {rightCards.map((card) => (
                    <PhotoCard key={card.src} src={card.src} alt="" />
                  ))}
                </Marquee>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center px-6 py-8 text-center sm:px-10 sm:py-10 lg:pl-16 lg:pr-10 lg:py-10 xl:pl-20 xl:pr-14">
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                  Everyone Is Welcome
                </p>
              </Reveal>
              <Reveal delay={REVEAL_STAGGER}>
                <h2 className="mt-3 w-full font-display text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
                  {toTitleCase("Bring your group, or find one.")}
                </h2>
              </Reveal>
              <Reveal delay={REVEAL_STAGGER * 2}>
                <p className="mt-4 w-full max-w-3xl text-sm leading-7 opacity-85 sm:text-base sm:leading-8">
                  Whether you run a chama, you pay dues in one, or you have not joined yet, the
                  paid list and the payouts sit on one page that every member can open on their phone.
                  Browse a group that is already collecting, or start yours and share a link.
                  SACCOs and cooperatives use that same page.
                </p>
              </Reveal>

              <Reveal delay={REVEAL_STAGGER * 3}>
                <dl ref={ref} className="mt-6 grid w-full justify-items-center gap-6 sm:grid-cols-3">
                {stats.map((stat) => (
                  <CountStat
                    key={stat.label}
                    value={stat.value}
                    label={stat.label}
                    active={inView}
                  />
                ))}
                </dl>
              </Reveal>

              <Reveal delay={REVEAL_STAGGER * 4}>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/communities">
                    Browse Groups
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/create/purpose">Start a Group</Link>
                </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
