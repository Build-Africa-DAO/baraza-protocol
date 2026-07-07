import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    community: {
      id: '1',
      name: 'Kibera Youth Collective',
      membershipFee: 500,
    },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: () => ({
    ready: true,
    configured: false,
    authenticated: false,
    accountId: null,
    login: vi.fn(),
    createAccount: vi.fn(),
  }),
}));

vi.mock('@/lib/seo', () => ({
  useSeo: vi.fn(),
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

afterEach(cleanup);

describe('JoinDao accessibility', () => {
  it('describes the phone format consistently with the +254 prefix', () => {
    renderJoin();

    const input = screen.getByLabelText(/M-Pesa phone number/i);

    expect(input).toHaveAttribute('placeholder', '712 345 678');
    expect(input).toHaveAccessibleDescription(/Enter the 9 digits after \+254/i);
  });

  it('announces invalid phone input before leaving the CTA disabled', () => {
    renderJoin();

    const input = screen.getByLabelText(/M-Pesa phone number/i);
    const submitButton = screen.getByRole('button', { name: /Request M-Pesa Prompt/i });

    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '123' } });

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(/Use a Kenyan mobile number/i);
    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '712345678' } });

    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });
});
