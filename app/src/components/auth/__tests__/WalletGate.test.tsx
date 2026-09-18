import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import WalletGate from '../WalletGate';
import * as AccountContext from '@/contexts/AccountContext';

vi.mock('@/contexts/AccountContext', () => ({
  useAccount: vi.fn(),
}));

describe('WalletGate component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when account is not ready', () => {
    vi.mocked(AccountContext.useAccount).mockReturnValue({
      ready: false,
      authenticated: false,
      configured: true,
      login: vi.fn(),
      createAccount: vi.fn(),
    } as unknown as ReturnType<typeof AccountContext.useAccount>);

    render(
      <WalletGate>
        <div>Protected Member Area</div>
      </WalletGate>,
    );

    expect(screen.getByText(/Loading your account/i)).toBeDefined();
    expect(screen.queryByText(/Protected Member Area/i)).toBeNull();
  });

  it('renders auth gate card matching screenshot when unauthenticated', () => {
    vi.mocked(AccountContext.useAccount).mockReturnValue({
      ready: true,
      authenticated: false,
      configured: true,
      login: vi.fn(),
      createAccount: vi.fn(),
    } as unknown as ReturnType<typeof AccountContext.useAccount>);

    render(
      <WalletGate
        title="Sign in to start a group"
        description="Create an account or log in before you set up a chama, SACCO or cooperative."
      >
        <div>Protected Member Area</div>
      </WalletGate>,
    );

    // Title converted to Title Case
    expect(screen.getByRole('heading', { name: /Sign In to Start a Group/i })).toBeDefined();
    expect(
      screen.getByText(/Create an account or log in before you set up a chama, SACCO or cooperative./i),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeDefined();
    expect(screen.getByText(/Phone or email is enough. You do not need a crypto wallet./i)).toBeDefined();
    expect(screen.queryByText(/Protected Member Area/i)).toBeNull();
  });

  it('renders protected children when authenticated', () => {
    vi.mocked(AccountContext.useAccount).mockReturnValue({
      ready: true,
      authenticated: true,
      configured: true,
      login: vi.fn(),
      createAccount: vi.fn(),
    } as unknown as ReturnType<typeof AccountContext.useAccount>);

    render(
      <WalletGate>
        <div>Protected Member Area</div>
      </WalletGate>,
    );

    expect(screen.getByText(/Protected Member Area/i)).toBeDefined();
    expect(screen.queryByRole('heading', { name: /Sign in to continue/i })).toBeNull();
  });
});
