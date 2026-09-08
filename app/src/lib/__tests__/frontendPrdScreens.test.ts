import { describe, expect, it } from 'vitest';
import { paymentRailStatus } from '@/lib/healthReady';
import { extractInviteCode } from '@/lib/inviteAccept';
import { planTelcoTranches } from '@/lib/payments/slippage';
import { saccoBadgeCopy } from '@/components/SaccoComplianceBadge';

describe('paymentRailStatus', () => {
  it('treats Horizon outage as a degraded payout rail, not a hard outage', () => {
    expect(paymentRailStatus()).toBe('unknown');
    expect(paymentRailStatus({ tier: 'soft', status: 'healthy', latency_ms: 12 })).toBe('healthy');
    expect(paymentRailStatus({ tier: 'soft', status: 'unhealthy', latency_ms: 4000 })).toBe('degraded');
  });
});

describe('extractInviteCode', () => {
  it('reads invite query params and raw 6-32 codes', () => {
    expect(extractInviteCode('https://barazaprotocol.com/join/chama-9?invite=abc123xyz')).toBe('abc123xyz');
    expect(extractInviteCode('inv_1_ab12cd')).toBe('inv_1_ab12cd');
    expect(extractInviteCode('nope')).toBe(null);
  });
});

describe('planTelcoTranches', () => {
  it('splits amounts above the KES 250,000 Safaricom ceiling', () => {
    const under = planTelcoTranches(25_000_000n);
    expect(under.exceeds).toBe(false);
    expect(under.trancheCount).toBe(1);

    const over = planTelcoTranches(50_000_000n);
    expect(over.exceeds).toBe(true);
    expect(over.trancheCount).toBe(2);
    expect(over.amountsMinor[0]).toBe(25_000_000n);
    expect(over.amountsMinor[1]).toBe(25_000_000n);
  });
});

describe('saccoBadgeCopy', () => {
  it('hides the badge for non-cooperative groups', () => {
    expect(saccoBadgeCopy('VERIFIED', 'savings')).toBeNull();
  });

  it('maps statutory statuses for SACCO groups', () => {
    expect(saccoBadgeCopy('VERIFIED', 'sacco')?.label).toBe('Verified SACCO');
    expect(saccoBadgeCopy('PENDING_REVIEW', 'cooperative')?.label).toBe('Verification pending');
    expect(saccoBadgeCopy('UNLICENSED', 'sacco')?.label).toBe('Unlicensed cooperative');
    expect(saccoBadgeCopy('EXPIRED', 'sacco')?.label).toBe('License expired');
  });
});
