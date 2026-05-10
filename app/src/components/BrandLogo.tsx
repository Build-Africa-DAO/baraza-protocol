import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 28, font: "text-base" },
  md: { icon: 36, font: "text-xl" },
  lg: { icon: 48, font: "text-3xl" },
};

export function BrandLogo({ className, iconOnly = false, size = "md" }: BrandLogoProps) {
  const { icon, font } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Icon: three interconnected nodes — Baraza community symbol */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Baraza logo"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#219EBC" />
            <stop offset="100%" stopColor="#8ECAE6" />
          </linearGradient>
          <linearGradient id="node-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFB703" />
            <stop offset="100%" stopColor="#FB8500" />
          </linearGradient>
        </defs>

        {/* Background pill */}
        <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />

        {/* Connection lines */}
        <line x1="20" y1="13" x2="13" y2="26" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="20" y1="13" x2="27" y2="26" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="13" y1="26" x2="27" y2="26" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />

        {/* Top node (leader / coordinator) */}
        <circle cx="20" cy="12" r="4.5" fill="white" />

        {/* Bottom-left node */}
        <circle cx="12" cy="27" r="3.5" fill="white" fillOpacity="0.85" />

        {/* Bottom-right node */}
        <circle cx="28" cy="27" r="3.5" fill="white" fillOpacity="0.85" />

        {/* Center accent dot */}
        <circle cx="20" cy="22" r="2" fill="url(#node-grad)" />
      </svg>

      {!iconOnly && (
        <span
          className={cn(
            "font-display font-bold tracking-tight text-foreground",
            font,
          )}
        >
          Baraza
        </span>
      )}
    </div>
  );
}
