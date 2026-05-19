import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import WalletProviders from '@/components/WalletProviders';
import ChainProvider from '@/components/ChainProvider';
import PageLoader from '@/components/PageLoader';
import { AshaChatProvider } from '@/contexts/AshaChatContext';
import AshaChat from '@/components/chat/AshaChat';

const Index = lazy(() => import('./pages/Index'));
const Communities = lazy(() => import('./pages/Communities'));
const Evaluate = lazy(() => import('./pages/Evaluate'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const CommunityDashboard = lazy(() => import('./pages/CommunityDashboard'));
const CreateDecision = lazy(() => import('./pages/CreateDecision'));
const JoinDao = lazy(() => import('./pages/JoinDao'));
const JoinStatus = lazy(() => import('./pages/JoinStatus'));
const Profile = lazy(() => import('./pages/Profile'));
const TreasuryDetail = lazy(() => import('./pages/TreasuryDetail'));
const ProposalDetail = lazy(() => import('./pages/ProposalDetail'));
const AdminReconciliation = lazy(() => import('./pages/AdminReconciliation'));
const NotFound = lazy(() => import('./pages/NotFound'));

const App: React.FC = () => {
  return (
    <ChainProvider>
      <WalletProviders>
        <AshaChatProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/evaluate" element={<Evaluate />} />
            <Route path="/create" element={<CreateCommunity />} />
            <Route path="/dashboard/:id" element={<CommunityDashboard />} />
            <Route path="/dashboard/:id/decisions/create" element={<CreateDecision />} />
            <Route path="/join/:id" element={<JoinDao />} />
            <Route path="/join/:id/status" element={<JoinStatus />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard/:id/treasury" element={<TreasuryDetail />} />
            <Route path="/dashboard/:id/decisions/:decisionId" element={<ProposalDetail />} />
            <Route path="/admin" element={<AdminReconciliation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <AshaChat />
          <Toaster />
        </AshaChatProvider>
      </WalletProviders>
    </ChainProvider>
  );
};

export default App;
