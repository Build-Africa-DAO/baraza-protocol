import React, { lazy, Suspense, useMemo, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  BraveWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Skeleton } from '@/components/ui/skeleton';

import '@solana/wallet-adapter-react-ui/styles.css';

// Lazy load heavy pages for better initial bundle size
const Index = lazy(() => import('./pages/Index'));
const Communities = lazy(() => import('./pages/Communities'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const CommunityDashboard = lazy(() => import('./pages/CommunityDashboard'));
const CreateDecision = lazy(() => import('./pages/CreateDecision'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Public RPC endpoints with fallback priority
const RPC_ENDPOINTS = [
  import.meta.env.VITE_RPC_ENDPOINT,
  'https://api.devnet.solana.com',
  clusterApiUrl(WalletAdapterNetwork.Devnet),
].filter(Boolean) as string[];

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-40 w-full rounded-xl mt-8" />
      </div>
    </div>
  );
}

const App: React.FC = () => {
  const endpoint = useMemo(() => RPC_ENDPOINTS[0], []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new BraveWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    []
  );

  const onError = useCallback((error: Error) => {
    // Surface wallet errors without crashing the app
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Wallet Error]', error.message);
    }
  }, []);

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{ commitment: 'confirmed', disableRetryOnRateLimit: false }}
    >
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/create" element={<CreateCommunity />} />
              <Route path="/dashboard/:id" element={<CommunityDashboard />} />
              <Route path="/create-decision/:communityId" element={<CreateDecision />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
