import { describe, expect, it } from 'vitest';
import { describeEntry, parseStatementNdjson, rowFromEntry } from '@/lib/statement';

const entry = {
  created_at: '2026-09-12T10:00:00Z',
  reference_id: 'ord_123',
  reference_type: 'payment_order',
  debit_account: 'clearing:mpesa',
  credit_account: 'treasury:community-1',
  amount_minor: 50000,
  currency: 'kes',
};

describe('parseStatementNdjson', () => {
  it('parses one row per line and skips comments and junk', () => {
    const text = `${JSON.stringify(entry)}\n# AUDIT WARNING\nnot json\n\n${JSON.stringify({ ...entry, reference_id: 'ord_124' })}\n`;
    const rows = parseStatementNdjson(text);
    expect(rows).toHaveLength(2);
    expect(rows[1].reference_id).toBe('ord_124');
  });
});

describe('describeEntry', () => {
  it('reads member words from the reference type', () => {
    expect(describeEntry(entry)).toEqual({ label: 'Paid in', kind: 'in' });
    expect(describeEntry({ ...entry, reference_type: 'minisend_offramp' })).toEqual({ label: 'Sent', kind: 'out' });
    expect(describeEntry({ ...entry, reference_type: 'platform_fee' })).toEqual({ label: 'Fee', kind: 'out' });
  });
  it('falls back to which side the treasury is on', () => {
    expect(describeEntry({ ...entry, reference_type: 'x', debit_account: 'treasury:1', credit_account: 'member:2' }).kind).toBe('out');
    expect(describeEntry({ ...entry, reference_type: 'x', debit_account: 'a', credit_account: 'b' })).toEqual({ label: 'Movement', kind: 'other' });
  });
});

describe('rowFromEntry', () => {
  it('normalises currency and keeps the reference', () => {
    const row = rowFromEntry(entry, 0);
    expect(row.currency).toBe('KES');
    expect(row.amountMinor).toBe(50000);
    expect(row.reference).toBe('ord_123');
    expect(row.id).toBe('ord_123-0');
  });
});
