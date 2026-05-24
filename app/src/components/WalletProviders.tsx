import React, { useCallback, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';
import { WALLET_ADAPTER_NETWORK } from '@/lib/network';
import BarazaWalletModalProvider from '@/components/BarazaWalletModalProvider';

const RPC_ENDPOINTS = [
  ...new Set(
    [
      import.meta.env.VITE_RPC_ENDPOINT,
      clusterApiUrl(WALLET_ADAPTER_NETWORK),
    ].filter(Boolean) as string[]
  ),
];

interface WalletProvidersProps {
  children: React.ReactNode;
}

export default function WalletProviders({ children }: WalletProvidersProps) {
  const endpoint = useMemo(() => RPC_ENDPOINTS[0], []);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: WALLET_ADAPTER_NETWORK }),
      new CoinbaseWalletAdapter(),
    ],
    [],
  );

  const onError = useCallback((error: Error) => console.error('[Wallet Error]', error.message), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <BarazaWalletModalProvider>{children}</BarazaWalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
