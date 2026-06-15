/**
 * Member badges — reputation chips derived from a member's actual
 * activity on Baraza. Visible on the Profile page and (eventually) on
 * each member card inside a community.
 *
 * Three principles:
 *
 *   1. Earn from doing, not from time. Every badge maps to a concrete
 *      behavior the member actually took (joined, expanded, persisted).
 *   2. Derivable from what we already have. v1 ships only badges that
 *      can be computed from data the client already loads on Profile.
 *      Anything that needs new schema is marked `derivable: false`
 *      and rendered as a locked teaser so members see what's possible.
 *   3. No badge has a token reward attached yet — they're status only.
 *      That keeps the cap-table conversation separate from the
 *      gamification conversation. Token-bearing badges (founder bounty,
 *      streak multipliers) come later, behind their own design call.
 */

export type BadgeId =
  | 'trailblazer'
  | 'convener'
  | 'veteran'
  | 'founder'
  | 'quorum-keeper';

export interface BadgeMeta {
  id: BadgeId;
  label: string;
  /** One-line user-facing description shown under the badge. */
  description: string;
  /** Plain-language criteria for earning it. */
  criteria: string;
  /** Emoji or text glyph rendered as the badge icon. */
  glyph: string;
  /** Hue used for the badge chip. `primary` is brand orange. */
  tone: 'primary' | 'secondary' | 'muted';
  /**
   * `true`  → can be computed client-side from data the Profile page
   *           already loads (memberships, joinedAt timestamps).
   * `false` → blocked on backend work (vote counts, communities.created_by
   *           exposure). Surfaced as a locked teaser with criteria copy.
   */
  derivable: boolean;
}

export const BADGES: Record<BadgeId, BadgeMeta> = {
  trailblazer: {
    id: 'trailblazer',
    label: 'Trailblazer',
    description: 'First step into Baraza governance.',
    criteria: 'Join your first community.',
    glyph: '🌱',
    tone: 'primary',
    derivable: true,
  },
  convener: {
    id: 'convener',
    label: 'Convener',
    description: 'Active across multiple communities.',
    criteria: 'Hold active membership in 3 or more communities.',
    glyph: '🤝',
    tone: 'primary',
    derivable: true,
  },
  veteran: {
    id: 'veteran',
    label: 'Veteran',
    description: '90+ days of continuous membership.',
    criteria: 'Stay an active member for at least 90 days.',
    glyph: '🛡️',
    tone: 'secondary',
    derivable: true,
  },
  founder: {
    id: 'founder',
    label: 'Founder',
    description: 'Started a community on Baraza.',
    criteria: 'Create a community that survives its first 90 days.',
    glyph: '⭐',
    tone: 'primary',
    derivable: false, // needs communities.created_by exposed on the client Community type
  },
  'quorum-keeper': {
    id: 'quorum-keeper',
    label: 'Quorum-keeper',
    description: 'Reliable voter — keeps groups decisive.',
    criteria: 'Vote on at least 5 community proposals.',
    glyph: '🗳️',
    tone: 'secondary',
    derivable: false, // needs per-member vote count from the votes table
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface BadgeDerivationInput {
  /** Active-or-pending memberships the wallet holds. */
  activeMembershipCount: number;
  /** Earliest joinedAt across all memberships, ISO 8601. Null = no memberships. */
  earliestJoinedAt: string | null;
}

export interface BadgeDerivationResult {
  /** Badges the member has earned. */
  earned: BadgeId[];
  /** Badges the member has not yet earned, but the criteria are computable. */
  inProgress: BadgeId[];
  /** Badges blocked on backend work. Always rendered locked. */
  locked: BadgeId[];
}

/**
 * Determine which badges a member has earned from what the client
 * already knows. Pure function — no fetches, no side effects.
 */
export function deriveBadges(input: BadgeDerivationInput): BadgeDerivationResult {
  const earned: BadgeId[] = [];
  const inProgress: BadgeId[] = [];

  // trailblazer
  if (input.activeMembershipCount >= 1) {
    earned.push('trailblazer');
  } else {
    inProgress.push('trailblazer');
  }

  // convener
  if (input.activeMembershipCount >= 3) {
    earned.push('convener');
  } else {
    inProgress.push('convener');
  }

  // veteran
  if (input.earliestJoinedAt) {
    const ageDays = (Date.now() - new Date(input.earliestJoinedAt).getTime()) / DAY_MS;
    if (ageDays >= 90) earned.push('veteran');
    else inProgress.push('veteran');
  } else {
    inProgress.push('veteran');
  }

  // Always-locked (need backend support)
  const locked: BadgeId[] = [];
  for (const [id, meta] of Object.entries(BADGES) as Array<[BadgeId, BadgeMeta]>) {
    if (!meta.derivable) locked.push(id);
  }

  return { earned, inProgress, locked };
}
