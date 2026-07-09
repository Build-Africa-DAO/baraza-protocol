import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TreasuryDetail from '@/pages/TreasuryDetail';

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/CommunityBanner', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useCommunities', () => ({
  useCommunity: () => ({
    community: { id: '1', name: 'Kibera Youth Collective', type: 'sacco', fundBalance: 1248500, memberCount: 38 },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('@/hooks/useChain', () => ({
  useChain: () => ({
    chainMeta: { id: 'solana', label: 'Solana', symbol: 'SOL' },
  }),
}));

vi.mock('@/lib/seo', () => ({
  useSeo: vi.fn(),
}));

function renderTreasury() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/1/treasury']}>
      <Routes>
        <Route path="/dashboard/:id/treasury" element={<TreasuryDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('TreasuryDetail payout receipts', () => {
  it('shows downloadable receipts for completed payouts', () => {
    renderTreasury();

    expect(screen.getByRole('button', { name: 'Export receipts' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '4xkL...p9Qr' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '8mPz...x2Vy' })).toBeInTheDocument();
  });

  it('keeps missing payout receipts unavailable until approval data exists', () => {
    renderTreasury();

    expect(screen.getByText('Missing receipt data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Receipt pending' })).toBeDisabled();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
