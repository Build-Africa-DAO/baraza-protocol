import type { ReactNode } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CommunityDashboard from '@/pages/CommunityDashboard';

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null }),
}));

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    authenticated: false,
    accountId: null,
    getAccessToken: async () => null,
  }),
}));

vi.mock('@/hooks/useMyMemberships', () => ({
  useMyMemberships: () => ({ active: [], memberships: [], source: 'none', isLoading: false }),
}));

vi.mock('@/hooks/useBarazaData', () => ({
  useDecisions: () => ({ active: [], past: [], all: [] }),
  useActivities: () => [],
}));

vi.mock('@/hooks/useChain', () => ({
  useChain: () => ({ chain: 'stellar' }),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/community/ActivityFeed', () => ({
  default: () => <div>activity</div>,
}));

vi.mock('@/lib/securityReview', () => ({
  reviewCommunity: () => ({ score: 0, level: 'low', findings: [] }),
}));

vi.mock('@/hooks/useCommunities', () => ({
  useCommunity: () => ({
    community: {
      id: '1',
      name: 'Kibera Youth',
      description: 'A savings group.',
      type: 'savings',
      image: 'KY',
      memberCount: 12,
      fundBalance: 0,
      membershipFee: 500,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

afterEach(cleanup);

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/1']}>
      <Routes>
        <Route path="/dashboard/:id" element={<CommunityDashboard />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CommunityDashboard layout', () => {
  it('keeps the group nav outside the content row so the main column can use the full width', () => {
    renderHome();

    const main = document.querySelector('main.min-w-0');
    expect(main).toBeTruthy();
    const row = main?.parentElement;
    expect(row?.className).toMatch(/\bflex\b/);
    expect(row?.className).not.toMatch(/w-full lg:hidden/);
  });

  it('does not stamp a security verdict on the group', () => {
    renderHome();
    expect(screen.queryByText('Akili AI security layer')).not.toBeInTheDocument();
  });
});

describe('CommunityDashboard next action', () => {
  it('asks a non-member to join before anything else', () => {
    renderHome();
    const heading = screen.getByRole('heading', { name: 'Join This Group' });
    const card = heading.closest('.baraza-card');
    expect(card).toBeTruthy();
    const cta = within(card as HTMLElement).getByRole('link', { name: 'Join This Group' });
    expect(cta).toHaveAttribute('href', '/join/1');
  });

  it('never invents a balance the server did not send', () => {
    renderHome();
    // fundBalance is 0 in the fixture, so a figure renders — but the split into
    // reserved and available must not be faked.
    expect(screen.getByText('KES 0')).toBeInTheDocument();
    expect(screen.getAllByText('Not available yet')).toHaveLength(2);
  });
});
