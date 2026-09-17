import React, { lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import OperatorArea from '@/components/OperatorArea';
import ChainProvider from '@/components/ChainProvider';
import PageLoader from '@/components/PageLoader';
import { ROUTE_CHUNKS } from '@/lib/routePrefetch';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { AkiliChatProvider } from '@/akili/AkiliChatContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AccountProvider } from '@/contexts/AccountContext';
import PostAuthRedirect from '@/components/app/PostAuthRedirect';
import { ParamRedirect } from '@/components/app/RouteRedirects';
import LegacyTabRedirect from '@/components/app/LegacyTabRedirect';

const Index = lazy(() => import('./pages/Index'));
// The helper panel carries framer-motion; it must not sit on the first-paint path.
const AkiliChat = lazy(() => import('@/akili/AkiliChat'));
const Home = lazy(ROUTE_CHUNKS.home);
const Communities = lazy(ROUTE_CHUNKS.groups);
const Help = lazy(ROUTE_CHUNKS.help);
const Bounties = lazy(() => import('./pages/Bounties'));
const BountyDetail = lazy(() => import('./pages/BountyDetail'));
const CreateCommunity = lazy(ROUTE_CHUNKS.create);
const CommunityDashboard = lazy(ROUTE_CHUNKS.groupHome);
const GroupPay = lazy(ROUTE_CHUNKS.groupPay);
const GroupVotes = lazy(ROUTE_CHUNKS.groupVotes);
const GroupPeople = lazy(ROUTE_CHUNKS.groupPeople);
const GroupMoney = lazy(ROUTE_CHUNKS.groupMoney);
const GroupSettings = lazy(ROUTE_CHUNKS.groupSettings);
const GroupMore = lazy(ROUTE_CHUNKS.groupMore);
const CreateDecision = lazy(ROUTE_CHUNKS.groupPropose);
const JoinDao = lazy(ROUTE_CHUNKS.join);
const JoinStatus = lazy(ROUTE_CHUNKS.joinStatus);
const Profile = lazy(ROUTE_CHUNKS.account);
const ProposalDetail = lazy(ROUTE_CHUNKS.groupVote);
const AdminReconciliation = lazy(() => import('./pages/AdminReconciliation'));
const AkiliCouncilFilings = lazy(() => import('./pages/AkiliCouncilFilings'));
const RetroRounds = lazy(() => import('./pages/RetroRounds'));
const RetroVote = lazy(() => import('./pages/RetroVote'));
const RetroResults = lazy(() => import('./pages/RetroResults'));
const RetroCommunity = lazy(() => import('./pages/RetroCommunity'));
const Onboarding = lazy(() => import('./pages/LeverageOnboarding'));
const ClaimIdentity = lazy(() => import('./pages/ClaimIdentity'));
const StatusDashboard = lazy(ROUTE_CHUNKS.status);
const NotFound = lazy(() => import('./pages/NotFound'));
const DevUi = lazy(() => import('./pages/DevUi'));

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AccountProvider>
        <ChainProvider>
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
              <Route path="/claim" element={<OperatorArea><ClaimIdentity /></OperatorArea>} />
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
              <Route path="/onboard" element={<OperatorArea><Onboarding /></OperatorArea>} />
              <Route path="/admin" element={<OperatorArea><AdminReconciliation /></OperatorArea>} />
              <Route path="/admin/akili" element={<OperatorArea><AkiliCouncilFilings /></OperatorArea>} />
              <Route path="/admin/retro" element={<OperatorArea><RetroRounds /></OperatorArea>} />
              <Route path="/retro/:communityId" element={<OperatorArea><RetroCommunity /></OperatorArea>} />
              <Route path="/retro/:communityId/vote" element={<OperatorArea><RetroVote /></OperatorArea>} />
              <Route path="/retro/:communityId/results" element={<OperatorArea><RetroResults /></OperatorArea>} />

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
            <Suspense fallback={null}>
              <AkiliChat />
            </Suspense>
            <Toaster />
          </AkiliChatProvider>
          </OfflineProvider>
        </ChainProvider>
      </AccountProvider>
    </ThemeProvider>
  );
};

export default App;
