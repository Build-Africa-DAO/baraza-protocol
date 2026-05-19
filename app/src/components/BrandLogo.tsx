import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 30, font: "text-base" },
  md: { icon: 38, font: "text-xl" },
  lg: { icon: 48, font: "text-3xl" },
};

export function BrandLogo({ className, iconOnly = false, size = "md" }: BrandLogoProps) {
  const { icon, font } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5 leading-none", className)}>
      <img
        src="/baraza-logo.svg"
        alt={iconOnly ? "Baraza logo" : ""}
        width={icon}
        height={icon}
        className="shrink-0 rounded-[9px]"
      />

      {!iconOnly && (
        <span
          className={cn(
            "font-display font-extrabold tracking-tight text-foreground",
            font,
          )}
        >
          Baraza
        </span>
      )}
    </div>
  );
}
