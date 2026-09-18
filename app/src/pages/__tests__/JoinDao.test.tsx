import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JoinDao from '@/pages/JoinDao';

let mockAuthenticated = false;
const login = vi.fn();

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    authenticated: mockAuthenticated,
    accountId: mockAuthenticated ? '0x123' : null,
    ready: true,
    configured: true,
    login,
    createAccount: vi.fn(),
    getAccessToken: async () => null,
  }),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const community = {
  id: '1',
  name: 'Kibera Youth Collective',
  membershipFee: 500,
  verificationTier: 'activation' as const,
};

vi.mock('@/hooks/useCommunities', () => ({
  useCommunity: () => ({
    community,
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

function renderJoin() {
  return render(
    <MemoryRouter initialEntries={['/join/1']}>
      <Routes>
        <Route path="/join/:id" element={<JoinDao />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('JoinDao', () => {
  beforeEach(() => {
    mockAuthenticated = false;
  });

  afterEach(() => {
    mockAuthenticated = false;
    login.mockClear();
    vi.unstubAllGlobals();
    cleanup();
  });

  it('shows the protocol fee breakdown and STK copy without sending payment while logged out', () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({}, { status: 404 })));
    renderJoin();

    expect(screen.getByText('Activation fee')).toBeInTheDocument();
    expect(screen.getByText('Baraza platform fee (2.0%)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to pay/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request m-pesa prompt/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sign in to pay/i }));
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('defaults to M-Pesa and dynamically changes text and fields when other payment options are clicked', () => {
    mockAuthenticated = true;
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({}, { status: 404 })));
    renderJoin();

    // 1. Defaults to M-Pesa
    expect(screen.getByRole('heading', { name: /pay with m-pesa/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/m-pesa phone number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay with m-pesa/i })).toBeInTheDocument();

    // 2. Switch to Airtel Money
    const airtelBtn = screen.getByRole('radio', { name: /airtel money/i });
    fireEvent.click(airtelBtn);

    expect(screen.getByRole('heading', { name: /pay with airtel money/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/airtel phone number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay with airtel money/i })).toBeInTheDocument();

    // 3. Switch to Card / Bank
    const cardBtn = screen.getByRole('radio', { name: /card \/ bank/i });
    fireEvent.click(cardBtn);

    expect(screen.getByRole('heading', { name: /pay with card or bank/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address for receipt/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay with card \/ bank/i })).toBeInTheDocument();

    // 4. Switch to Crypto
    const cryptoBtn = screen.getByRole('radio', { name: /crypto/i });
    fireEvent.click(cryptoBtn);

    expect(screen.getByRole('heading', { name: /pay with crypto \(stellar\)/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/transfer reference/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify transfer/i })).toBeInTheDocument();

    // 5. Switch back to M-Pesa
    const mpesaBtn = screen.getByRole('radio', { name: /m-pesa/i });
    fireEvent.click(mpesaBtn);

    expect(screen.getByRole('heading', { name: /pay with m-pesa/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/m-pesa phone number/i)).toBeInTheDocument();
  });
});
