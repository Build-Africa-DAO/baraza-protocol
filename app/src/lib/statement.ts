/**
 * The group's money trail, read from `GET /api/communities/statement` — the
 * same double-entry journal the CSV export serves, parsed as NDJSON so the
 * Money screen and the export can never disagree (§13.18, audit G72).
 *
 * The API returns raw journal rows. This module turns them into rows a
 * member can read: when, what kind of movement, how much, in which currency.
 * It does not compute balances; the pooled total still comes from the
 * community record, and reserved/available stay "Not available yet" until the
 * server splits them.
 */

import { apiFetch } from '@/lib/api';

export interface JournalEntry {
  id?: string;
  created_at: string;
  reference_id: string;
  reference_type: string;
  debit_account: string;
  credit_account: string;
  amount_minor: number;
  currency?: string | null;
  memo?: string | null;
}

export type MovementKind = 'in' | 'out' | 'other';

export interface StatementRow {
  id: string;
  at: string;
  /** Sentence-case label a member understands: "Paid in", "Sent", "Fee". */
  label: string;
  kind: MovementKind;
  amountMinor: number;
  currency: string;
  reference: string;
}

export type StatementResult =
  | { ok: true; rows: StatementRow[]; hasMore: boolean }
  | { ok: false; status: number; message: string };

/** Which side of the ledger the group's own money sits on. */
function isTreasury(account: string): boolean {
  return /treasury|vault|pool|group/i.test(account);
}

const LABELS: Array<{ test: RegExp; label: string; kind: MovementKind }> = [
  { test: /payment_order|dues|contribution|deposit|membership/i, label: 'Paid in', kind: 'in' },
  { test: /offramp|off_ramp|disbursement|payout|release|minisend|kotani/i, label: 'Sent', kind: 'out' },
  { test: /fee|carrier|platform/i, label: 'Fee', kind: 'out' },
  { test: /refund|reversal/i, label: 'Refund', kind: 'other' },
  { test: /escrow|reserve/i, label: 'Reserved', kind: 'other' },
];

export function describeEntry(entry: JournalEntry): { label: string; kind: MovementKind } {
  for (const rule of LABELS) {
    if (rule.test.test(entry.reference_type) || (entry.memo && rule.test.test(entry.memo))) {
      return { label: rule.label, kind: rule.kind };
    }
  }
  if (isTreasury(entry.credit_account) && !isTreasury(entry.debit_account)) return { label: 'Paid in', kind: 'in' };
  if (isTreasury(entry.debit_account) && !isTreasury(entry.credit_account)) return { label: 'Sent', kind: 'out' };
  return { label: 'Movement', kind: 'other' };
}

export function rowFromEntry(entry: JournalEntry, index: number): StatementRow {
  const { label, kind } = describeEntry(entry);
  return {
    id: entry.id ?? `${entry.reference_id}-${index}`,
    at: entry.created_at,
    label,
    kind,
    amountMinor: Number(entry.amount_minor) || 0,
    currency: (entry.currency || 'KES').toUpperCase(),
    reference: entry.reference_id,
  };
}

/** Parse the NDJSON body. Malformed lines are skipped rather than failing the page. */
export function parseStatementNdjson(text: string): JournalEntry[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .flatMap((line) => {
      try {
        const parsed = JSON.parse(line) as Partial<JournalEntry>;
        if (!parsed || typeof parsed.created_at !== 'string') return [];
        return [parsed as JournalEntry];
      } catch {
        return [];
      }
    });
}

export async function fetchStatement(
  communityId: string,
  headers: Record<string, string>,
  options: { limit?: number } = {},
): Promise<StatementResult> {
  const params = new URLSearchParams({ communityId, format: 'ndjson' });
  const result = await apiFetch<string>(`/api/communities/statement?${params.toString()}`, { headers, parse: 'text' });
  if (!result.ok) {
    const message =
      result.error.kind === 'auth' || result.error.kind === 'forbidden'
        ? 'Sign in as a member of this group to see its money.'
        : result.error.message;
    return { ok: false, status: result.status, message };
  }
  const entries = parseStatementNdjson(result.data ?? '');
  const rows = entries.map(rowFromEntry).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const limit = options.limit ?? rows.length;
  const hasMoreHeader = result.response.headers.get('x-has-more-records') === 'true' || result.response.headers.get('x-total-count') === '5000';
  return { ok: true, rows: rows.slice(0, limit), hasMore: rows.length > limit || hasMoreHeader };
}
