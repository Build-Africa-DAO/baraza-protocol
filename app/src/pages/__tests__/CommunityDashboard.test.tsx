import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
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
  useMyMemberships: () => ({ active: [] }),
}));

vi.mock('@/hooks/useBarazaData', () => ({
  useDecisions: () => ({ active: [], past: [], all: [] }),
}));

vi.mock('@/hooks/useChain', () => ({
  useChain: () => ({ chain: 'stellar' }),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/CommunityBanner', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/community/LiveStatCard', () => ({
  default: () => <div>stat</div>,
}));

vi.mock('@/components/community/ActivityFeed', () => ({
  default: () => <div>activity</div>,
}));

vi.mock('@/akili/AkiliSecurityReview', () => ({
  default: () => null,
}));

vi.mock('@/components/BountyBoard', () => ({
  default: () => null,
}));

vi.mock('@/components/CommunityGallery', () => ({
  default: () => null,
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

describe('CommunityDashboard layout', () => {
  it('keeps mobile group navigation outside the content row so the main column can use the full width', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/1']}>
        <Routes>
          <Route path="/dashboard/:id" element={<CommunityDashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    const main = document.querySelector('main.min-w-0');
    expect(main).toBeTruthy();
    const row = main?.parentElement;
    expect(row?.className).toMatch(/\bflex\b/);
    expect(row?.className).not.toMatch(/w-full lg:hidden/);

    const mobileMenu = screen.getByRole('button', { name: /overview/i });
    expect(mobileMenu.parentElement).not.toBe(row);
    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Decisions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Funds' })).toBeInTheDocument();
    expect(screen.getByText('Decisions needing a vote')).toBeInTheDocument();
    expect(screen.queryByText('Akili AI security layer')).not.toBeInTheDocument();
  });
});
