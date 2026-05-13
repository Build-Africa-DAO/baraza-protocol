import { cn } from "@/lib/utils";
import { getCommunityBannerImage } from "@/lib/communityVisuals";

interface CommunityBannerProps {
  type?: string | null;
  imageUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function CommunityBanner({ type, imageUrl, className, children }: CommunityBannerProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-primary/15 bg-card", className)}>
      <img
        src={imageUrl ?? getCommunityBannerImage(type)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/82 to-background/28" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/92 via-transparent to-background/30" />
      <div className="absolute inset-0 bg-primary/8 mix-blend-soft-light" />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
