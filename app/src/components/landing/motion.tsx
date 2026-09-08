import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const REVEAL_DURATION = 0.4;
export const REVEAL_STAGGER = 0.08;
const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: REVEAL_DURATION, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function ParallaxPhoto({
  src,
  alt,
  className,
  imgClassName,
  strength = 0.1,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  strength?: number;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const travel = `${strength * 100}%`;
  const y = useTransform(scrollYProgress, [0, 1], [travel, `-${travel}`]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.img
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={reduce ? undefined : { y, scale: 1 + strength * 2 }}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}
