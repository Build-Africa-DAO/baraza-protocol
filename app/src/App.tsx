import React, { lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import WalletProviders from '@/components/WalletProviders';
import ChainProvider from '@/components/ChainProvider';
import PageLoader from '@/components/PageLoader';
import { AkiliChatProvider } from '@/akili/AkiliChatContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AkiliChat from '@/akili/AkiliChat';
import { AccountProvider } from '@/contexts/AccountContext';

const Index = lazy(() => import('./pages/Index'));
const Communities = lazy(() => import('./pages/Communities'));
const Bounties = lazy(() => import('./pages/Bounties'));
const BountyDetail = lazy(() => import('./pages/BountyDetail'));
const Evaluate = lazy(() => import('./pages/Evaluate'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const CommunityPurpose = lazy(() => import('./pages/CommunityPurpose'));
const CommunityDashboard = lazy(() => import('./pages/CommunityDashboard'));
const CreateDecision = lazy(() => import('./pages/CreateDecision'));
const JoinDao = lazy(() => import('./pages/JoinDao'));
const JoinStatus = lazy(() => import('./pages/JoinStatus'));
const Profile = lazy(() => import('./pages/Profile'));
const TreasuryDetail = lazy(() => import('./pages/TreasuryDetail'));
const ProposalDetail = lazy(() => import('./pages/ProposalDetail'));
const AdminReconciliation = lazy(() => import('./pages/AdminReconciliation'));
const AkiliCouncilFilings = lazy(() => import('./pages/AkiliCouncilFilings'));
const RetroRounds = lazy(() => import('./pages/RetroRounds'));
const RetroVote = lazy(() => import('./pages/RetroVote'));
const RetroResults = lazy(() => import('./pages/RetroResults'));
const RetroCommunity = lazy(() => import('./pages/RetroCommunity'));
const Onboarding = lazy(() => import('./pages/LeverageOnboarding'));
const ClaimIdentity = lazy(() => import('./pages/ClaimIdentity'));
const NotFound = lazy(() => import('./pages/NotFound'));

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AccountProvider>
        <ChainProvider>
          <WalletProviders>
          <OfflineProvider>
          <AkiliChatProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/bounties" element={<Bounties />} />
              <Route path="/bounties/:bountyId" element={<BountyDetail />} />
              <Route path="/evaluate" element={<Evaluate />} />
              <Route path="/create" element={<CreateCommunity />} />
              <Route path="/create/purpose" element={<CommunityPurpose />} />
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
              <Route path="/onboard" element={<Onboarding />} />
              <Route path="/onboarding" element={<Navigate to="/onboard" replace />} />
              <Route path="/claim" element={<ClaimIdentity />} />
              <Route path="/admin" element={<AdminReconciliation />} />
              <Route path="/admin/akili" element={<AkiliCouncilFilings />} />
              <Route path="/admin/retro" element={<RetroRounds />} />
              <Route path="/retro/:communityId" element={<RetroCommunity />} />
              <Route path="/retro/:communityId/vote" element={<RetroVote />} />
              <Route path="/retro/:communityId/results" element={<RetroResults />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <AkiliChat />
            <Toaster />
          </AkiliChatProvider>
          </OfflineProvider>
          </WalletProviders>
        </ChainProvider>
      </AccountProvider>
    </ThemeProvider>
  );
};

export default App;

