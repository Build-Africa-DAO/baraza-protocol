import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AnimationStyle = "from-center" | "from-bottom" | "from-top";

interface HeroVideoDialogProps {
  animationStyle?: AnimationStyle;
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  className?: string;
}

const animations: Record<AnimationStyle, object> = {
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
};

export function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Baraza community video",
  className,
}: HeroVideoDialogProps) {
  const [open, setOpen] = useState(false);
  const anim = animations[animationStyle];

  return (
    <div className={cn("relative", className)}>
      {/* Thumbnail trigger */}
      <div
        className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        onClick={() => setOpen(true)}
        role="button"
        aria-label="Play community video"
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          className="w-full rounded-2xl transition-all duration-500 group-hover:scale-105 group-hover:brightness-75"
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 shadow-xl group-hover:scale-110 group-hover:bg-black/50 transition-all duration-300">
            <PlayIcon className="size-7 text-white fill-white ml-1" />
          </div>
        </div>
        {/* Bottom caption */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white/90 text-sm font-medium">See how Baraza communities work</p>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              {...anim}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-50 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors border border-white/20"
                aria-label="Close video"
              >
                <XIcon className="size-4" />
              </button>
              <iframe
                src={videoSrc}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                title="Baraza community video"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
