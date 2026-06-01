import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JoinStatus from '@/pages/JoinStatus';
import ChainProvider from '@/components/ChainProvider';

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null }),
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
    <ChainProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/join/:id/status" element={<JoinStatus />} />
        </Routes>
      </MemoryRouter>
    </ChainProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
  cleanup();
});

describe('JoinStatus payment rail copy', () => {
  it('uses Stellar copy when the rail query param is stellar', () => {
    renderStatus('/join/1/status?orderId=ord_local_stellar_demo&rail=stellar');

    expect(screen.getByText('Stellar payment verified')).toBeInTheDocument();
    expect(screen.getByText(/Stellar payment verification/)).toBeInTheDocument();
    expect(screen.queryByText(/M-Pesa prompt/)).not.toBeInTheDocument();
  });

  it('infers Stellar copy from Stellar order ids', () => {
    renderStatus('/join/1/status?orderId=ord_stellar_demo');

    expect(screen.getByText('Stellar payment verified')).toBeInTheDocument();
    expect(screen.queryByText(/M-Pesa prompt/)).not.toBeInTheDocument();
  });

  it('keeps M-Pesa copy as the default payment rail', () => {
    renderStatus('/join/1/status?orderId=ord_mpesa_demo');

    expect(screen.getByText('Check your phone for the M-Pesa prompt')).toBeInTheDocument();
    expect(screen.getByText(/M-Pesa confirmation/)).toBeInTheDocument();
    expect(screen.queryByText('Stellar payment verified')).not.toBeInTheDocument();
  });

  it('uses the community chain for membership submission copy even when another chain is selected globally', () => {
    window.localStorage.setItem('baraza:chain', 'base');

    renderStatus('/join/1/status?orderId=ord_mpesa_demo');

    expect(screen.getByText('Submitting to Solana')).toBeInTheDocument();
    expect(screen.queryByText('Submitting to Base')).not.toBeInTheDocument();
  });
});
