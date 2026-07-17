import { Link } from "react-router-dom";
import { ArrowRight, MessageSquareText, UserPlus, Users } from "lucide-react";
import { formatKSh } from "@/lib/utils";
import { getCommunityBannerImage } from "@/lib/communityVisuals";

interface CommunityCardProps {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  description: string;
  membershipFee: number;
  memberCount: number;
  activeDecisions: number;
  image: string;
}

export default function CommunityCard({
  id,
  name,
  type,
  typeLabel,
  description,
  membershipFee,
  memberCount,
  activeDecisions,
  image,
}: CommunityCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/65 bg-card shadow-[var(--shadow-card)] transition-colors hover:border-border">
      <div className="relative h-36 overflow-hidden bg-muted">
        <img
          src={getCommunityBannerImage(type)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/15 to-transparent" />
        <div className="absolute bottom-3 left-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-border/70 bg-background/90 text-sm font-bold text-foreground">
            {image}
          </span>
          <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="text-balance font-display text-xl font-bold leading-snug text-foreground">{name}</h2>
        <p className="mt-3 line-clamp-3 text-pretty text-sm leading-6 text-muted-foreground">{description}</p>

        <dl className="mt-5 grid grid-cols-3 gap-4 border-y border-border/55 py-4">
          <div>
            <dt className="text-xs text-muted-foreground">Members</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-muted-foreground" />
              {memberCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Each month</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatKSh(membershipFee)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Open decisions</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              {activeDecisions}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-muted-foreground">Group funds and decisions are visible to members.</p>

        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
          <Link
            to={`/dashboard/${id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            View group
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/join/${id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <UserPlus className="h-4 w-4" />
            Ask to join
          </Link>
        </div>
      </div>
    </article>
  );
}
