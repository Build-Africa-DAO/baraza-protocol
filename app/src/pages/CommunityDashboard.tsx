import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Users, TrendingUp, Vote, History, PlusCircle, CreditCard,
  ArrowLeft, Calendar, ShieldCheck, ReceiptText,
  Wallet as WalletIcon, ExternalLink, Activity,
  BriefcaseBusiness, ChevronRight, Menu, X,
} from 'lucide-react';
import LiveStatCard from '@/components/community/LiveStatCard';
import ActivityFeed from '@/components/community/ActivityFeed';
import MemberDirectory from '@/components/community/MemberDirectory';
import CommunityRoles from '@/components/community/CommunityRoles';
import CommunitySuggestions from '@/components/community/CommunitySuggestions';
import CommunityLeaderboard from '@/components/community/CommunityLeaderboard';
import CommunityRoadmap from '@/components/community/CommunityRoadmap';
import CombinedBoard from '@/components/community/CombinedBoard';
import CommunitySettings from '@/components/community/CommunitySettings';
import Layout from '@/components/Layout';
import { StatusScreen } from '@/components/StatusPage';
import DecisionCard from '@/components/DecisionCard';
import { formatRailAmountFromKes, formatRailDate, cn } from '@/lib/utils';
import { useDecisions } from '@/hooks/useBarazaData';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCommunity } from '@/hooks/useCommunities';
import { getActiveMembership } from '@/lib/memberships';
import { useMyMemberships } from '@/hooks/useMyMemberships';
import CommunityBanner from '@/components/CommunityBanner';
import CommunityGallery from '@/components/CommunityGallery';
import BountyBoard from '@/components/BountyBoard';
import { CHAINS } from '@/lib/chain';
import { useSeo } from '@/lib/seo';
import { getBountyStatsForCommunity } from '@/lib/bounties';
import { useChain } from '@/hooks/useChain';
import { useAccount } from '@/contexts/AccountContext';
import { DASHBOARD_TABS, getDashboardTab, GroupSidebarNav, type DashboardTab } from '@/components/app/GroupSidebarNav';

// ─── Page ─────────────────────────────────────────────────────────────────────

const CommunityDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { publicKey } = useWallet();
  const account = useAccount();
  const { chain } = useChain();
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => getDashboardTab(searchParams, location.pathname));
  const [isMember, setIsMember] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { community, isLoading, error, reload } = useCommunity(id);
  const { active: activeDecisions, past: pastDecisions, all: allDecisions } = useDecisions(id ?? '');
  const { active: myActiveMemberships } = useMyMemberships();

  useSeo({
    title: community ? `${community.name} dashboard` : undefined,
    description: 'Group funds, member roster, decisions, and account activity for a Baraza community.',
    path: id ? `/dashboard/${id}` : '/dashboard',
    noIndex: true,
  });

  useEffect(() => {
    if (!community) {
      setIsMember(false);
      return;
    }
    if (myActiveMemberships.some((item) => item.community.id === community.id)) {
      setIsMember(true);
      return;
    }
    const identity = account.accountId ?? publicKey?.toBase58();
    if (!identity) {
      setIsMember(false);
      return;
    }
    setIsMember(!!getActiveMembership(community.id, identity));
  }, [account.accountId, community, myActiveMemberships, publicKey]);

  useEffect(() => {
    setActiveTab(getDashboardTab(searchParams, location.pathname));
  }, [location.pathname, searchParams]);

  if (isLoading) {
    return (
      <Layout>
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 space-y-6">
            <div className="baraza-card animate-pulse p-5 md:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="h-14 w-14 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-7 w-64 rounded bg-muted" />
                  <div className="h-3 w-full max-w-md rounded bg-muted" />
                  <div className="flex gap-2 mt-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-6 w-20 rounded-full bg-muted" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="baraza-card animate-pulse p-4 space-y-3">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-6 w-24 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!community) {
    if (error) {
      return <StatusScreen kind="server" onRetry={() => void reload()} />;
    }
    return <StatusScreen kind="community" />;
  }

  const bountyStats = getBountyStatsForCommunity(community.id);
  const currentTab = DASHBOARD_TABS.find((t) => t.key === activeTab);
  const inAppShell = account.authenticated;
  const canPostBounties = isMember;
  const communityChain = community.chain ?? chain;
  const communityChainMeta = CHAINS[communityChain];

  return (
    <Layout>
      <section className="relative overflow-x-clip py-8 md:py-12">
        <div className="container relative z-10 mx-auto px-4">

          <Link
            to={account.authenticated ? '/home' : '/communities'}
            className="mb-6 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {account.authenticated ? 'My groups' : 'All groups'}
          </Link>

          {/* Community header banner */}
          <div className="mb-6">
            <CommunityBanner className="p-5 md:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border">
                  <span className="font-display text-lg font-bold">{community.image}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Group workspace
                  </div>
                  <h1 className="mb-2 font-display text-2xl font-bold md:text-4xl">{community.name}</h1>
                  <p className="max-w-3xl text-sm leading-6">{community.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium capitalize">
                      {community.type}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium">
                      Community group funds
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Since {formatRailDate(community.createdAt, communityChainMeta, { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-medium">{formatRailAmountFromKes(community.membershipFee, communityChainMeta)}/month</span>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                  {!isMember ? (
                    <Link to={`/join/${community.id}`} className="btn-warm justify-center text-sm sm:whitespace-nowrap">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Join group
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      Active member
                    </span>
                  )}
                </div>
              </div>
            </CommunityBanner>
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <LiveStatCard icon={TrendingUp} label="Group funds" value={community.fundBalance} format={(v) => formatRailAmountFromKes(v, communityChainMeta)} color="text-primary" bg="bg-primary/10" />
            <LiveStatCard icon={Users} label="Members" value={community.memberCount} color="text-secondary" bg="bg-secondary/10" />
            <LiveStatCard icon={Vote} label="Active Proposals" value={activeDecisions.length} color="text-accent" bg="bg-accent/10" showDelta={false} />
            <LiveStatCard icon={History} label="Past Proposals" value={pastDecisions.length} color="text-muted-foreground" bg="bg-muted" showDelta={false} />
            <LiveStatCard icon={BriefcaseBusiness} label="Open Bounties" value={bountyStats.open} color="text-confirmed" bg="bg-confirmed/10" showDelta={false} />
          </div>

          {!inAppShell && (
            <div className="mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen((value) => !value)}
                className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-sm font-semibold"
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                {currentTab?.label ?? 'Menu'}
                <ChevronRight className={cn('ml-auto h-4 w-4 transition-transform', sidebarOpen && 'rotate-90')} />
              </button>
              {sidebarOpen && (
                <div className="mt-2 rounded-xl border border-border/60 bg-card/90 p-3">
                  <GroupSidebarNav
                    communityId={community.id}
                    isMember={isMember}
                    onNavigate={() => setSidebarOpen(false)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-6">
            {!inAppShell && (
              <aside className="hidden w-52 flex-shrink-0 lg:block">
                <div className="sticky top-24 rounded-xl border border-border/60 bg-card/70 p-3">
                  <GroupSidebarNav communityId={community.id} isMember={isMember} />
                </div>
              </aside>
            )}

            <main className="min-w-0 flex-1">

              {/* ── Overview ── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="premium-glass rounded-xl p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Membership</p>
                        <h3 className="mt-1 font-display text-lg font-semibold">
                          {isMember ? 'You belong to this group' : 'You are visiting this group'}
                        </h3>
                      </div>
                      {isMember ? (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                          <ShieldCheck className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Not a member
                        </span>
                      )}
                    </div>
                    {isMember ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Monthly dues {formatRailAmountFromKes(community.membershipFee, communityChainMeta)}. A due date will show here when the group record includes one.
                      </p>
                    ) : (
                      <>
                        <p className="mt-3 text-sm text-muted-foreground">Join to pay dues, vote, and read the shared money record.</p>
                        <Link to={`/join/${community.id}`} className="btn-warm mt-4 w-full justify-center text-sm sm:w-auto">Join group</Link>
                      </>
                    )}
                  </div>

                  <div className="premium-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold">Next contribution</h3>
                        <p className="text-xs text-muted-foreground">Amount and status for this group.</p>
                      </div>
                      {isMember && (
                        <Link to={`/join/${community.id}`} className="text-xs font-semibold text-primary">Pay dues</Link>
                      )}
                    </div>
                    <div className="rounded-lg border border-dashed border-border px-4 py-6">
                      <p className="text-sm font-semibold">
                        {community.membershipFee > 0
                          ? formatRailAmountFromKes(community.membershipFee, communityChainMeta)
                          : 'No dues listed'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due date and payment status are not available yet. They will appear when the payment record is connected.
                      </p>
                    </div>
                  </div>

                  <div className="premium-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold">Decisions needing a vote</h3>
                        <p className="text-xs text-muted-foreground">Open proposals for this group.</p>
                      </div>
                      <Link to={`/dashboard/${community.id}?tab=governance`} className="text-xs font-semibold text-primary">
                        All decisions
                      </Link>
                    </div>
                    {activeDecisions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No open decisions right now.</p>
                    ) : (
                      <ul className="space-y-3">
                        {activeDecisions.slice(0, 3).map((decision) => (
                          <li key={decision.id}>
                            <Link
                              to={`/dashboard/${community.id}/decisions/${decision.id}`}
                              className="block rounded-lg border p-4 transition-colors hover:border-primary/40"
                            >
                              <p className="font-display text-sm font-semibold">{decision.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatRailAmountFromKes(decision.fundingAmount, communityChainMeta)}
                                {' · '}
                                {decision.votesFor + decision.votesAgainst} votes recorded
                              </p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="premium-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold">Group funds</h3>
                        <p className="text-xs text-muted-foreground">Total recorded for this group. Available and reserved will show when the statement is connected.</p>
                      </div>
                      <Link to={`/dashboard/${community.id}/treasury`} className="text-xs font-semibold text-primary">
                        Open funds
                      </Link>
                    </div>
                    <p className="font-display text-3xl font-bold tabular-nums">
                      {formatRailAmountFromKes(community.fundBalance, communityChainMeta)}
                    </p>
                  </div>

                  <div className="baraza-card p-4">
                    <div className="mb-4 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <h3 className="font-display text-sm font-semibold">Recent activity</h3>
                      </div>
                      <Link to={`/dashboard/${community.id}?tab=activity`} className="text-xs font-semibold text-primary">
                        Full activity
                      </Link>
                    </div>
                    <ActivityFeed communityId={id ?? community.id} limit={5} />
                  </div>
                </div>
              )}

              {/* ── Roles ── */}
              {activeTab === 'roles' && (
                <CommunityRoles memberCount={community.memberCount} />
              )}

              {/* ── Suggestions ── */}
              {activeTab === 'suggestions' && (
                <CommunitySuggestions communityId={community.id} />
              )}

              {/* ── Leaderboard ── */}
              {activeTab === 'leaderboard' && (
                <CommunityLeaderboard communityId={community.id} />
              )}

              {/* ── Roadmap ── */}
              {activeTab === 'roadmap' && (
                <CommunityRoadmap communityId={community.id} />
              )}

              {/* ── Combined Board ── */}
              {activeTab === 'combined' && (
                <CombinedBoard communityId={community.id} decisions={allDecisions} />
              )}

              {/* ── Governance ── */}
              {activeTab === 'governance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold">Decisions</h3>
                    {isMember && (
                      <Link
                        to={`/dashboard/${community.id}/decisions/create`}
                        className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        New Proposal
                      </Link>
                    )}
                  </div>

                  {activeDecisions.length > 0 && (
                    <div>
                      <h4 className="font-display text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-[11px]">Active</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeDecisions.map((d) => <DecisionCard key={d.id} {...d} chainMeta={communityChainMeta} />)}
                      </div>
                    </div>
                  )}

                  {pastDecisions.length > 0 && (
                    <div>
                      <h4 className="font-display text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-[11px]">Past</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pastDecisions.map((d) => <DecisionCard key={d.id} {...d} chainMeta={communityChainMeta} />)}
                      </div>
                    </div>
                  )}

                  {allDecisions.length === 0 && (
                    <div className="baraza-card p-10 text-center">
                      <Vote className="w-8 h-8 mx-auto mb-3" />
                      <p className="text-sm">No decisions yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Bounties ── */}
              {activeTab === 'bounties' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold">Bounty board</h3>
                    {canPostBounties ? (
                      <Link to="/bounties" className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2">
                        <PlusCircle className="w-3.5 h-3.5" />
                        Post bounty
                      </Link>
                    ) : (
                      <span className="rounded-lg border px-3 py-2 text-xs font-semibold text-muted-foreground">
                        Members only
                      </span>
                    )}
                  </div>
                  <BountyBoard communityId={community.id} communityName={community.name} />
                  <div className="premium-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <h3 className="font-display text-base font-semibold">Announcement impact</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        ['Events', 'Event bounties appear in the community activity feed and member profile.'],
                        ['Integrations', 'Technical bounties connect group needs to builders and auditors.'],
                        ['Member profile', 'Members can see paid opportunities attached to their communities.'],
                      ].map(([label, detail]) => (
                        <div key={label} className="rounded-lg border p-4">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{label}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Members ── */}
              {activeTab === 'members' && (
                <MemberDirectory communityId={id ?? '1'} totalCount={community?.memberCount} />
              )}

              {/* ── Gallery ── */}
              {activeTab === 'gallery' && (
                <CommunityGallery communityName={community.name} type={community.type} />
              )}

              {/* ── Activity ── */}
              {activeTab === 'activity' && (
                <div className="baraza-card p-4">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Activity className="w-4 h-4" />
                    <h3 className="font-display text-sm font-semibold">Recent Activity</h3>
                  </div>
                  <ActivityFeed communityId={id ?? '1'} limit={15} />
                </div>
              )}

              {/* ── Wallet / Account ── */}
              {activeTab === 'wallet' && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="premium-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold">Community group funds</h3>
                      <ReceiptText className="h-4 w-4" />
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between border-b pb-3">
                        <span>Payment status</span>
                        <span className="font-semibold">Active</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-3">
                        <span>Recorded balance</span>
                        <span className="font-display text-lg font-bold">{formatRailAmountFromKes(community.fundBalance, communityChainMeta)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-3">
                        <span>Group funds record</span>
                        <span className="text-xs font-semibold">Pending program deploy</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Withdrawals</span>
                        <span className="text-xs font-semibold capitalize">
                          {(community.treasuryPolicy ?? 'multisig-ready').replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <Link to={`/dashboard/${community.id}/treasury`} className="btn-ghost mt-5 w-full justify-center gap-2 text-sm">
                      <ExternalLink className="h-4 w-4" />
                      Open group funds detail
                    </Link>
                  </div>

                  <div className="premium-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold">Your Baraza account</h3>
                      <WalletIcon className="h-4 w-4" />
                    </div>
                    {account.authenticated ? (
                      <div className="space-y-3 text-sm">
                        <div className="rounded-lg border p-3">
                          <p className="text-[10px] uppercase tracking-widest">Signed in as</p>
                          <p className="mt-1 text-sm font-semibold break-all">{account.displayName}</p>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                          <span>Country and currency</span>
                          <span className="font-semibold">{account.country.name} · {account.country.currency}</span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                          <span>Account status</span>
                          <span className="text-xs font-semibold">Connected</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Membership</span>
                          <span className="text-xs font-semibold">{isMember ? 'Active' : 'None'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <WalletIcon className="mx-auto mb-3 h-8 w-8" />
                        <p className="text-sm font-semibold">Account not connected</p>
                        <p className="mt-1 text-xs">
                          Log in from the header to see your account status.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Settings ── */}
              {activeTab === 'settings' && (
                <CommunitySettings community={community} isMember={isMember} />
              )}

            </main>
          </div>

        </div>
      </section>
    </Layout>
  );
};

export default CommunityDashboard;
