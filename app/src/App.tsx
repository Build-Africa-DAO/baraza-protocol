import React, { lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import WalletProviders from '@/components/WalletProviders';
import ChainProvider from '@/components/ChainProvider';
import PageLoader from '@/components/PageLoader';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { AkiliChatProvider } from '@/akili/AkiliChatContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AkiliChat from '@/akili/AkiliChat';
import { AccountProvider } from '@/contexts/AccountContext';
import PostAuthRedirect from '@/components/app/PostAuthRedirect';
import { ParamRedirect } from '@/components/app/RouteRedirects';
import LegacyTabRedirect from '@/components/app/LegacyTabRedirect';

const Index = lazy(() => import('./pages/Index'));
const Home = lazy(() => import('./pages/Home'));
const Communities = lazy(() => import('./pages/Communities'));
const Help = lazy(() => import('./pages/Help'));
const Bounties = lazy(() => import('./pages/Bounties'));
const BountyDetail = lazy(() => import('./pages/BountyDetail'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const CommunityDashboard = lazy(() => import('./pages/CommunityDashboard'));
const GroupPay = lazy(() => import('./pages/GroupPay'));
const GroupVotes = lazy(() => import('./pages/GroupVotes'));
const GroupPeople = lazy(() => import('./pages/GroupPeople'));
const GroupMoney = lazy(() => import('./pages/GroupMoney'));
const GroupSettings = lazy(() => import('./pages/GroupSettings'));
const GroupMore = lazy(() => import('./pages/GroupMore'));
const CreateDecision = lazy(() => import('./pages/CreateDecision'));
const JoinDao = lazy(() => import('./pages/JoinDao'));
const JoinStatus = lazy(() => import('./pages/JoinStatus'));
const Profile = lazy(() => import('./pages/Profile'));
const ProposalDetail = lazy(() => import('./pages/ProposalDetail'));
const AdminReconciliation = lazy(() => import('./pages/AdminReconciliation'));
const AkiliCouncilFilings = lazy(() => import('./pages/AkiliCouncilFilings'));
const RetroRounds = lazy(() => import('./pages/RetroRounds'));
const RetroVote = lazy(() => import('./pages/RetroVote'));
const RetroResults = lazy(() => import('./pages/RetroResults'));
const RetroCommunity = lazy(() => import('./pages/RetroCommunity'));
const Onboarding = lazy(() => import('./pages/LeverageOnboarding'));
const ClaimIdentity = lazy(() => import('./pages/ClaimIdentity'));
const StatusDashboard = lazy(() => import('./pages/StatusDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DevUi = lazy(() => import('./pages/DevUi'));

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AccountProvider>
        <ChainProvider>
          <WalletProviders>
          <OfflineProvider>
          <AkiliChatProvider>
            <PostAuthRedirect />
            <AppErrorBoundary>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public ── */}
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Home />} />
              <Route path="/groups" element={<Communities />} />
              <Route path="/help" element={<Help />} />
              <Route path="/bounties" element={<Bounties />} />
              <Route path="/bounties/:bountyId" element={<BountyDetail />} />
              <Route path="/status" element={<StatusDashboard />} />
              <Route path="/claim" element={<ClaimIdentity />} />
              <Route path="/account" element={<Profile />} />

              {/* ── Launch ── */}
              <Route path="/create" element={<CreateCommunity />} />

              {/* ── Join ── */}
              <Route path="/join/:id" element={<JoinDao />} />
              <Route path="/join/:id/status" element={<JoinStatus />} />

              {/* ── Group workspace (§13.12–13.19) ── */}
              <Route path="/dashboard/:id" element={<LegacyTabRedirect><CommunityDashboard /></LegacyTabRedirect>} />
              <Route path="/dashboard/:id/pay" element={<GroupPay />} />
              <Route path="/dashboard/:id/votes" element={<GroupVotes />} />
              <Route path="/dashboard/:id/votes/new" element={<CreateDecision />} />
              <Route path="/dashboard/:id/votes/:decisionId" element={<ProposalDetail />} />
              <Route path="/dashboard/:id/people" element={<GroupPeople />} />
              <Route path="/dashboard/:id/money" element={<GroupMoney />} />
              <Route path="/dashboard/:id/settings" element={<GroupSettings />} />
              <Route path="/dashboard/:id/more" element={<GroupMore />} />

              {/* ── Operator / lab (unchanged) ── */}
              <Route path="/onboard" element={<Onboarding />} />
              <Route path="/admin" element={<AdminReconciliation />} />
              <Route path="/admin/akili" element={<AkiliCouncilFilings />} />
              <Route path="/admin/retro" element={<RetroRounds />} />
              <Route path="/retro/:communityId" element={<RetroCommunity />} />
              <Route path="/retro/:communityId/vote" element={<RetroVote />} />
              <Route path="/retro/:communityId/results" element={<RetroResults />} />

              {/* ── §13.25 legacy URLs. Keep these: they are in SMS and email. ── */}
              <Route path="/communities" element={<Navigate to="/groups" replace />} />
              <Route path="/profile" element={<Navigate to="/account" replace />} />
              <Route path="/evaluate" element={<Navigate to="/help#records" replace />} />
              <Route path="/create/purpose" element={<Navigate to="/create" replace />} />
              <Route path="/proposals" element={<Navigate to="/groups" replace />} />
              <Route path="/vote" element={<Navigate to="/groups" replace />} />
              <Route path="/onboarding" element={<Navigate to="/onboard" replace />} />

              <Route
                path="/dashboard/:id/treasury"
                element={<ParamRedirect build={(p) => `/dashboard/${p.id}/money`} />}
              />
              <Route
                path="/dashboard/:id/disbursements"
                element={<ParamRedirect build={(p) => `/dashboard/${p.id}/money?send=1`} />}
              />
              <Route
                path="/dashboard/:id/compliance"
                element={<ParamRedirect build={(p) => `/dashboard/${p.id}/settings#license`} />}
              />
              <Route
                path="/dashboard/:id/decisions/create"
                element={<ParamRedirect build={(p) => `/dashboard/${p.id}/votes/new`} />}
              />
              <Route
                path="/dashboard/:id/decisions/:decisionId"
                element={<ParamRedirect build={(p) => `/dashboard/${p.id}/votes/${p.decisionId}`} />}
              />
              <Route
                path="/dao/:id"
                element={<ParamRedirect build={(p, search) => `/dashboard/${p.id}${search}`} />}
              />
              <Route
                path="/dao/:id/proposals"
                element={<ParamRedirect build={(p) => `/dashboard/${p.id}/votes`} />}
              />
              <Route
                path="/dao/:id/vote"
                element={<ParamRedirect build={(p) => `/dashboard/${p.id}/votes`} />}
              />

              {/* Dev-only fixture page for the shared primitives (PR 0.4). Redirects home in production. */}
              <Route path="/dev/ui" element={<DevUi />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </AppErrorBoundary>
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
