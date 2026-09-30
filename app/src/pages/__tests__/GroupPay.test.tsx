import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GroupPay from '@/pages/GroupPay';
import type { Community } from '@/lib/constants';
import type { GroupMembership } from '@/hooks/useGroupMembership';

let mockCommunity: Community = {
  id: 'kibera-collective',
  name: 'Kibera Youth Collective',
  description: 'A savings group.',
  membershipFee: 500,
  verificationTier: 'activation',
  type: 'savings',
  memberCount: 24,
  fundBalance: 12000,
  activeDecisions: 0,
  image: 'KY',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockMembership: GroupMembership = {
  isMember: true,
  status: 'active',
  role: 'member',
  isOfficer: false,
  duesStatus: 'ACTIVE',
  duesOwedMinor: 50000, // KES 500.00
  vaultBalanceMinor: 1200000,
  currency: 'KES',
  source: 'api',
  isLoading: false,
};

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    authenticated: true,
    accountId: 'usr_test_123',
    ready: true,
    configured: true,
    login: vi.fn(),
    createAccount: vi.fn(),
    getAccessToken: async () => 'mock_token',
  }),
}));

vi.mock('@/components/app/GroupWorkspace', () => ({
  default: ({ children }: { children: (ctx: { community: Community; membership: GroupMembership; isMember: boolean; isOfficer: boolean; frozen: boolean; chainMeta: unknown }) => ReactNode }) => (
    <div data-testid="workspace">
      {children({
        community: mockCommunity,
        membership: mockMembership,
        isMember: true,
        isOfficer: false,
        frozen: false,
        chainMeta: {},
      })}
    </div>
  ),
}));

vi.mock('@/lib/duesStreak', () => ({
  fetchDuesStreak: vi.fn(async () => ({ perCommunity: { 'kibera-collective': 3 }, totalMonths: 3 })),
}));

function renderPay() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/kibera-collective/pay']}>
      <Routes>
        <Route path="/dashboard/:id/pay" element={<GroupPay />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GroupPay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('renders transparent itemized breakdown with 1.5% platform fee and carrier processing', () => {
    renderPay();

    expect(screen.getByText('Contribution Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Dues to Vault')).toBeInTheDocument();
    expect(screen.getByText('Platform fee (1.5%)')).toBeInTheDocument();
    expect(screen.getByText('Carrier processing')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();

    // 100% dues to sovereign vault notice
    expect(screen.getByText(/goes directly into Kibera Youth Collective's sovereign treasury/i)).toBeInTheDocument();
  });

  it('submits calculated total expected amount including 1.5% fee on STK push', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, orderId: 'ord_pay_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderPay();

    const phoneInput = screen.getByLabelText(/m-pesa phone number/i);
    fireEvent.change(phoneInput, { target: { value: '0712345678' } });

    const payButton = screen.getByRole('button', { name: /pay with m-pesa/i });
    expect(payButton).toBeEnabled();

    fireEvent.click(payButton);

    await waitFor(() => {
      const calls = fetchMock.mock.calls as unknown as [RequestInfo | URL, RequestInit?][];
      const found = calls.some((call) =>
        String(call[0]).includes('/api/mpesa/'),
      );
      expect(found).toBe(true);
    });

    const calls = fetchMock.mock.calls as unknown as [RequestInfo | URL, RequestInit?][];
    const postCall = calls.find((call) =>
      String(call[0]).includes('/api/mpesa/'),
    );
    expect(postCall).toBeDefined();
    const callBody = JSON.parse((postCall?.[1]?.body ?? '{}') as string);
    expect(callBody.phone).toBe('+254712345678');
    expect(callBody.communityId).toBe('kibera-collective');
    // Base 500 + 1.5% fee (7.50) + carrier (2.50) = 510 KES
    expect(callBody.amount).toBe(510);
  });

  it('safely gates contributions when community contributions are gated or creative pilot pre-launch', () => {
    const originalCommunity = mockCommunity;
    mockCommunity = {
      ...originalCommunity,
      contributionsGated: true,
    };

    renderPay();

    expect(screen.getByRole('button', { name: /contributions open 10 october/i })).toBeDisabled();
    expect(screen.getByText(/contributions for this community launch on 10 october 2026/i)).toBeInTheDocument();

    mockCommunity = originalCommunity;
  });
});
