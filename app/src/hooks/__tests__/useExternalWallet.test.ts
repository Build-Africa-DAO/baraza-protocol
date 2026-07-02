import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExternalWallet } from '@/hooks/useExternalWallet';

const mockSetVisible = vi.fn();
const walletState = {
  connected: false,
  publicKey: null as { toBase58(): string } | null,
};

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: () => ({ setVisible: mockSetVisible }),
}));

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => walletState,
}));

beforeEach(() => {
  walletState.connected = false;
  walletState.publicKey = null;
  vi.clearAllMocks();
});

describe('useExternalWallet', () => {
  it('returns the connected wallet address', () => {
    walletState.connected = true;
    walletState.publicKey = { toBase58: () => 'wallet-address' };

    const { result } = renderHook(() => useExternalWallet());

    expect(result.current.address).toBe('wallet-address');
  });

  it('opens the approved wallet selector', () => {
    const { result } = renderHook(() => useExternalWallet());

    act(() => result.current.openSelector());

    expect(mockSetVisible).toHaveBeenCalledWith(true);
  });
});
