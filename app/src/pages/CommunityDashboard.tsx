import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, TrendingUp, Vote, History, PlusCircle, CreditCard,
  ArrowLeft, Calendar, ShieldCheck, ReceiptText,
  LayoutDashboard, Wallet as WalletIcon, ExternalLink, Activity, Images,
} from 'lucide-react';
import LiveStatCard from '@/components/community/LiveStatCard';
import ActivityFeed from '@/components/community/ActivityFeed';
import MemberDirectory from '@/components/community/MemberDirectory';
import Layout from '@/components/Layout';
import DecisionCard from '@/components/DecisionCard';
import { MOCK_DECISIONS } from '@/lib/constants';
import { formatKSh } from '@/lib/utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useCommunity } from '@/hooks/useCommunities';
import { getActiveMembership } from '@/lib/memberships';
import CommunityBanner from '@/components/CommunityBanner';
import CommunityGallery from '@/components/CommunityGallery';
import { CHAINS } from '@/lib/chain';
import { NETWORK_LABEL } from '@/lib/network';
import { useSeo } from '@/lib/seo';

type DashboardTab = 'overview' | 'members' | 'governance' | 'gallery' | 'activity' | 'wallet';

const dashboardGlobeUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAhAO65kkwr6zxxrtYjpZm23ugp7boCWsRE_kTE7O3PUPmonOS4vJUPPGp_AALnUHlCa23XX7HVjJ3lfv_cs2mIWSzHwYBQIvrue4TcJGeHUsuQLKSNOuhSpHNySzZ8pUcK9MLmMfeh0l2ciNsph8EcgoHMr86aCmoQZLn2qesMSBGPMStXx9CHE1aW6vpRO1bQ13KDvFm92lVbqFLdD6qie_U66bf4EIKpbK6LxxS-9a0Q4YK3m0GuJPePOTqqPhC9tTuWGu4UnIo";

const CommunityDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isMember, setIsMember] = useState(false);
  const [walletSol, setWalletSol] = useState<number | null>(null);

  const { community, isLoading, error } = useCommunity(id);

  useSeo({
    title: community ? `${community.name} dashboard` : "Community dashboard",
    description: "Treasury balance, member roster, proposals, and wallet activity for a Baraza community DAO.",
    path: id ? `/dashboard/${id}` : "/dashboard",
    noIndex: true,
  });

  // Fetch the connected wallet's SOL balance from the configured Solana cluster.
  // Real RPC call — the treasury vault PDA balance is shown only after program deploy.
  useEffect(() => {
    if (!publicKey) {
      setWalletSol(null);
      return;
    }
    let cancelled = false;
    connection
      .getBalance(publicKey)
      .then((lamports) => {
        if (!cancelled) setWalletSol(lamports / LAMPORTS_PER_SOL);
      })
      .catch(() => {
        if (!cancelled) setWalletSol(null);
      });
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  useEffect(() => {
    if (!community || !publicKey) {
      setIsMember(false);
      return;
    }

    setIsMember(!!getActiveMembership(community.id, publicKey.toBase58()));
  }, [community, publicKey]);

  if (isLoading) {
    return (
      <Layout>
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 space-y-6">
            {/* Banner skeleton */}
            <div className="baraza-card animate-pulse p-5 md:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="h-14 w-14 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-7 w-64 rounded bg-muted" />
                  <div className="h-3 w-full max-w-md rounded bg-muted" />
                  <div className="h-3 w-3/4 max-w-sm rounded bg-muted" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 w-20 rounded-full bg-muted" />
                    <div className="h-6 w-20 rounded-full bg-muted" />
                    <div className="h-6 w-32 rounded-full bg-muted" />
                  </div>
                </div>
                <div className="h-9 w-32 rounded-lg bg-muted flex-shrink-0" />
              </div>
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="baraza-card animate-pulse p-4 space-y-3">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-6 w-24 rounded bg-muted" />
                  <div className="h-2 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
            {/* Tabs skeleton */}
            <div className="flex gap-1 border-b pb-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 w-24 rounded-t bg-muted animate-pulse" />
              ))}
            </div>
            {/* Content skeleton */}
            <div className="grid gap-4 lg:grid-cols-[1fr_21rem]">
              <div className="baraza-card animate-pulse p-5 space-y-4">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-4 space-y-2">
                      <div className="h-2 w-24 rounded bg-muted" />
                      <div className="h-7 w-12 rounded bg-muted" />
                      <div className="h-2 w-20 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="baraza-card animate-pulse p-5 space-y-4">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between border-b pb-2">
                      <div className="h-3 w-20 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
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
            <h1 className="font-display text-2xl font-bold mb-3">
              Community not found
            </h1>
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

  const decisions = MOCK_DECISIONS.filter((d) => d.communityId === community.id);
  const activeDecisions = decisions.filter((d) => d.status === 'active');
  const pastDecisions = decisions.filter((d) => d.status === 'completed');

  return (
    <Layout>
      <section className="relative overflow-hidden py-8 md:py-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-[center_right] opacity-20 mix-blend-screen"
            style={{ backgroundImage: `url(${dashboardGlobeUrl})` }}
          />
        </div>
        <div className="container relative z-10 mx-auto px-4">
          {/* Back */}
          <Link
            to="/communities"
            className="inline-flex items-center gap-2 text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Communities
          </Link>

          {/* Community header */}
          <div className="mb-8">
            <CommunityBanner className="p-5 md:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border">
                <span className="font-display text-lg font-bold">{community.image}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Community DAO workspace
                </div>
                <h1 className="mb-2 font-display text-2xl font-bold md:text-4xl">
                  {community.name}
                </h1>
                <p className="max-w-3xl text-sm leading-6">{community.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium capitalize">
                    {community.type} DAO
                  </span>
                  <span
                    aria-label={`Network: ${CHAINS[community.chain ?? 'solana'].label}`}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium"
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: CHAINS[community.chain ?? 'solana'].badgeBg }}
                    />
                    {CHAINS[community.chain ?? 'solana'].label}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Since {new Date(community.createdAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="font-medium">
                    {formatKSh(community.membershipFee)}/month membership
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                {!isMember ? (
                  <Link
                    to={`/join/${community.id}`}
                    className="btn-warm justify-center text-sm sm:whitespace-nowrap"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Join this DAO
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    Active member
                  </span>
                )}
                <div className="rounded-lg border px-3 py-2 text-xs">
                  Membership activates after on-chain confirmation, not just payment.
                </div>
              </div>
            </div>
            </CommunityBanner>
          </div>

          {/* Live stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <LiveStatCard
              icon={TrendingUp}
              label="DAO Treasury"
              value={community.fundBalance}
              format={(v) => formatKSh(v)}
              color=""
              bg=""
            />
            <LiveStatCard
              icon={Users}
              label="Members"
              value={community.memberCount}
              color=""
              bg=""
            />
            <LiveStatCard
              icon={Vote}
              label="Active Proposals"
              value={activeDecisions.length}
              color=""
              bg=""
              showDelta={false}
            />
            <LiveStatCard
              icon={History}
              label="Past Proposals"
              value={pastDecisions.length}
              color=""
              bg=""
              showDelta={false}
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap items-center gap-1 border-b pb-px">
            {([
              { key: 'overview', label: 'Overview', icon: LayoutDashboard },
              { key: 'members', label: 'Members', icon: Users },
              { key: 'governance', label: 'Governance', icon: Vote },
              { key: 'gallery', label: 'Gallery', icon: Images },
              { key: 'activity', label: 'Activity', icon: Activity },
              { key: 'wallet', label: 'Wallet', icon: WalletIcon },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-current'
                    : 'border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
            {isMember && activeTab === 'governance' && (
              <Link
                to={`/dashboard/${community.id}/decisions/create`}
                className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Proposal
              </Link>
            )}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_21rem]">
                <div className="premium-glass rounded-xl p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold">DAO activity overview</h3>
                      <p className="text-xs">Contributions, proposals, and votes at a glance.</p>
                    </div>
                    <span className="hidden rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex">
                      <Activity className="mr-1 h-3 w-3" />
                      Solana {NETWORK_LABEL}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ['Payments verified', '24', 'This month'],
                      ['Votes cast', '96', 'Across active proposals'],
                      ['Pending releases', activeDecisions.length.toString(), 'Awaiting quorum'],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-lg border p-4">
                        <p className="text-[10px] uppercase tracking-widest">{label}</p>
                        <p className="mt-2 font-display text-2xl font-bold">{value}</p>
                        <p className="mt-1 text-xs">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="premium-glass rounded-xl p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold">Your role</h3>
                    {isMember ? (
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        <ShieldCheck className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        Not a member
                      </span>
                    )}
                  </div>
                  {isMember ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span>Role</span>
                        <span className="font-semibold">Member</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span>Voting power</span>
                        <span className="font-semibold">1 vote</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly dues</span>
                        <span className="font-semibold">{formatKSh(community.membershipFee)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs">
                        Join to receive a Solana membership credential and vote on proposals.
                      </p>
                      <Link to={`/join/${community.id}`} className="btn-warm mt-4 w-full justify-center text-sm">
                        Join DAO
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="premium-glass rounded-xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold">Governance rules</h3>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ['Quorum', `${community.quorumPct ?? 51}%`],
                    ['Approval', `${community.approvalThresholdPct ?? 66}%`],
                    ['Voting period', `${community.votingPeriodDays ?? 7} days`],
                    ['Treasury', (community.treasuryPolicy ?? 'multisig-ready').replace('-', ' ')],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border p-3">
                      <p className="text-[10px] uppercase tracking-widest">{label}</p>
                      <p className="mt-1 font-semibold capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <CommunityGallery communityName={community.name} type={community.type} compact />
            </div>
          )}

          {/* Members tab */}
          {activeTab === 'members' && (
            <div>
              <MemberDirectory communityId={id ?? '1'} />
            </div>
          )}

          {/* Activity tab */}
          {activeTab === 'activity' && (
            <div>
              <div className="baraza-card p-4">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Activity className="w-4 h-4" />
                  <h3 className="font-display text-sm font-semibold">Recent Activity</h3>
                </div>
                <ActivityFeed communityId={id ?? '1'} limit={15} />
              </div>
            </div>
          )}

          {/* Governance tab */}
          {activeTab === 'governance' && (
            <div className="space-y-8">
              {activeDecisions.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-semibold mb-4">Active Proposals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDecisions.map((d) => (
                      <div key={d.id}>
                        <DecisionCard {...d} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastDecisions.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-semibold mb-4">Past Proposals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastDecisions.map((d) => (
                      <div key={d.id}>
                        <DecisionCard {...d} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {decisions.length === 0 && (
                <div className="baraza-card p-10 text-center">
                  <Vote className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-sm">No governance proposals yet. Be the first to submit one!</p>
                </div>
              )}

              {isMember && (
                <Link
                  to={`/dashboard/${community.id}/decisions/create`}
                  className="btn-warm mx-auto flex w-fit items-center gap-2 px-5 py-3 text-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  Submit a new proposal
                </Link>
              )}
            </div>
          )}

          {/* Gallery tab */}
          {activeTab === 'gallery' && (
            <CommunityGallery communityName={community.name} type={community.type} />
          )}

          {/* Wallet tab */}
          {activeTab === 'wallet' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="premium-glass rounded-xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold">Community treasury</h3>
                  <ReceiptText className="h-4 w-4" />
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span>Network</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: CHAINS[community.chain ?? 'solana'].badgeBg }}
                      />
                      {CHAINS[community.chain ?? 'solana'].label} · {NETWORK_LABEL}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span>Recorded balance</span>
                    <span className="font-display text-lg font-bold">{formatKSh(community.fundBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span>On-chain vault</span>
                    <span className="text-xs font-semibold">Pending program deploy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Withdrawals</span>
                    <span className="text-xs font-semibold capitalize">
                      {(community.treasuryPolicy ?? 'multisig-ready').replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/dashboard/${community.id}/treasury`}
                  className="btn-ghost mt-5 w-full justify-center gap-2 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open treasury detail
                </Link>
              </div>

              <div className="premium-glass rounded-xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold">Your Solana wallet</h3>
                  <WalletIcon className="h-4 w-4" />
                </div>

                {publicKey ? (
                  <div className="space-y-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] uppercase tracking-widest">Address</p>
                      <p className="mt-1 font-mono text-xs break-all">{publicKey.toBase58()}</p>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <span>SOL balance</span>
                      <span className="font-display text-lg font-bold tabular-nums">
                        {walletSol === null ? '—' : `${walletSol.toFixed(4)} SOL`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <span>Cluster</span>
                      <span className="text-xs font-semibold">Solana {NETWORK_LABEL}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Membership in this DAO</span>
                      <span className="text-xs font-semibold">
                        {isMember ? 'Active' : 'None'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <WalletIcon className="mx-auto mb-3 h-8 w-8" />
                    <p className="text-sm font-semibold">Wallet not connected</p>
                    <p className="mt-1 text-xs">
                      Connect Phantom, Solflare, or Coinbase Wallet to see your SOL balance and membership status.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

    </Layout>
  );
};

export default CommunityDashboard;
