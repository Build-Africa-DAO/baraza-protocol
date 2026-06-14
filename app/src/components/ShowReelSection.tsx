import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelVideo {
  youtubeId: string;
  title: string;
  description: string;
  tag?: string;
}

// Replace youtubeId values with your actual YouTube video IDs
const reelVideos: ReelVideo[] = [
  {
    youtubeId: "Y7f98aduVL8",
    title: "Baraza Protocol — Platform Overview",
    description: "How DAOs, chamas, and SACCOs manage dues, votes, and treasury on one shared protocol.",
    tag: "Overview",
  },
  {
    youtubeId: "tMk6JZoYfXY",
    title: "Launch a DAO in Minutes",
    description: "Set group rules, invite members, and collect the first round of M-Pesa dues.",
    tag: "Setup",
  },
  {
    youtubeId: "w-AkLBB43aM",
    title: "Treasury Governance in Action",
    description: "Members submit proposals, vote, and watch the quorum bar move in real time.",
    tag: "Governance",
  },
  {
    youtubeId: "QdBZY2fkU-0",
    title: "M-Pesa to On-Chain Record",
    description: "Mobile-money confirmations attach to the shared ledger instantly.",
    tag: "Payments",
  },
];

function VideoThumbnail({
  video,
  active,
  onClick,
}: {
  video: ReelVideo;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200",
        active
          ? "border-primary/60 bg-primary/10"
          : "border-border/50 bg-surface/60 hover:border-primary/30 hover:bg-surface",
      )}
    >
      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border border-border/50">
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
          alt={video.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
            active ? "opacity-0" : "opacity-100 group-hover:opacity-60",
          )}
        >
          <Play className="h-4 w-4 fill-white text-white" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {video.tag && (
          <span className="mb-1 inline-flex rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {video.tag}
          </span>
        )}
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">{video.title}</p>
      </div>

      <ChevronRight
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200",
          active ? "text-primary" : "group-hover:text-primary group-hover:translate-x-0.5",
        )}
      />
    </button>
  );
}

function VideoPlayer({ video }: { video: ReelVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-black">
      {playing ? (
        <iframe
          key={video.youtubeId}
          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <>
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
            alt={video.title}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 focus-visible:outline-none"
            aria-label={`Play ${video.title}`}
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="grid h-16 w-16 place-items-center rounded-full border-2 border-white/80 bg-primary shadow-lg shadow-primary/40 sm:h-20 sm:w-20"
            >
              <Play className="h-7 w-7 fill-white text-white sm:h-9 sm:w-9" />
            </motion.div>
            <span className="rounded-full border border-white/20 bg-black/50 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
              Watch now
            </span>
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="font-display text-lg font-bold leading-tight text-white sm:text-2xl">
              {video.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/70 sm:text-sm">
              {video.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function ShowReelSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeVideo = reelVideos[activeIndex];

  return (
    <section className="relative py-16 md:py-20" id="showreel">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Show reel</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
            See Baraza in action
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            Watch how DAOs and chamas launch treasuries, run transparent votes, and pay members — all from a phone.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start"
        >
          {/* Featured player */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <VideoPlayer video={activeVideo} />
            </motion.div>
          </AnimatePresence>

          {/* Video list */}
          <div className="flex flex-col gap-2.5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              More videos
            </p>
            {reelVideos.map((video, index) => (
              <VideoThumbnail
                key={video.youtubeId}
                video={video}
                active={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
