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
      <img
        src="/baraza-logo.svg"
        alt={iconOnly ? "Baraza logo" : ""}
        width={icon}
        height={icon}
        className="shrink-0"
      />

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
