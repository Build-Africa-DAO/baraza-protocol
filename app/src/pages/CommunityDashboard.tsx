import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, Vote, History, PlusCircle, CreditCard,
  ArrowLeft, Calendar, Loader2, ShieldCheck, ReceiptText,
  LayoutDashboard, Wallet as WalletIcon, ExternalLink, Activity,
} from 'lucide-react';
import Layout from '@/components/Layout';
import DecisionCard from '@/components/DecisionCard';
import { MOCK_DECISIONS } from '@/lib/constants';
import { formatKSh, truncateAddress } from '@/lib/utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useBarazaContract } from '@/hooks/useBarazaContract';
import { useCommunity } from '@/hooks/useCommunities';
import {
  getActiveMembership,
  listMembershipsForCommunity,
  recordActiveMembership,
} from '@/lib/memberships';
import CommunityBanner from '@/components/CommunityBanner';
import { CHAINS } from '@/lib/chain';
import { NETWORK_LABEL } from '@/lib/network';

type DashboardTab = 'overview' | 'members' | 'governance' | 'wallet';

const dashboardGlobeUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAhAO65kkwr6zxxrtYjpZm23ugp7boCWsRE_kTE7O3PUPmonOS4vJUPPGp_AALnUHlCa23XX7HVjJ3lfv_cs2mIWSzHwYBQIvrue4TcJGeHUsuQLKSNOuhSpHNySzZ8pUcK9MLmMfeh0l2ciNsph8EcgoHMr86aCmoQZLn2qesMSBGPMStXx9CHE1aW6vpRO1bQ13KDvFm92lVbqFLdD6qie_U66bf4EIKpbK6LxxS-9a0Q4YK3m0GuJPePOTqqPhC9tTuWGu4UnIo";

const CommunityDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { requireWallet } = useWalletGuard({ action: 'join this community' });
  const { joinCommunity, isPending } = useBarazaContract();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [walletSol, setWalletSol] = useState<number | null>(null);

  const { community, isLoading, error } = useCommunity(id);

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

  const communityMembers = useMemo(
    () => (community ? listMembershipsForCommunity(community.id) : []),
    [community],
  );

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
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="baraza-card h-48 max-w-3xl mx-auto animate-pulse" />
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
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              Community not found
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
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

  const handleJoin = async () => {
    await requireWallet(async () => {
      // Pass KSh through verbatim — the on-chain program (or a backend helper using
      // a live SOL price feed) is responsible for the KSh→lamports conversion.
      // The previous `membershipFee * 1000` placeholder would have charged ~0 SOL.
      const success = await joinCommunity(community.id, community.membershipFee);
      if (success) {
        if (publicKey) recordActiveMembership(community.id, publicKey.toBase58());
        setIsMember(true);
        setShowJoinModal(false);
      }
    });
  };

  const stats = [
    {
      icon: TrendingUp,
      label: 'DAO Treasury',
      value: formatKSh(community.fundBalance),
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      icon: Users,
      label: 'Members',
      value: community.memberCount.toString(),
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Vote,
      label: 'Active Proposals',
      value: activeDecisions.length.toString(),
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      icon: History,
      label: 'Past Proposals',
      value: pastDecisions.length.toString(),
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
    },
  ];

  return (
    <Layout>
      <section className="relative overflow-hidden py-8 md:py-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-[center_right] opacity-20 mix-blend-screen"
            style={{ backgroundImage: `url(${dashboardGlobeUrl})` }}
          />
          <div className="absolute inset-0 ambient-globe-layer opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80" />
        </div>
        <div className="container relative z-10 mx-auto px-4">
          {/* Back */}
          <Link
            to="/communities"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Communities
          </Link>

          {/* Community header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <CommunityBanner type={community.type} className="p-5 md:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/15 shadow-[0_0_28px_hsl(var(--primary)/0.18)]">
                <span className="font-display text-lg font-bold text-primary">{community.image}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Community DAO workspace
                </div>
                <h1 className="mb-2 font-display text-2xl font-bold text-foreground md:text-4xl">
                  {community.name}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{community.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium capitalize text-primary">
                    {community.type} DAO
                  </span>
                  <span
                    aria-label={`Network: ${CHAINS[community.chain ?? 'solana'].label}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/45 px-2.5 py-1 font-medium text-foreground"
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
                  <span className="font-medium text-accent">
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
                  <span className="inline-flex items-center gap-2 rounded-lg border border-confirmed/25 bg-confirmed/12 px-3 py-2 text-sm font-semibold text-confirmed">
                    <ShieldCheck className="h-4 w-4" />
                    Active member
                  </span>
                )}
                <div className="rounded-lg border border-primary/12 bg-background/45 px-3 py-2 text-xs text-muted-foreground">
                  Membership activates after on-chain confirmation, not just payment.
                </div>
              </div>
            </div>
            </CommunityBanner>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="premium-glass group relative overflow-hidden rounded-xl p-4">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-colors group-hover:bg-primary/10" />
                <div className="relative mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="relative font-display text-xl font-bold text-foreground md:text-2xl">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-border/50 pb-px">
            {([
              { key: 'overview', label: 'Overview', icon: LayoutDashboard },
              { key: 'members', label: 'Members', icon: Users },
              { key: 'governance', label: 'Governance', icon: Vote },
              { key: 'wallet', label: 'Wallet', icon: WalletIcon },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
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
                      <h3 className="font-display text-lg font-semibold text-foreground">DAO activity overview</h3>
                      <p className="text-xs text-muted-foreground">Contributions, proposals, and votes at a glance.</p>
                    </div>
                    <span className="hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
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
                      <div key={label} className="rounded-lg border border-primary/10 bg-background/35 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                        <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="premium-glass rounded-xl p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-foreground">Your role</h3>
                    {isMember ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-confirmed/30 bg-confirmed/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-confirmed">
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
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Role</span>
                        <span className="font-semibold text-foreground">Member</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Voting power</span>
                        <span className="font-semibold text-foreground">1 vote</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly dues</span>
                        <span className="font-semibold text-accent">{formatKSh(community.membershipFee)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
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
                  <h3 className="font-display text-base font-semibold text-foreground">Governance rules</h3>
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ['Quorum', `${community.quorumPct ?? 51}%`],
                    ['Approval', `${community.approvalThresholdPct ?? 66}%`],
                    ['Voting period', `${community.votingPeriodDays ?? 7} days`],
                    ['Treasury', (community.treasuryPolicy ?? 'multisig-ready').replace('-', ' ')],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                      <p className="mt-1 font-semibold capitalize text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Members tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Members ({communityMembers.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Showing locally-tracked members. Full on-chain <code className="font-mono text-foreground">MemberAccount</code> PDAs surface after the membership program deploys.
                  </p>
                </div>
              </div>

              {communityMembers.length > 0 ? (
                <div className="space-y-2">
                  {communityMembers.map((m, idx) => {
                    const isYou = !!publicKey && m.walletAddress === publicKey.toBase58();
                    return (
                      <div
                        key={`${m.walletAddress}-${idx}`}
                        className="flex items-center gap-4 rounded-lg border border-border bg-background/45 p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-display text-sm font-bold text-primary">
                          {m.walletAddress.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-mono text-sm text-foreground">
                              {truncateAddress(m.walletAddress, 6)}
                            </p>
                            {isYou && (
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                                You
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="capitalize">Role: Member</span>
                            <span>Joined {new Date(m.joinedAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-confirmed/30 bg-confirmed/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-confirmed">
                          <ShieldCheck className="h-3 w-3" />
                          {m.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="baraza-card p-10 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">No members tracked locally yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reported member count: {community.memberCount}. Member roster loads from on-chain <code className="font-mono text-foreground">MemberAccount</code> PDAs once the membership program is deployed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Governance tab */}
          {activeTab === 'governance' && (
            <div className="space-y-8">
              {activeDecisions.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-4">Active Proposals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDecisions.map((d, idx) => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <DecisionCard {...d} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {pastDecisions.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-semibold text-muted-foreground mb-4">Past Proposals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastDecisions.map((d, idx) => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <DecisionCard {...d} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {decisions.length === 0 && (
                <div className="baraza-card p-10 text-center">
                  <Vote className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No governance proposals yet. Be the first to submit one!</p>
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

          {/* Wallet tab */}
          {activeTab === 'wallet' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="premium-glass rounded-xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-foreground">Community treasury</h3>
                  <ReceiptText className="h-4 w-4 text-primary" />
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-muted-foreground">Network</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: CHAINS[community.chain ?? 'solana'].badgeBg }}
                      />
                      {CHAINS[community.chain ?? 'solana'].label} · {NETWORK_LABEL}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-muted-foreground">Recorded balance</span>
                    <span className="font-display text-lg font-bold text-accent">{formatKSh(community.fundBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-muted-foreground">On-chain vault</span>
                    <span className="text-xs font-semibold text-muted-foreground">Pending program deploy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Withdrawals</span>
                    <span className="text-xs font-semibold text-muted-foreground capitalize">
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
                  <h3 className="font-display text-base font-semibold text-foreground">Your Solana wallet</h3>
                  <WalletIcon className="h-4 w-4 text-primary" />
                </div>

                {publicKey ? (
                  <div className="space-y-3 text-sm">
                    <div className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Address</p>
                      <p className="mt-1 font-mono text-xs text-foreground break-all">{publicKey.toBase58()}</p>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <span className="text-muted-foreground">SOL balance</span>
                      <span className="font-display text-lg font-bold text-foreground tabular-nums">
                        {walletSol === null ? '—' : `${walletSol.toFixed(4)} SOL`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <span className="text-muted-foreground">Cluster</span>
                      <span className="text-xs font-semibold text-foreground">Solana {NETWORK_LABEL}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Membership in this DAO</span>
                      <span className={isMember ? 'text-xs font-semibold text-confirmed' : 'text-xs font-semibold text-muted-foreground'}>
                        {isMember ? 'Active' : 'None'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-background/30 p-6 text-center">
                    <WalletIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Wallet not connected</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Connect Phantom, Solflare, or Coinbase Wallet to see your SOL balance and membership status.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Join modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowJoinModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative baraza-card p-6 max-w-sm w-full"
          >
            <h3 className="font-display text-lg font-bold text-foreground mb-2">
              Join with wallet — {community.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Pay membership dues directly from your Solana wallet. Prefer M-Pesa? Use phone-first join instead.
            </p>

            <div className="baraza-card p-4 mb-6 bg-surface">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Membership Fee</span>
                <span className="text-sm font-bold text-accent">{formatKSh(community.membershipFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Billing</span>
                <span className="text-xs text-foreground">Monthly</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 btn-ghost text-sm"
              >
                Cancel
              </button>
              <Link
                to={`/join/${community.id}`}
                className="flex-1 btn-ghost text-sm justify-center"
              >
                M-Pesa Join
              </Link>
              <button
                onClick={handleJoin}
                disabled={isPending}
                className="flex-1 btn-warm text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatKSh(community.membershipFee)}`
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default CommunityDashboard;
