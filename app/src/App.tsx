import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';

const Index = lazy(() => import('./pages/Index'));
const Communities = lazy(() => import('./pages/Communities'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const CommunityDashboard = lazy(() => import('./pages/CommunityDashboard'));
const CreateDecision = lazy(() => import('./pages/CreateDecision'));
const NotFound = lazy(() => import('./pages/NotFound'));
const WalletProviders = lazy(() => import('@/components/WalletProviders'));

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
  const protectedRoute = (element: React.ReactNode) => (
    <Suspense fallback={<PageSkeleton />}>
      <WalletProviders>{element}</WalletProviders>
    </Suspense>
  );

  return (
    <>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/create" element={protectedRoute(<CreateCommunity />)} />
          <Route path="/dashboard/:id" element={protectedRoute(<CommunityDashboard />)} />
          <Route
            path="/dashboard/:id/decisions/create"
            element={protectedRoute(<CreateDecision />)}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
};

export default App;
