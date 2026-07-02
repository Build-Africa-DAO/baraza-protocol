import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function useExternalWallet() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const address = connected && publicKey ? publicKey.toBase58() : null;
  const openSelector = useCallback(() => setVisible(true), [setVisible]);

  return { address, openSelector };
}
