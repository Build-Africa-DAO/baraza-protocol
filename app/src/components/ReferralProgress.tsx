/**
 * Referral progress signal — Nia's filing 2026-06-19 (id 4c43).
 *
 * From the filing:
 *   "USSD: one line under My Community — 'Members you invited: Grace —
 *    month 2 of 3.' Web: the same. No BRZA amount visible. The relationship,
 *    named. Something the referrer can tend."
 *
 * The 90-day + 3-payment lock leaves the referrer in silence by default;
 * this card breaks that silence WITHOUT showing the BRZA reward, because
 * (per Nia) in chama culture a referral is a vouching, not a transaction.
 *
 * MEMBER-VOICE GAP CARRIED: obs-corpus-220 first-year voices on the felt
 * experience of arriving vs being confirmed have NOT been queried for this
 * copy. Per Nia's filing, that query belongs on the implementation ticket
 * before final referee UX is written. This component renders the referrer
 * side, which is less voice-blocked but still benefits from the corpus.
 */

import { HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReferralProgressEntry {
  /** Display name of the person the wallet invited. */
  refereeName: string;
  /** 0-based payment count, capped at 3 by the council gate. */
  paymentsMade: number;
  /** Days since the referee joined; the gate clears at 90. */
  daysSinceJoined: number;
  /** Set when the referee has cleared all gate conditions. */
  cleared?: boolean;
}

interface ReferralProgressProps {
  /**
   * Members this wallet invited. `undefined` renders the empty state.
   * Empty array renders nothing (the referrer simply hasn't invited yet).
   */
  invites?: ReferralProgressEntry[];
  className?: string;
}

function progressLine(entry: ReferralProgressEntry): string {
  if (entry.cleared) {
    return `${entry.refereeName} — confirmed`;
  }
  const monthsDone = Math.min(3, Math.max(1, entry.paymentsMade || 1));
  return `${entry.refereeName} — month ${monthsDone} of 3`;
}

export function ReferralProgress({ invites, className }: ReferralProgressProps) {
  if (invites === undefined) {
    // Data source not yet wired (referrals table pending Phase 6 ship). Render
    // the slot so the referrer knows it's coming; don't render BRZA copy.
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed p-4',
          className,
        )}
        aria-label="Members you invited — coming soon"
      >
        <div className="mb-2 flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-secondary" />
          <p className="font-display text-xs font-semibold uppercase tracking-widest">
            Members you invited
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          When you invite someone, you'll see their progress here while they settle
          into the community. The relationship matters, not the count.
        </p>
      </div>
    );
  }

  if (invites.length === 0) return null;

  return (
    <div
      className={cn('rounded-lg border p-4', className)}
      aria-label={`Members you invited — ${invites.length}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <HeartHandshake className="h-4 w-4 text-secondary" />
        <p className="font-display text-xs font-semibold uppercase tracking-widest">
          Members you invited
        </p>
      </div>
      <ul className="space-y-1.5">
        {invites.map((entry) => (
          <li
            key={entry.refereeName}
            data-cleared={entry.cleared ? 'true' : 'false'}
            className={cn(
              'text-xs leading-relaxed',
              entry.cleared ? 'text-foreground font-semibold' : 'text-muted-foreground',
            )}
          >
            {progressLine(entry)}
          </li>
        ))}
      </ul>
      {/* Intentional: NO BRZA amount during the 90-day lock. The relationship,
          named. (Nia filing 2026-06-19T03-00-00Z-4c43.) */}
    </div>
  );
}

export default ReferralProgress;

/**
 * USSD copy generator — matches Nia's literal spec:
 *   "Members you invited: Grace — month 2 of 3"
 * One line per invitee; USSD character budget is the caller's problem.
 */
export function formatReferralProgressForUssd(invites: ReferralProgressEntry[]): string[] {
  if (invites.length === 0) return [];
  return invites.map((entry) => `Members you invited: ${progressLine(entry)}`);
}
