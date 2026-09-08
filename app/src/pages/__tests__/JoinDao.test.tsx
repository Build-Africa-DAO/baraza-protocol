import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JoinDao from '@/pages/JoinDao';

const login = vi.fn();

vi.mock('@/lib/seo', () => ({ useSeo: vi.fn() }));

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    authenticated: false,
    accountId: null,
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

vi.mock('@/components/CommunityBanner', () => ({
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

afterEach(() => {
  login.mockClear();
  vi.unstubAllGlobals();
  cleanup();
});

describe('JoinDao', () => {
  it('shows the protocol fee breakdown and STK copy without sending payment while logged out', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    renderJoin();

    expect(screen.getByText('Activation fee')).toBeInTheDocument();
    expect(screen.getByText('Baraza platform fee (2.0%)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to pay/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request m-pesa prompt/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sign in to pay/i }));
    expect(login).toHaveBeenCalledTimes(1);
  });
});
