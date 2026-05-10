import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <span
      style={{ "--shiny-width": `${shimmerWidth}px` } as CSSProperties}
      className={cn(
        "animate-shining bg-clip-text bg-no-repeat [background-position:0_0]",
        "[background-size:var(--shiny-width)_100%]",
        "[transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",
        "bg-gradient-to-r from-transparent via-white/90 via-50% to-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
