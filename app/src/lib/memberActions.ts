import type { Decision } from '@/lib/dataStore';

export function filterProposalsToReview(
  decisions: Decision[],
  memberAddress: string,
  now = Date.now(),
): Decision[] {
  return decisions
    .filter((decision) => {
      const closesAt = new Date(`${decision.endsAt}T23:59:59`).getTime();
      return decision.status === 'active'
        && closesAt >= now
        && !decision.voters[memberAddress];
    })
    .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
}

export function getProposalDeadline(
  endsAt: string,
  now = Date.now(),
): { label: string; urgent: boolean } {
  const end = new Date(`${endsAt}T00:00:00`).getTime();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((end - today.getTime()) / 86400000));
  if (days === 0) return { label: 'Closes today', urgent: true };
  if (days === 1) return { label: '1 day left', urgent: true };
  return { label: `${days} days left`, urgent: days <= 3 };
}
