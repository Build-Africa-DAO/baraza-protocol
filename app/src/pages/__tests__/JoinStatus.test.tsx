import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JoinStatus from '@/pages/JoinStatus';

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null }),
}));

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    authenticated: false,
    accountId: null,
  }),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useCommunities', () => ({
  useCommunity: () => ({
    community: { id: '1', name: 'Kibera Youth Collective', chain: 'solana' },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('@/lib/communities', () => ({
  isSupabaseConfigured: () => false,
}));

vi.mock('@/lib/seo', () => ({
  useSeo: vi.fn(),
}));

function renderStatus(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/join/:id/status" element={<JoinStatus />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  window.localStorage.clear();
  cleanup();
});

describe('JoinStatus payment rail copy', () => {
  it('uses generic transfer copy when the direct-transfer rail is selected', () => {
    renderStatus('/join/1/status?orderId=ord_local_stellar_demo&rail=stellar');

    expect(screen.getByText('Transfer verified')).toBeInTheDocument();
    expect(screen.getByText(/transfer verification/)).toBeInTheDocument();
    expect(screen.queryByText(/Stellar|Solana/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/M-Pesa prompt/)).not.toBeInTheDocument();
  });

  it('keeps infrastructure names hidden when inferring a direct transfer', () => {
    renderStatus('/join/1/status?orderId=ord_stellar_demo');

    expect(screen.getByText('Transfer verified')).toBeInTheDocument();
    expect(screen.queryByText(/Stellar|Solana/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/M-Pesa prompt/)).not.toBeInTheDocument();
  });

  it('keeps M-Pesa copy as the default payment rail', () => {
    renderStatus('/join/1/status?orderId=ord_mpesa_demo');

    expect(screen.getByText('Check your phone for the M-Pesa prompt')).toBeInTheDocument();
    expect(screen.getByText(/M-Pesa confirmation/)).toBeInTheDocument();
    expect(screen.queryByText('Transfer verified')).not.toBeInTheDocument();
  });

  it('uses account-first membership submission copy', () => {
    renderStatus('/join/1/status?orderId=ord_mpesa_demo');

    expect(screen.getByText('Recording your membership')).toBeInTheDocument();
    expect(screen.queryByText(/Stellar|Solana|Base/i)).not.toBeInTheDocument();
  });

  it('exposes the current activation step and live status summary', () => {
    renderStatus('/join/1/status?orderId=ord_mpesa_demo');

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Check your phone for the M-Pesa prompt').closest('[aria-current="step"]')).not.toBeNull();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Membership')).toBeInTheDocument();
  });
});
