import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Users, Vote, PlusCircle, CreditCard,
  ArrowLeft, Calendar, ShieldCheck, ReceiptText,
  LayoutDashboard, Wallet as WalletIcon, ExternalLink, Activity,
  Images, BriefcaseBusiness, Crown, Lightbulb, Trophy, MapIcon,
  Layers, Settings, ChevronRight, Menu, X,
} from 'lucide-react';
import ActivityFeed from '@/components/community/ActivityFeed';
import MemberDirectory from '@/components/community/MemberDirectory';
import CommunityRoles from '@/components/community/CommunityRoles';
import CommunitySuggestions from '@/components/community/CommunitySuggestions';
import CommunityLeaderboard from '@/components/community/CommunityLeaderboard';
import CommunityRoadmap from '@/components/community/CommunityRoadmap';
import CombinedBoard from '@/components/community/CombinedBoard';
import CommunitySettings from '@/components/community/CommunitySettings';
import Layout from '@/components/Layout';
import DecisionCard from '@/components/DecisionCard';
import { formatRailAmountFromKes, formatRailDate, cn } from '@/lib/utils';
import { useDecisions } from '@/hooks/useBarazaData';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useCommunity } from '@/hooks/useCommunities';
import { getActiveMembership } from '@/lib/memberships';
import CommunityBanner from '@/components/CommunityBanner';
import CommunityGallery from '@/components/CommunityGallery';
import BountyBoard from '@/components/BountyBoard';
import { CHAINS } from '@/lib/chain';
import { useSeo } from '@/lib/seo';
import { useChain } from '@/hooks/useChain';

// ─── Tab definition ───────────────────────────────────────────────────────────

type DashboardTab =
  | 'overview' | 'members' | 'roles' | 'suggestions'
  | 'governance' | 'leaderboard' | 'roadmap' | 'combined'
  | 'bounties' | 'gallery' | 'activity' | 'wallet' | 'settings';

interface TabDef {
  key: DashboardTab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { key: 'overview',     label: 'Home',                  icon: LayoutDashboard },
  { key: 'governance',   label: 'Decisions',             icon: Vote },
  { key: 'members',      label: 'Members',               icon: Users },
  { key: 'wallet',       label: 'Group account',         icon: WalletIcon },
  { key: 'suggestions',  label: 'Suggestions',           icon: Lightbulb },
  { key: 'roles',        label: 'Roles',                 icon: Crown },
  { key: 'roadmap',      label: 'Plans',                 icon: MapIcon },
  { key: 'combined',     label: 'Shared board',          icon: Layers },
  { key: 'bounties',     label: 'Community work',        icon: BriefcaseBusiness },
  { key: 'leaderboard',  label: 'Recognition',           icon: Trophy },
  { key: 'gallery',      label: 'Photos',                icon: Images },
  { key: 'activity',     label: 'Updates',               icon: Activity },
  { key: 'settings',     label: 'Settings',              icon: Settings },
];

const DASHBOARD_TAB_KEYS = new Set<DashboardTab>(TABS.map((tab) => tab.key));

function getDashboardTab(searchParams: URLSearchParams, pathname: string): DashboardTab {
  const tab = searchParams.get('tab') as DashboardTab | null;
  if (tab && DASHBOARD_TAB_KEYS.has(tab)) return tab;
  return /\/dao\/[^/]+\/(?:proposals|vote)\/?$/.test(pathname) ? 'governance' : 'overview';
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────

function SidebarNav({
  active,
  onChange,
  isMember,
  communityId,
}: {
  active: DashboardTab;
  onChange: (t: DashboardTab) => void;
  isMember: boolean;
  communityId: string;
}) {
  const home = TABS[0];
  const more = TABS.slice(1);

  const tabLink = (tab: TabDef) => {
    const Icon = tab.icon;
    const isActive = active === tab.key;
    const to = tab.key === 'overview'
      ? `/dashboard/${communityId}`
      : `/dashboard/${communityId}?tab=${tab.key}`;

    return (
      <Link
        key={tab.key}
        to={to}
        onClick={() => onChange(tab.key)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{tab.label}</span>
        {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-1">
      {tabLink(home)}
      <details className="group mt-1" open={active !== 'overview'}>
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground">
          <Menu className="h-4 w-4" />
          More
          <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-1 space-y-1 border-l border-border/60 pl-2">
          {more.map(tabLink)}
        </div>
      </details>

      {/* Quick action */}
      <div className="mt-3 border-t border-border/40 pt-3">
        {isMember ? (
          <Link
            to={`/dashboard/${communityId}/decisions/create`}
            className="flex w-full items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/10"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New decision
          </Link>
        ) : (
          <Link
            to={`/join/${communityId}`}
            className="flex w-full items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/5 px-3 py-2 text-xs font-bold text-secondary transition-all hover:bg-secondary/10"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Join group
          </Link>
        )}
      </div>
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CommunityDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { chain } = useChain();
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => getDashboardTab(searchParams, location.pathname));
  const [isMember, setIsMember] = useState(false);
  const [walletSol, setWalletSol] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { community, isLoading, error } = useCommunity(id);
  const { active: activeDecisions, past: pastDecisions, all: allDecisions } = useDecisions(id ?? '');

  useSeo({
    title: community ? `${community.name} dashboard` : undefined,
    description: 'Group funds, members, decisions, and recent updates for a Baraza community.',
    path: id ? `/dashboard/${id}` : '/dashboard',
    noIndex: true,
  });

  useEffect(() => {
    if (!publicKey) { setWalletSol(null); return; }
    let cancelled = false;
    connection.getBalance(publicKey)
      .then((lamports) => { if (!cancelled) setWalletSol(lamports / LAMPORTS_PER_SOL); })
      .catch(() => { if (!cancelled) setWalletSol(null); });
    return () => { cancelled = true; };
  }, [connection, publicKey]);

  useEffect(() => {
    if (!community || !publicKey) { setIsMember(false); return; }
    setIsMember(!!getActiveMembership(community.id, publicKey.toBase58()));
  }, [community, publicKey]);

  useEffect(() => {
    setActiveTab(getDashboardTab(searchParams, location.pathname));
  }, [location.pathname, searchParams]);

  // Keep dashboard sections linkable while closing the mobile menu after selection.
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }
    setSearchParams(nextParams);
  };

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
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-2xl font-bold mb-3">Community not found</h1>
            <p className="text-sm mb-6">
              {error?.message ?? 'This community does not exist or is not available in the current data.'}
            </p>
            <Link to="/communities" className="btn-primary text-sm inline-flex">
              View Communities
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const currentTab = TABS.find((t) => t.key === activeTab);
  const canPostBounties = isMember;
  const communityChain = community.chain ?? chain;
  const communityChainMeta = CHAINS[communityChain];
  const activeRailLabel = communityChainMeta.testnet.label;

  return (
    <Layout>
      <section className="relative overflow-hidden py-8 md:py-12">
        <div className="container relative z-10 mx-auto px-4">

          {/* Back */}
          <Link to="/communities" className="inline-flex items-center gap-2 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            All Communities
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

          {/* ── Sidebar + content layout ──────────────────────── */}
          <div className="flex gap-6">

            {/* Mobile sidebar toggle */}
            <div className="lg:hidden mb-4 w-full">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-sm font-semibold"
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                {currentTab?.label ?? 'Menu'}
                <ChevronRight className={cn('ml-auto h-4 w-4 transition-transform', sidebarOpen && 'rotate-90')} />
              </button>
              {sidebarOpen && (
                <div className="mt-2 rounded-xl border border-border/60 bg-card/90 p-3">
                  <SidebarNav
                    active={activeTab}
                    onChange={handleTabChange}
                    isMember={isMember}
                    communityId={community.id}
                  />
                </div>
              )}
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="sticky top-24 rounded-xl border border-border/60 bg-card/70 p-3">
                <SidebarNav
                  active={activeTab}
                  onChange={handleTabChange}
                  isMember={isMember}
                  communityId={community.id}
                />
              </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1">

              {/* ── Home ── */}
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  <section aria-labelledby="attention-heading">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Start here</p>
                        <h2 id="attention-heading" className="mt-1 font-display text-2xl font-semibold">Needs your attention</h2>
                      </div>
                      <Link to={`/dashboard/${community.id}?tab=governance`} className="text-sm font-semibold text-primary">See all decisions</Link>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card p-5">
                      {activeDecisions.length > 0 ? (
                        <div className="space-y-4">
                          {activeDecisions.slice(0, 2).map((decision) => (
                            <Link key={decision.id} to={`/dashboard/${community.id}/decisions/${decision.id}`} className="flex items-center justify-between gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                              <div>
                                <p className="font-semibold text-foreground">{decision.title}</p>
                                <p className="mt-1 text-sm text-muted-foreground">Review the details and record your view.</p>
                              </div>
                              <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nothing needs a decision from you right now.</p>
                      )}
                    </div>
                  </section>

                  <section aria-labelledby="conversation-heading">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Listen before deciding</p>
                      <h2 id="conversation-heading" className="mt-1 font-display text-2xl font-semibold">Community conversation</h2>
                    </div>
                    <div className="rounded-2xl bg-muted/35 p-5 md:p-6">
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        Open a decision to ask questions, reply to another member, mention someone who can help, or ask Akili to summarise the discussion without taking a side.
                      </p>
                      <Link to={`/dashboard/${community.id}?tab=governance`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                        Join a conversation <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </section>

                  <section aria-labelledby="money-heading">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">A simple account view</p>
                        <h2 id="money-heading" className="mt-1 font-display text-2xl font-semibold">Money updates</h2>
                      </div>
                      <Link to={`/dashboard/${community.id}/treasury`} className="text-sm font-semibold text-primary">View group account</Link>
                    </div>
                    <div className="grid gap-4 rounded-2xl border border-border/70 bg-card p-5 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Group funds</p>
                        <p className="mt-2 font-display text-2xl font-semibold">{formatRailAmountFromKes(community.fundBalance, communityChainMeta)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly contribution</p>
                        <p className="mt-2 font-display text-xl font-semibold">{formatRailAmountFromKes(community.membershipFee, communityChainMeta)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Withdrawal requests</p>
                        <p className="mt-2 font-display text-xl font-semibold">None waiting</p>
                      </div>
                    </div>
                  </section>
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
                    <h3 className="font-display text-base font-semibold">Governance proposals</h3>
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
                      <p className="text-sm">No governance proposals yet.</p>
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
                      <h3 className="font-display text-base font-semibold">Community treasury</h3>
                      <ReceiptText className="h-4 w-4" />
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between border-b pb-3">
                        <span>Treasury rail</span>
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: communityChainMeta.badgeBg }} />
                          {activeRailLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-3">
                        <span>Recorded balance</span>
                        <span className="font-display text-lg font-bold">{formatRailAmountFromKes(community.fundBalance, communityChainMeta)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-3">
                        <span>Treasury record</span>
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
                      Open treasury detail
                    </Link>
                  </div>

                  <div className="premium-glass rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold">Your {communityChainMeta.label} account</h3>
                      <WalletIcon className="h-4 w-4" />
                    </div>
                    {communityChain === 'solana' && publicKey ? (
                      <div className="space-y-3 text-sm">
                        <div className="rounded-lg border p-3">
                          <p className="text-[10px] uppercase tracking-widest">Address</p>
                          <p className="mt-1 font-mono text-xs break-all">{publicKey.toBase58()}</p>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                          <span>Network fee balance</span>
                          <span className="font-display text-lg font-bold tabular-nums">
                            {walletSol === null ? '-' : `${walletSol.toFixed(4)} native units`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                          <span>Cluster</span>
                          <span className="text-xs font-semibold">{activeRailLabel}</span>
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
                          {communityChainMeta.accountCta} from the header to see account status for this rail.
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
