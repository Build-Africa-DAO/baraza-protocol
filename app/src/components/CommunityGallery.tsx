import { Image, Images } from "lucide-react";
import { getCommunityGallery } from "@/lib/communityVisuals";
import { cn } from "@/lib/utils";

interface CommunityGalleryProps {
  communityName: string;
  type?: string | null;
  compact?: boolean;
  className?: string;
}

export default function CommunityGallery({
  communityName,
  type,
  compact = false,
  className,
}: CommunityGalleryProps) {
  const items = getCommunityGallery(type);
  const visibleItems = compact ? items.slice(0, 3) : items;

  return (
    <section className={cn("premium-glass rounded-xl p-5", className)} aria-labelledby="community-gallery-title">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Images className="h-3.5 w-3.5" />
            Community gallery
          </p>
          <h3 id="community-gallery-title" className="mt-1 font-display text-lg font-semibold">
            {communityName} in motion
          </h3>
        </div>
        <span className="hidden rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
          {items.length} photos
        </span>
      </div>

      <div className={cn("grid gap-3", compact ? "md:grid-cols-3" : "md:grid-cols-[1.25fr_0.9fr_0.9fr]")}>
        {visibleItems.map((item, index) => (
          <article
            key={item.title}
            className={cn(
              "group relative min-h-52 overflow-hidden rounded-xl border border-border/70 bg-card",
              !compact && index === 0 && "md:min-h-80",
            )}
          >
            <img
              src={item.src}
              alt={`${communityName}: ${item.title}`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/25 bg-background/70 text-primary backdrop-blur">
                <Image className="h-4 w-4" />
              </div>
              <h4 className="font-display text-base font-bold leading-tight text-foreground">
                {item.title}
              </h4>
              <p className="mt-1 text-xs font-medium leading-5 text-foreground/82">
                {item.caption}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
