import { lazy, Suspense, type ReactNode } from 'react';
import PageLoader from '@/components/PageLoader';

const WalletProviders = lazy(() => import('@/components/WalletProviders'));

/**
 * The Solana wallet adapter is furniture for operators only (§9.4). Member
 * routes never mount it, so the 2 MB wallet vendor chunk stays out of the
 * member bundle. Operator routes wrap their page in this gate.
 */
export default function OperatorArea({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader label="Loading operator tools" />}>
      <WalletProviders>{children}</WalletProviders>
    </Suspense>
  );
}
