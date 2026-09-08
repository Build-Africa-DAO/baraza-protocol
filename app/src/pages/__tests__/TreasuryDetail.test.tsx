import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TreasuryDetail from '@/pages/TreasuryDetail';

vi.mock('@/lib/seo', () => ({
  useSeo: vi.fn(),
}));

vi.mock('@/hooks/useChain', () => ({
  useChain: () => ({ chainMeta: 'mpesa' }),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/CommunityBanner', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useCommunities', () => ({
  useCommunity: () => ({
    community: {
      id: '1',
      name: 'Kibera Youth',
      type: 'savings',
      memberCount: 18,
      fundBalance: 0,
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

afterEach(cleanup);

describe('TreasuryDetail', () => {
  it('does not invent sample balances or transaction rows', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/1/treasury']}>
        <Routes>
          <Route path="/dashboard/:id/treasury" element={<TreasuryDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('No contribution records yet')).toBeInTheDocument();
    expect(screen.getByText('No pending releases')).toBeInTheDocument();
    expect(screen.getByText('No completed releases')).toBeInTheDocument();
    expect(screen.queryByText(/1,248,500/)).not.toBeInTheDocument();
    expect(screen.queryByText('MPESA-XJ9L2B')).not.toBeInTheDocument();
    expect(screen.queryByText('PROP-039')).not.toBeInTheDocument();
  });
});
