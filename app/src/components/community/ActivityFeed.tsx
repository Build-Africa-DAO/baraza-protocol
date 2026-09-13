import { ListRow } from '@/components/app/ListRow';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusChip } from '@/components/ui/status-chip';
import { useActivities } from '@/hooks/useBarazaData';
import { formatAccountDate } from '@/lib/accountLocale';
import type { ActivityEvent } from '@/lib/dataStore';

/**
 * What has happened in the group, as plain rows (§13.12). No animation, no
 * colour-coded icons: a label chip, the sentence, the date. Empty when the
 * store has nothing, never a placeholder.
 */
const LABEL: Record<ActivityEvent['type'], string> = {
  member_joined: 'Joined',
  decision_created: 'Proposed',
  vote_cast: 'Voted',
  decision_completed: 'Decided',
  fund_deposit: 'Paid in',
  bounty_opened: 'Bounty',
};

interface ActivityFeedProps {
  communityId: string;
  limit?: number;
}

export default function ActivityFeed({ communityId, limit = 10 }: ActivityFeedProps) {
  const activities = useActivities(communityId);
  const shown = activities.slice(0, limit);

  if (shown.length === 0) {
    return <EmptyState title="Nothing Has Happened Yet" body="Joins, payments and votes appear here as they happen." />;
  }

  return (
    <ul className="space-y-2">
      {shown.map((event) => (
        <li key={event.id}>
          <ListRow
            title={event.message}
            meta={formatAccountDate(event.timestamp, undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            trailing={<StatusChip kind="info" icon={null} label={LABEL[event.type] ?? 'Activity'} />}
          />
        </li>
      ))}
    </ul>
  );
}
