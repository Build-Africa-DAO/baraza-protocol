import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
  borderWidth?: number;
}

/**
 * Animated glowing border that pulses around its container.
 * Uses a simple box-shadow animation — compatible across all browsers.
 */
export function BorderBeam({
  className,
  duration = 3,
  colorFrom = "#219EBC",
  colorTo = "#FFB703",
  borderWidth = 1,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0",
        "group-hover:opacity-100 transition-opacity duration-500",
        className,
      )}
      style={{
        border: `${borderWidth}px solid transparent`,
        backgroundImage: `linear-gradient(hsl(var(--card)), hsl(var(--card))), linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        animation: `pulse-glow ${duration}s ease-in-out infinite`,
      }}
    />
  );
}
