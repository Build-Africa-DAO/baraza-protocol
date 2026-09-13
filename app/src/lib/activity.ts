import { getSupabaseClient } from '@/lib/communities';
import type { ActivityEvent } from '@/lib/dataStore';

/**
 * Recent movement in a group, read from `community_audit_logs` (publicly
 * readable). The backend writes a row for officer changes, invites and joins
 * via invite. Payments, votes and proposals are not written there yet, so
 * the feed is honest about what it holds rather than padded.
 */

export interface AuditLogRow {
  id: string;
  community_id: string;
  actor_wallet: string | null;
  action_type: string;
  target_subject: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export const AUDIT_LOG_COLUMNS = 'id,community_id,actor_wallet,action_type,target_subject,details,created_at';

function shortId(value: string | null | undefined): string {
  if (!value) return 'A member';
  if (value.length <= 10) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

/** Plain sentence and feed type for a backend audit action. */
export function describeAuditAction(row: AuditLogRow): { type: ActivityEvent['type']; message: string } {
  const role = typeof row.details?.newRole === 'string' ? String(row.details.newRole) : undefined;
  switch (row.action_type) {
    case 'MEMBER_JOINED_VIA_INVITE':
      return { type: 'member_joined', message: `${shortId(row.target_subject ?? row.actor_wallet)} joined with an invite` };
    case 'INVITE_CREATED':
      return { type: 'invite_created', message: `${shortId(row.actor_wallet)} created an invite link` };
    case 'OFFICER_ASSIGNED':
      return { type: 'officer_changed', message: `${shortId(row.target_subject)} was made ${role ? `an ${role}` : 'an officer'}` };
    case 'OFFICER_REVOKED':
      return { type: 'officer_changed', message: `${shortId(row.target_subject)} stepped down as ${role ? `an ${role}` : 'an officer'}` };
    default:
      return { type: 'other', message: row.action_type.toLowerCase().replace(/_/g, ' ') };
  }
}

export function activityFromAuditRow(row: AuditLogRow): ActivityEvent {
  const { type, message } = describeAuditAction(row);
  return {
    id: row.id,
    communityId: row.community_id,
    type,
    message,
    timestamp: new Date(row.created_at).getTime(),
  };
}

export async function listCommunityActivity(communityId: string, limit = 20): Promise<ActivityEvent[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('community_audit_logs')
    .select(AUDIT_LOG_COLUMNS)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as AuditLogRow[]).map(activityFromAuditRow);
}
