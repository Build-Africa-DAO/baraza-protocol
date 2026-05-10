import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, Vote, History, PlusCircle, CreditCard,
  ArrowLeft, Calendar, Loader2
} from 'lucide-react';
import Layout from '@/components/Layout';
import DecisionCard from '@/components/DecisionCard';
import MembershipCard from '@/components/MembershipCard';
import { MOCK_COMMUNITIES, MOCK_DECISIONS } from '@/lib/constants';
import { formatKSh } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useBarazaContract } from '@/hooks/useBarazaContract';

const CommunityDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const { requireWallet, isReady } = useWalletGuard({ action: 'join this community' });
  const { joinCommunity, isPending } = useBarazaContract();
  const [activeTab, setActiveTab] = useState<'decisions' | 'membership'>('decisions');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const community = MOCK_COMMUNITIES.find((c) => c.id === id) || MOCK_COMMUNITIES[0];
  const decisions = MOCK_DECISIONS.filter((d) => d.communityId === community.id);
  const activeDecisions = decisions.filter((d) => d.status === 'active');
  const pastDecisions = decisions.filter((d) => d.status === 'completed');

  const handleJoin = async () => {
    await requireWallet(async () => {
      const feeLamports = community.membershipFee * 1000; // KSh to lamports approximation
      const success = await joinCommunity(community.id, feeLamports);
      if (success) {
        setIsMember(true);
        setShowJoinModal(false);
      }
    });
  };

  const stats = [
    {
      icon: TrendingUp,
      label: 'Community Fund',
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
      label: 'Active Decisions',
      value: activeDecisions.length.toString(),
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      icon: History,
      label: 'Past Decisions',
      value: pastDecisions.length.toString(),
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
    },
  ];

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
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
            className="flex flex-col sm:flex-row items-start gap-4 mb-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-lg font-bold text-primary">{community.image}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">
                {community.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-3">{community.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                  {community.type}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Since {new Date(community.createdAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                </span>
                <span className="font-medium text-accent">
                  {formatKSh(community.membershipFee)}/month
                </span>
              </div>
            </div>
            {isReady && !isMember && (
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-warm text-sm flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Join Group
              </button>
            )}
          </motion.div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="baraza-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="font-display text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-border/50 pb-px">
            {[
              { key: 'decisions', label: 'Decisions', icon: Vote },
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
            <div className="flex-1" />
            {isMember && activeTab === 'decisions' && (
              <Link
                to={`/create-decision/${community.id}`}
                className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Decision
              </Link>
            )}
          </div>

          {/* Content */}
          {activeTab === 'decisions' && (
            <div className="space-y-8">
              {activeDecisions.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-4">Active Decisions</h3>
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
                  <h3 className="font-display text-sm font-semibold text-muted-foreground mb-4">Past Decisions</h3>
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
                  <p className="text-sm text-muted-foreground">No decisions yet. Be the first to propose one!</p>
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
                  <div className="baraza-card p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Your membership is active. You can vote on decisions and propose new ones.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="baraza-card p-8 text-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-base font-semibold text-foreground mb-2">
                    Not a member yet
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Join this community to get your membership card and start participating in decisions.
                  </p>
                  {isReady ? (
                    <button onClick={() => setShowJoinModal(true)} className="btn-warm text-sm">
                      Join for {formatKSh(community.membershipFee)}/month
                    </button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Connect your wallet to join this community</p>
                  )}
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
              Join {community.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Pay the membership fee to join and start participating in community decisions.
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
              <button
                onClick={handleJoin}
                disabled={isPending}
                className="flex-1 btn-warm text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
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
