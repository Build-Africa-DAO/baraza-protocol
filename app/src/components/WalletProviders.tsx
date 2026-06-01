import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import type { Adapter } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { WALLET_ADAPTER_NETWORK } from '@/lib/network';
import { getPublicEnv } from '@/lib/env';
import BarazaWalletModalProvider from '@/components/BarazaWalletModalProvider';

const RPC_ENDPOINTS = [
  ...new Set(
    [
      getPublicEnv().VITE_RPC_ENDPOINT,
      clusterApiUrl(WALLET_ADAPTER_NETWORK),
    ].filter(Boolean) as string[]
  ),
];

interface WalletProvidersProps {
  children: React.ReactNode;
}

export default function WalletProviders({ children }: WalletProvidersProps) {
  const endpoint = useMemo(() => RPC_ENDPOINTS[0], []);
  const [wallets, setWallets] = useState<Adapter[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadWallets = async () => {
      const [{ PhantomWalletAdapter }, { SolflareWalletAdapter }, { CoinbaseWalletAdapter }] = await Promise.all([
        import('@solana/wallet-adapter-phantom'),
        import('@solana/wallet-adapter-solflare'),
        import('@solana/wallet-adapter-coinbase'),
      ]);
      if (!cancelled) {
        setWallets([
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter({ network: WALLET_ADAPTER_NETWORK }),
          new CoinbaseWalletAdapter(),
        ]);
      }
    };
    const startLoading = () => {
      void loadWallets().catch((error: unknown) => {
        console.error('[Wallet setup error]', error instanceof Error ? error.message : error);
      });
    };
    const idleId = window.requestIdleCallback?.(startLoading, { timeout: 1200 });
    const timeoutId = idleId === undefined ? window.setTimeout(startLoading, 250) : undefined;
    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  const onError = useCallback((error: Error) => console.error('[Wallet Error]', error.message), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <BarazaWalletModalProvider>{children}</BarazaWalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
