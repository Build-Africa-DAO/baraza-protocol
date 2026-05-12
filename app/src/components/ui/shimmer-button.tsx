import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "rgba(255,255,255,0.4)",
      background = "linear-gradient(135deg, #9DD9D2, #FFF8F0, #F4D06F)",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--shimmer-color": shimmerColor,
            "--background": background,
          } as React.CSSProperties
        }
        className={cn(
          "group relative flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap",
          "rounded-xl px-7 py-3 font-semibold text-white",
          "bg-[image:var(--background)]",
          "transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_hsl(30_100%_53%/0.28)]",
          "active:scale-[0.98]",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* shimmer layer */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div
            className={cn(
              "absolute inset-[-100%]",
              "animate-[shimmer-spin_2.5s_linear_infinite]",
              "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              "bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,var(--shimmer-color)_50%,transparent_100%)]",
            )}
          />
        </div>
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  },
);
ShimmerButton.displayName = "ShimmerButton";
