import React, { lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import WalletProviders from '@/components/WalletProviders';
import ChainProvider from '@/components/ChainProvider';
import PageLoader from '@/components/PageLoader';
import { AshaChatProvider } from '@/contexts/AshaChatContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AshaChat from '@/components/chat/AshaChat';

const Index = lazy(() => import('./pages/Index'));
const Communities = lazy(() => import('./pages/Communities'));
const Bounties = lazy(() => import('./pages/Bounties'));
const BountyDetail = lazy(() => import('./pages/BountyDetail'));
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
    <ThemeProvider>
      <ChainProvider>
        <WalletProviders>
          <AshaChatProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/bounties" element={<Bounties />} />
              <Route path="/bounties/:bountyId" element={<BountyDetail />} />
              <Route path="/evaluate" element={<Evaluate />} />
              <Route path="/create" element={<CreateCommunity />} />
              <Route path="/dao/:id" element={<CommunityDashboard />} />
              <Route path="/dao/:id/proposals" element={<CommunityDashboard />} />
              <Route path="/dao/:id/vote" element={<CommunityDashboard />} />
              <Route path="/proposals" element={<Navigate to="/communities" replace />} />
              <Route path="/vote" element={<Navigate to="/communities" replace />} />
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
    </ThemeProvider>
  );
};

export default App;
