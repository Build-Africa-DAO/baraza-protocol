import { describe, expect, it } from 'vitest';
import { getTokenGateStatus } from '@/lib/tokenGate';
import { recordActiveMembership } from '@/lib/memberships';

describe('token gate', () => {
  it('requires a connected account', () => {
    const status = getTokenGateStatus('c1', null, 'proposal');

    expect(status.allowed).toBe(false);
    expect(status.reason).toBe('connect-account');
  });

  it('allows active members to submit proposals', () => {
    recordActiveMembership('c1', 'member-1');

    const status = getTokenGateStatus('c1', 'member-1', 'proposal');

    expect(status.allowed).toBe(true);
    expect(status.isMember).toBe(true);
  });

  it('blocks non-members from member-gated actions', () => {
    const status = getTokenGateStatus('c1', 'member-2', 'bounty');

    expect(status.allowed).toBe(false);
    expect(status.reason).toBe('join-group');
  });

  it('keeps treasury releases admin-only', () => {
    recordActiveMembership('c1', 'member-3');

    const status = getTokenGateStatus('c1', 'member-3', 'treasury');

    expect(status.allowed).toBe(false);
    expect(status.reason).toBe('admin-only');
  });

  it('allows admins without a community membership', () => {
    const status = getTokenGateStatus('c1', 'admin-1', 'treasury', ['admin-1']);

    expect(status.allowed).toBe(true);
    expect(status.isAdmin).toBe(true);
  });
});
