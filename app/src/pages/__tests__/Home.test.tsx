import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/Home';

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));
vi.mock('@/components/Layout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({ authenticated: true, ready: true, configured: true, accountId: 'acct-1', login: vi.fn(), getAccessToken: async () => null }),
}));
vi.mock('@/hooks/useProposals', () => ({
  useProposals: () => ({ all: [{ id: 'd1', status: 'active', endsAt: new Date(Date.now() + 86400000 * 2).toISOString(), votesFor: 1, votesAgainst: 0, totalMembers: 10 }], active: [], past: [] }),
}));

let memberships: unknown[] = [];
vi.mock('@/hooks/useMyMemberships', () => ({
  useMyMemberships: () => ({ memberships, active: memberships, isLoading: false, error: null, source: 'api' }),
}));

function pair(over: Record<string, unknown> = {}) {
  return {
    community: { id: 'c1', name: 'Kibera Youth', type: 'savings', image: 'KY', membershipFee: 500, currency: 'KES', memberCount: 12, fundBalance: 0, activeDecisions: 0, description: '', createdAt: '' },
    record: { communityId: 'c1', walletAddress: 'acct-1', status: 'active', joinedAt: '2026-01-01T00:00:00Z', brzaBalance: 0 },
    summary: { communityId: 'c1', name: 'Kibera Youth', role: 'member', activationStatus: 'active', joinedAt: '2026-01-01T00:00:00Z', currency: 'KES', ...over },
  };
}

afterEach(cleanup);

describe('Home', () => {
  it('shows an invite form and a start card when there are no groups', () => {
    memberships = [];
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Start with a Group/i);
    expect(screen.getByLabelText('Invite Link or Group Id')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a Group' })).toHaveAttribute('href', '/create');
  });

  it('lists groups as rows with standing and what needs me', () => {
    memberships = [pair({ outstandingDuesMinor: 50000 }), { ...pair(), community: { ...pair().community, id: 'c2', name: 'Mama Mboga' }, summary: { ...pair().summary, communityId: 'c2', role: 'treasurer' } }];
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your Groups');
    expect(screen.getByRole('link', { name: /Kibera Youth/ })).toHaveAttribute('href', '/dashboard/c1');
    expect(screen.getByText('Pay dues · KES 500')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Officer' })).toBeInTheDocument();
    expect(screen.getByText('1 vote needs you')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Active' })).toBeInTheDocument();
  });
});
