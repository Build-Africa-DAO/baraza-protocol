import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JoinDao from '@/pages/JoinDao';

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/CommunityBanner', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useCommunities', () => ({
  useCommunity: () => ({
    community: { id: '1', name: 'Kibera Youth Collective', membershipFee: 500, chain: 'solana' },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/lib/seo', () => ({
  useSeo: vi.fn(),
}));

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    ready: true,
    configured: true,
    authenticated: false,
    accountId: null,
    login: vi.fn(),
    createAccount: vi.fn(),
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
  cleanup();
});

describe('JoinDao accessibility', () => {
  it('renders the activation tracker as a labelled step list', () => {
    renderJoin();

    expect(screen.getByRole('list', { name: 'Membership activation steps' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Step 1 of 6');
    expect(screen.getByLabelText('Invite opened - current')).toHaveAttribute('aria-current', 'step');
  });

  it('connects helper copy and invalid state to the mobile money and transfer inputs', async () => {
    const user = userEvent.setup();
    renderJoin();

    const phoneInput = screen.getByLabelText('M-Pesa phone number');
    await user.type(phoneInput, '123');
    expect(phoneInput).toHaveAttribute('aria-describedby', 'join-phone-help');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true');

    const amountInput = screen.getByLabelText('Transfer amount reference');
    await user.clear(amountInput);
    await user.type(amountInput, '0');
    expect(amountInput).toHaveAttribute('aria-describedby', 'stellar-amount-help');
    expect(amountInput).toHaveAttribute('aria-invalid', 'true');

    const txInput = screen.getByLabelText('Transaction reference');
    await user.type(txInput, 'abc123');
    expect(txInput).toHaveAttribute('aria-describedby', 'stellar-tx-help');
    expect(txInput).toHaveAttribute('aria-invalid', 'true');
  });
});
