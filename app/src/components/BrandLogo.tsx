import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 26, font: "text-sm" },
  md: { icon: 34, font: "text-lg" },
  lg: { icon: 44, font: "text-2xl" },
};

export function BrandLogo({ className, iconOnly = false, size = "md" }: BrandLogoProps) {
  const { icon, font } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2 leading-none", className)}>
      {iconOnly && (
        <img
          src="/baraza-logo-v2.svg"
          alt="Baraza logo"
          width={icon}
          height={icon}
          className="shrink-0"
        />
      )}

      {!iconOnly && (
        <span
          className={cn("font-display font-black", font)}
          style={{ letterSpacing: "0" }}
        >
          <span className="text-foreground">bara</span>
          <span className="text-primary">za</span>
        </span>
      )}
    </div>
  );
}
