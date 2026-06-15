import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ShowReelSection — Baraza video reel.
 *
 * Editorial layout: featured player + numbered typographic index on the right,
 * horizontal sprocket-hole filmstrip below. Dark scoped subtree so the section
 * reads as the "watch this" pause between FlowWalkthrough and CommunityMarquee.
 *
 * To swap videos: change `youtubeId` + the editorial metadata below.
 */

interface ReelVideo {
  youtubeId: string;
  tag: string;
  title: string;
  description: string;
  community: string;
  host: string;
  date: string;
}

const reelVideos: ReelVideo[] = [
  {
    youtubeId: "Y7f98aduVL8",
    tag: "Overview",
    title: "What Baraza does, in two minutes",
    description:
      "DAOs, chamas, and SACCOs on one shared protocol — dues, votes, and treasury without the spreadsheet.",
    community: "Baraza Protocol",
    host: "Aziz · Founder",
    date: "Mar 2026",
  },
  {
    youtubeId: "tMk6JZoYfXY",
    tag: "Setup",
    title: "Launching a chama in four minutes",
    description:
      "Group rules, member invites, and the first M-Pesa round of dues. From phone to live treasury.",
    community: "Mama Mboga Sacco",
    host: "Wanjiku · Treasurer",
    date: "Apr 2026",
  },
  {
    youtubeId: "w-AkLBB43aM",
    tag: "Governance",
    title: "Treasury vote, live",
    description:
      "Members propose a clinic equipment purchase. Quorum bar moves. Funds release on threshold.",
    community: "Kibera Youth Chama",
    host: "Brian · Steward",
    date: "Apr 2026",
  },
  {
    youtubeId: "QdBZY2fkU-0",
    tag: "Payments",
    title: "M-Pesa to on-chain in one tap",
    description:
      "Mobile-money confirmation attaches to the shared ledger before the SMS clears. No reconciliation gap.",
    community: "Stellar Settlement",
    host: "Protocol demo",
    date: "May 2026",
  },
];

const TWO_DIGIT = new Intl.NumberFormat("en-US", {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

/* ─── Player ──────────────────────────────────────────────────────────── */

function VideoPlayer({ video }: { video: ReelVideo }) {
  // Parent remounts this component on activeIndex change (keyed motion wrapper),
  // so initial state IS the reset — no useEffect needed.
  const [playing, setPlaying] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/40 bg-black">
      {playing && !iframeFailed ? (
        <iframe
          key={video.youtubeId}
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setIframeFailed(true)}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <>
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition-all duration-500",
              // Art direction: subtle desaturation on the still so it feels
              // intentional regardless of which thumbnail YouTube serves up.
              "scale-[1.02] saturate-[0.85]",
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

          {iframeFailed ? (
            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 focus-visible:outline-none"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full border border-white/40 bg-black/60 backdrop-blur-sm">
                <ExternalLink className="h-6 w-6 text-white" />
              </span>
              <span className="rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-[11px] font-semibold tracking-wider text-white/90">
                Watch on YouTube
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 focus-visible:outline-none"
              aria-label={`Play ${video.title}`}
            >
              <motion.span
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="relative grid h-16 w-16 place-items-center rounded-full border-2 border-white/80 bg-primary shadow-[0_8px_32px_rgba(255,140,60,0.45)] sm:h-20 sm:w-20"
              >
                <Play className="h-7 w-7 fill-white text-white sm:h-9 sm:w-9" />
                <span className="absolute inset-0 -m-1.5 rounded-full border border-white/15" />
              </motion.span>
              <span className="rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85">
                Press to play
              </span>
            </button>
          )}

          {/* Editorial caption strip — communities + host, not marketing copy. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">
                {video.community} · {video.date}
              </p>
              <p className="mt-1.5 max-w-xl font-display text-xl font-bold leading-tight text-white sm:text-2xl">
                {video.title}
              </p>
              <p className="mt-1 text-[11px] italic text-white/65">{video.host}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Editorial right-column index ────────────────────────────────────── */

function VideoIndex({
  videos,
  activeIndex,
  onSelect,
}: {
  videos: ReelVideo[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <ul className="flex flex-col divide-y divide-border/40">
      {videos.map((video, i) => {
        const active = i === activeIndex;
        return (
          <li key={video.youtubeId}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "group flex w-full items-baseline gap-4 py-4 text-left transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground/90",
              )}
            >
              <span
                className={cn(
                  "font-mono text-xs tabular-nums transition-all",
                  active ? "text-primary" : "text-muted-foreground/70",
                )}
              >
                {TWO_DIGIT.format(i + 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <motion.span
                    aria-hidden
                    animate={
                      reduce ? undefined : { width: active ? 28 : 10, opacity: active ? 1 : 0.45 }
                    }
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="block h-px bg-current"
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">
                    {video.tag}
                  </span>
                </span>
                <span className="mt-1 block font-display text-base font-semibold leading-snug">
                  {video.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {video.community}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ─── Filmstrip ───────────────────────────────────────────────────────── */

const SPROCKET_TOP: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 14px center, rgba(8,8,10,0.92) 4.5px, transparent 5.2px)",
  backgroundSize: "28px 100%",
  backgroundRepeat: "repeat-x",
};

function Filmstrip({
  videos,
  activeIndex,
  onSelect,
}: {
  videos: ReelVideo[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      <div className="h-3 w-full" style={SPROCKET_TOP} aria-hidden />
      <div className="flex gap-3 overflow-x-auto bg-black/45 px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((video, i) => {
          const active = i === activeIndex;
          return (
            <motion.button
              key={video.youtubeId}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Frame ${i + 1}: ${video.title}`}
              aria-current={active ? "true" : undefined}
              initial={reduce ? undefined : { opacity: 0, y: 8 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-md border-2 transition-all",
                "aspect-[16/10] w-40 sm:w-44 md:w-48",
                active
                  ? "border-primary shadow-[0_10px_28px_-12px_rgba(255,140,60,0.6)]"
                  : "border-white/10 hover:border-white/30",
              )}
            >
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                className={cn(
                  "h-full w-full object-cover transition-all duration-500",
                  active ? "saturate-100" : "saturate-0 brightness-75 group-hover:saturate-50",
                )}
              />
              <span
                className={cn(
                  "absolute left-2 top-2 grid h-6 min-w-6 place-items-center rounded-sm px-1 font-mono text-[10px] tabular-nums",
                  active ? "bg-primary text-primary-foreground" : "bg-black/65 text-white/80",
                )}
              >
                {TWO_DIGIT.format(i + 1)}
              </span>
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-4 text-left text-[10px] font-semibold uppercase tracking-wider text-white">
                {video.tag}
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="h-3 w-full" style={SPROCKET_TOP} aria-hidden />
    </div>
  );
}

/* ─── Section ─────────────────────────────────────────────────────────── */

export default function ShowReelSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const activeVideo = reelVideos[activeIndex];

  const cycle = useCallback(
    (delta: number) => {
      setActiveIndex((i) => (i + delta + reelVideos.length) % reelVideos.length);
    },
    [],
  );

  // Arrow-key navigation while focus is inside the section.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!sectionRef.current?.contains(document.activeElement)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        cycle(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        cycle(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cycle]);

  return (
    <section
      ref={sectionRef}
      id="showreel"
      aria-roledescription="carousel"
      aria-label="Baraza show reel"
      className="dark relative isolate overflow-hidden bg-[image:var(--gradient-hero)] text-foreground"
    >
      {/* Grain overlay — atmosphere without an asset. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
      {/* Top + bottom hairlines so the section sits as its own band. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />

      <div className="container relative mx-auto max-w-7xl px-4 py-20 md:py-24">
        {/* Eyebrow + heading — Swahili 'Onyesha' (display/show) ties the
            reel concept to Baraza's African community council identity. */}
        <motion.div
          initial={reduce ? undefined : { y: 18, opacity: 0 }}
          whileInView={reduce ? undefined : { y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mb-10 grid gap-3 md:grid-cols-[auto_1fr] md:items-end md:gap-12"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-primary">
              Onyesha
            </p>
            <p className="mt-1.5 text-[11px] italic tracking-wide text-muted-foreground">
              show reel · selected community footage
            </p>
          </div>
          <div>
            <h2 className="max-w-2xl font-display text-3xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-4xl md:text-5xl">
              <span className="block">Watch a chama</span>
              <span className="block text-primary">run itself.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Real treasuries, real votes, real members. Pulled straight from communities running
              on Baraza — no stock footage.
            </p>
          </div>
        </motion.div>

        {/* Main row: player + editorial index */}
        <motion.div
          initial={reduce ? undefined : { y: 28, opacity: 0 }}
          whileInView={reduce ? undefined : { y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="grid gap-6 md:gap-10 lg:grid-cols-[1.55fr_1fr]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={reduce ? undefined : { opacity: 0, scale: 0.985 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              <VideoPlayer video={activeVideo} />
              {/* Description sits beneath the still — feels like a magazine caption. */}
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {activeVideo.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Reel index · {TWO_DIGIT.format(activeIndex + 1)} of {TWO_DIGIT.format(reelVideos.length)}
              </p>
              <p className="text-[10px] tracking-wide text-muted-foreground/70">
                ← → to navigate
              </p>
            </div>
            <VideoIndex
              videos={reelVideos}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            />
          </div>
        </motion.div>

        {/* Filmstrip */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10"
        >
          <Filmstrip videos={reelVideos} activeIndex={activeIndex} onSelect={setActiveIndex} />
        </motion.div>

        {/* Post-watch CTA */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/40 pt-6 sm:flex-row sm:items-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Seen enough? Start one in four minutes. M-Pesa or account — your call.
          </p>
          <Link
            to="/create"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/15 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Start your community
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
