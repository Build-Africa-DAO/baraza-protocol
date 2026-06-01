import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWalletGuard } from '@/hooks/useWalletGuard';

const mockToast = vi.fn();
const mockSetVisible = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: () => ({ setVisible: mockSetVisible }),
}));

// Mutable wallet state for each test
const walletState = {
  connected: false,
  connecting: false,
  publicKey: null as { toBase58(): string } | null,
};

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => walletState,
}));

beforeEach(() => {
  walletState.connected = false;
  walletState.connecting = false;
  walletState.publicKey = null;
  vi.clearAllMocks();
});

describe('useWalletGuard - isReady', () => {
  it('is false when not connected', () => {
    const { result } = renderHook(() => useWalletGuard());
    expect(result.current.isReady).toBe(false);
  });

  it('is true when connected with publicKey', () => {
    walletState.connected = true;
    walletState.publicKey = { toBase58: () => 'ABC123' };
    const { result } = renderHook(() => useWalletGuard());
    expect(result.current.isReady).toBe(true);
  });

  it('is false when connected but publicKey is null', () => {
    walletState.connected = true;
    walletState.publicKey = null;
    const { result } = renderHook(() => useWalletGuard());
    expect(result.current.isReady).toBe(false);
  });
});

describe('useWalletGuard - address', () => {
  it('returns null when no Solana account', () => {
    const { result } = renderHook(() => useWalletGuard());
    expect(result.current.address).toBeNull();
  });

  it('returns base58 address when connected', () => {
    walletState.connected = true;
    walletState.publicKey = { toBase58: () => 'PUBKEY123' };
    const { result } = renderHook(() => useWalletGuard());
    expect(result.current.address).toBe('PUBKEY123');
  });
});

describe('useWalletGuard - requireWallet', () => {
  it('shows connecting toast and returns undefined while connecting', async () => {
    walletState.connecting = true;
    const { result } = renderHook(() => useWalletGuard());
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.requireWallet(() => Promise.resolve('done'));
    });
    expect(outcome).toBeUndefined();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Connecting Baraza account...' }),
    );
  });

  it('opens account modal without a parallel toast when not connected', async () => {
    const { result } = renderHook(() => useWalletGuard({ action: 'vote' }));
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.requireWallet(() => Promise.resolve('done'));
    });
    expect(outcome).toBeUndefined();
    expect(mockSetVisible).toHaveBeenCalledWith(true);
    // The modal carries the prompt; a parallel toast would just compete with it.
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('executes fn and returns result when Solana account is ready', async () => {
    walletState.connected = true;
    walletState.publicKey = { toBase58: () => 'ABC' };
    const { result } = renderHook(() => useWalletGuard());
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.requireWallet(() => Promise.resolve(42));
    });
    expect(outcome).toBe(42);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('shows destructive toast on generic error', async () => {
    walletState.connected = true;
    walletState.publicKey = { toBase58: () => 'ABC' };
    const { result } = renderHook(() => useWalletGuard());
    await act(async () => {
      await result.current.requireWallet(() => Promise.reject(new Error('something broke')));
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Transaction failed',
        description: 'something broke',
        variant: 'destructive',
      }),
    );
  });

  it('shows approval-cancelled toast (not destructive) for user rejection', async () => {
    walletState.connected = true;
    walletState.publicKey = { toBase58: () => 'ABC' };
    const { result } = renderHook(() => useWalletGuard({ action: 'voting' }));
    await act(async () => {
      await result.current.requireWallet(() =>
        Promise.reject(new Error('User rejected the request.')),
      );
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Approval cancelled',
        description: expect.stringContaining('voting'),
      }),
    );
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    );
  });
});
