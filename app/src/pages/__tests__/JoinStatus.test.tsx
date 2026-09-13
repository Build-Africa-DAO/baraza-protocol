import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

// Activation only runs for an identified person. A phone session stands in for
// the phone-only members who are most of the product.
vi.mock('@/lib/phoneAuth', () => ({
  getPhoneAuthSession: () => ({ phone: '+254712345678', email: null }),
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
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
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

    expect(screen.getByText('Check your phone for the M-Pesa STK PIN prompt')).toBeInTheDocument();
    expect(screen.getByText(/M-Pesa confirmation/)).toBeInTheDocument();
    expect(screen.queryByText('Transfer verified')).not.toBeInTheDocument();
  });

  it('uses account-first membership submission copy', () => {
    renderStatus('/join/1/status?orderId=ord_mpesa_demo');

    expect(screen.getByText('Recording your membership')).toBeInTheDocument();
    expect(screen.queryByText(/Stellar|Solana|Base/i)).not.toBeInTheDocument();
  });
});

describe('JoinStatus never advances on its own', () => {
  it('holds a client-minted order at requested and says it cannot be checked', async () => {
    vi.useFakeTimers();
    try {
      renderStatus('/join/1/status?orderId=ord_local_1725900000000_abc123');

      // The old build walked a hardcoded happy path on a 1.8s timer and then
      // wrote an "active" membership. Nothing may move without the server.
      await vi.advanceTimersByTimeAsync(30_000);

      expect(screen.getByText('We cannot confirm this payment')).toBeInTheDocument();
      expect(screen.getByText(/This reference cannot be checked/)).toBeInTheDocument();
      expect(screen.queryByText("You're an active member")).not.toBeInTheDocument();
      expect(window.localStorage.getItem('baraza.memberships.v1')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not activate a membership when the activation call fails', async () => {
    window.sessionStorage.setItem('baraza:payment-order-secret:ord_mpesa_bad', 'sec_test');
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/membership/activate')) {
        return Response.json({ error: 'forbidden' }, { status: 403 });
      }
      return Response.json({
        order_id: 'ord_mpesa_bad',
        community_id: '1',
        status: 'INDEXER_CONFIRMED',
        amount_expected: 51250,
        amount_received: 51250,
        currency: 'KES',
        created_at: '2026-09-08T00:00:00.000Z',
        updated_at: '2026-09-08T00:00:00.000Z',
      });
    }));

    renderStatus('/join/1/status?orderId=ord_mpesa_bad');

    await waitFor(() => {
      expect(screen.getByText(/could not activate the membership/)).toBeInTheDocument();
    });
    expect(window.localStorage.getItem('baraza.memberships.v1')).toBeNull();
  });
});

describe('JoinStatus membership activation', () => {
  it('treats INDEXER_CONFIRMED as an active membership', async () => {
    window.sessionStorage.setItem('baraza:payment-order-secret:ord_mpesa_live', 'sec_test');
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/api/membership/activate')) return Response.json({ ok: true, status: 'ACTIVE' });
      return Response.json({
        order_id: 'ord_mpesa_live',
        community_id: '1',
        membership_tier_id: null,
        status: 'INDEXER_CONFIRMED',
        amount_expected: 51250,
        amount_received: 51250,
        currency: 'KES',
        confirmed_at: '2026-09-08T00:00:00.000Z',
        created_at: '2026-09-08T00:00:00.000Z',
        updated_at: '2026-09-08T00:00:00.000Z',
      });
    }));

    renderStatus('/join/1/status?orderId=ord_mpesa_live');

    await waitFor(() => {
      expect(screen.getByText("You're an active member")).toBeInTheDocument();
    });
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
