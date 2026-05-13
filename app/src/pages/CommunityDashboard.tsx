import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, Vote, History, PlusCircle, CreditCard,
  ArrowLeft, Calendar, Loader2, ShieldCheck, ReceiptText
} from 'lucide-react';
import Layout from '@/components/Layout';
import DecisionCard from '@/components/DecisionCard';
import MembershipCard from '@/components/MembershipCard';
import { MOCK_DECISIONS } from '@/lib/constants';
import { formatKSh } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useBarazaContract } from '@/hooks/useBarazaContract';
import { useCommunity } from '@/hooks/useCommunities';
import { getActiveMembership, recordActiveMembership } from '@/lib/memberships';

const dashboardGlobeUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAhAO65kkwr6zxxrtYjpZm23ugp7boCWsRE_kTE7O3PUPmonOS4vJUPPGp_AALnUHlCa23XX7HVjJ3lfv_cs2mIWSzHwYBQIvrue4TcJGeHUsuQLKSNOuhSpHNySzZ8pUcK9MLmMfeh0l2ciNsph8EcgoHMr86aCmoQZLn2qesMSBGPMStXx9CHE1aW6vpRO1bQ13KDvFm92lVbqFLdD6qie_U66bf4EIKpbK6LxxS-9a0Q4YK3m0GuJPePOTqqPhC9tTuWGu4UnIo";

const CommunityDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const { requireWallet } = useWalletGuard({ action: 'join this community' });
  const { joinCommunity, isPending } = useBarazaContract();
  const [activeTab, setActiveTab] = useState<'decisions' | 'membership'>('decisions');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const { community, isLoading, error } = useCommunity(id);

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
            className="premium-glass relative mb-8 overflow-hidden rounded-xl p-5 md:p-6"
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
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
            {[
              { key: 'decisions', label: 'Governance Proposals', icon: Vote },
              { key: 'membership', label: 'My Membership', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
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
            <Link
              to={`/dashboard/${community.id}/treasury`}
              className="flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
            >
              <ReceiptText className="h-4 w-4" />
              DAO Treasury
            </Link>
            <div className="flex-1" />
            {isMember && activeTab === 'decisions' && (
              <Link
                to={`/dashboard/${community.id}/decisions/create`}
                className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Proposal
              </Link>
            )}
          </div>

          {/* Content */}
          {activeTab === 'decisions' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_21rem]">
                <div className="premium-glass rounded-xl p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">DAO activity overview</h3>
                      <p className="text-xs text-muted-foreground">Contributions, proposals, and votes at a glance.</p>
                    </div>
                    <span className="hidden rounded-full border border-confirmed/25 bg-confirmed/10 px-3 py-1 text-xs font-semibold text-confirmed sm:inline-flex">
                      Live data
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
                    <h3 className="font-display text-base font-semibold text-foreground">Action Required</h3>
                    <Vote className="h-4 w-4 text-accent" />
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-accent/20 bg-accent/8 p-4">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-accent">Voting live</p>
                      <p className="text-sm font-semibold text-foreground">Review open governance proposals.</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Quorum, approval threshold, and vote receipts are visible before signing.
                      </p>
                    </div>
                    {!isMember && (
                      <Link to={`/join/${community.id}`} className="btn-warm w-full justify-center text-sm">
                        Join DAO to vote
                      </Link>
                    )}
                  </div>
                </div>
              </div>

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
            </div>
          )}

          {activeTab === 'membership' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto py-8"
            >
              {isMember ? (
                <div className="space-y-6">
                  <MembershipCard
                    communityName={community.name}
                    memberName="Community Member"
                    memberId={publicKey ? publicKey.toBase58().slice(0, 8) : 'BRZ-0001'}
                    joinDate={new Date().toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                    communityType={community.type}
                  />
                </div>
              ) : (
                <div className="premium-glass rounded-xl p-8 text-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-base font-semibold text-foreground mb-2">
                    Not a member yet
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Join this community to get your membership card and start participating in decisions.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link to={`/join/${community.id}`} className="btn-warm justify-center text-sm">
                      Join with M-Pesa
                    </Link>
                    <button onClick={() => setShowJoinModal(true)} className="btn-ghost justify-center text-sm">
                      Join with wallet
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
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
