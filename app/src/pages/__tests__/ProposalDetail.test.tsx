import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProposalDetail from '@/pages/ProposalDetail';

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));

const account = {
  authenticated: true,
  configured: true,
  ready: true,
  accountId: 'acct-1',
  displayName: 'Amani K.',
  getAccessToken: async () => null,
  login: vi.fn(),
};
vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => account,
  useOptionalAccount: () => account,
}));

let membership = { isMember: false, status: null as string | null, isOfficer: false, isLoading: false, source: 'none' as 'none' | 'api' | 'wallet', duesOwedMinor: null, currency: null, role: null, duesStatus: null, vaultBalanceMinor: null };
vi.mock('@/hooks/useGroupMembership', () => ({
  useGroupMembership: () => membership,
}));
vi.mock('@/hooks/useMyMemberships', () => ({
  useMyMemberships: () => ({ active: [], memberships: [], source: 'none', isLoading: false }),
}));

const openVote = {
  id: 'd1',
  communityId: '1',
  title: 'Purchase Shared Boda-Boda',
  description: 'Two motorcycles.',
  fundingAmount: 85000,
  proposedBy: 'Amani K.',
  votesFor: 32,
  votesAgainst: 8,
  totalMembers: 47,
  status: 'active',
  createdAt: '2026-09-01T00:00:00Z',
  endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
};
const castVote = vi.fn(async () => ({ ok: true, stage: 'recorded' as const, reason: 'Recorded on Baraza.' }));
vi.mock('@/hooks/useBarazaData', () => ({
  useDecision: () => openVote,
  useVoteStatus: () => null,
  useCastVote: () => ({ vote: castVote, isLoading: false }),
}));
vi.mock('@/hooks/useChain', () => ({ useChain: () => ({ chain: 'stellar' }) }));
vi.mock('@/components/Layout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/hooks/useCommunities', () => ({
  useCommunity: () => ({
    community: { id: '1', name: 'Kibera Youth', type: 'savings', image: 'KY', memberCount: 47, fundBalance: 0, membershipFee: 500, currency: 'KES', quorumPct: 51, approvalThresholdPct: 66, createdAt: '2026-01-01T00:00:00.000Z' },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

afterEach(cleanup);

function renderVote() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/1/votes/d1']}>
      <Routes>
        <Route path="/dashboard/:id/votes/:decisionId" element={<ProposalDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProposalDetail', () => {
  it('shows the amount in the group currency, the rules in words and no buttons for a visitor', () => {
    membership = { ...membership, isMember: false };
    renderVote();
    expect(screen.getByText('KES 85,000')).toBeInTheDocument();
    expect(screen.getByText(/More than half of members must vote and two thirds of those who vote must agree/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Support' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Object' })).toBeNull();
    expect(screen.getByText('Quorum Reached (85%)')).toBeInTheDocument();
    expect(screen.getByTestId('tally-bar')).toHaveAttribute('aria-label', expect.stringContaining('quorum at'));
  });

  it('lets an active member Support or Object and records the ballot as pending', async () => {
    membership = { ...membership, isMember: true, status: 'active', source: 'api' };
    renderVote();
    const support = screen.getByRole('button', { name: 'Support' });
    expect(screen.getByRole('button', { name: 'Object' })).toBeInTheDocument();
    support.click();
    expect(castVote).toHaveBeenCalledWith('d1', 'acct-1', 'for');
    expect(await screen.findByRole('status', { name: 'Vote Recorded' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Support' })).toBeNull();
  });

  it('never offers Execute to anyone here', () => {
    membership = { ...membership, isMember: true, status: 'active', isOfficer: true, source: 'api' };
    renderVote();
    expect(screen.queryByText(/Execute/)).toBeNull();
  });
});
