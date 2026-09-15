import { Link } from 'react-router-dom';
import { InitialsTile } from '@/components/app/ListRow';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { formatMajor } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * A group in Browse (§13.8). Name, kind, member count when real, dues when
 * real, and two actions. No stock photo, no funds figure, no bounty strip: a
 * card is not a brochure.
 */
export const BROWSE_KINDS: ReadonlyArray<{ key: string; label: string; matches: string[] }> = [
  { key: 'chama', label: 'Chama', matches: ['chama', 'savings', 'stokvel', 'merry-go-round', 'table-banking'] },
  { key: 'sacco', label: 'SACCO', matches: ['sacco', 'housing', 'credit-union'] },
  { key: 'cooperative', label: 'Cooperative', matches: ['cooperative', 'coop', 'farmers', 'producer'] },
  { key: 'welfare', label: 'Welfare', matches: ['welfare', 'burial', 'mutual-aid', 'community-service'] },
  { key: 'investment', label: 'Investment', matches: ['investment', 'business', 'venture', 'professional'] },
];

export function browseKindOf(type: string): string | null {
  const lower = type.toLowerCase();
  return BROWSE_KINDS.find((kind) => kind.matches.some((match) => lower.includes(match)))?.key ?? null;
}

export function browseKindLabel(type: string): string {
  const key = browseKindOf(type);
  return BROWSE_KINDS.find((kind) => kind.key === key)?.label ?? type.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

interface CommunityCardProps {
  id: string;
  name: string;
  type: string;
  description: string;
  membershipFee: number;
  memberCount: number;
  image: string;
  currency?: string;
  className?: string;
}

export default function CommunityCard({ id, name, type, description, membershipFee, memberCount, image, currency, className }: CommunityCardProps) {
  return (
    <article className={cn('baraza-card flex h-full flex-col p-5', className)}>
      <div className="flex items-start gap-3">
        <InitialsTile initials={image} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold">{name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusChip kind="info" icon={null} label={browseKindLabel(type)} />
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{description}</p>
      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {memberCount > 0 ? (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Members</dt>
            <dd className="font-semibold tabular-nums">{memberCount}</dd>
          </div>
        ) : null}
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Dues</dt>
          <dd className="font-semibold tabular-nums">{membershipFee > 0 ? `${formatMajor(membershipFee, currency)} / month` : 'Free to join'}</dd>
        </div>
      </dl>
      <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
        <Button asChild variant="outline">
          <Link to={`/dashboard/${id}`}>View Group</Link>
        </Button>
        <Button asChild>
          <Link to={`/join/${id}`}>Join This Group</Link>
        </Button>
      </div>
    </article>
  );
}
