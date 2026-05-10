import type { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon: ElementType;
  iconClassName?: string;
  description: string;
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  iconClassName,
  description,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl",
        "bg-card border border-border/60",
        "shadow-[0_4px_24px_-4px_hsl(200_97%_6%/0.5)]",
        "transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_hsl(193_70%_43%/0.12)]",
        className,
      )}
    >
      {/* Background visual */}
      {background && (
        <div className="absolute inset-0 transition-all duration-500 group-hover:scale-105">
          {background}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-2 p-6 mt-auto">
        <div
          className={cn(
            "mb-1 w-11 h-11 rounded-xl flex items-center justify-center",
            "bg-primary/10 transition-transform duration-300 group-hover:scale-110",
          )}
        >
          <Icon className={cn("w-5 h-5 text-primary", iconClassName)} />
        </div>
        <h3 className="font-display text-base font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
