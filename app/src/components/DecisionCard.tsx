import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CircleMinus, Loader2, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import { formatRailAmountFromKes, daysRemaining } from '@/lib/utils';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useBarazaContract } from '@/hooks/useBarazaContract';
import type { ProposalLifecycleStage } from '@/lib/constants';
import { STAGE_META, inferStage } from '@/lib/proposalStatus';
import { CHAINS, type ChainMeta } from '@/lib/chain';

interface DecisionCardProps {
  id: string;
  communityId: string;
  title: string;
  description: string;
  fundingAmount: number;
  proposedBy: string;
  votesFor: number;
  votesAgainst: number;
  totalMembers: number;
  status: string;
  lifecycleStage?: ProposalLifecycleStage;
  createdAt: string;
  endsAt: string;
  chainMeta?: ChainMeta;
}

const DecisionCard: React.FC<DecisionCardProps> = ({
  id,
  communityId,
  title,
  description,
  fundingAmount,
  proposedBy,
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  totalMembers,
  status,
  lifecycleStage,
  endsAt,
  chainMeta = CHAINS.solana,
}) => {
  const { requireWallet, isReady } = useWalletGuard({ action: 'vote on decisions' });
  const { castVote } = useBarazaContract();

  // Optimistic vote state
  const [votesFor, setVotesFor] = useState(initialVotesFor);
  const [votesAgainst, setVotesAgainst] = useState(initialVotesAgainst);
  const [userVote, setUserVote] = useState<'for' | 'against' | 'abstain' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const hasVotedRef = useRef(false);

  const totalVotes = votesFor + votesAgainst;
  const forPct = totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0;
  const againstPct = totalVotes > 0 ? 100 - forPct : 0;
  const participationPct = Math.round((totalVotes / totalMembers) * 100);

  const stage: ProposalLifecycleStage = lifecycleStage ?? inferStage(status);
  const stageMeta = STAGE_META[stage];
  const StageIcon = stageMeta.icon;
  const isActive = stageMeta.votable;
  const days = daysRemaining(endsAt);

  const handleVote = async (vote: 'for' | 'against' | 'abstain') => {
    if (!isActive || hasVotedRef.current || isVoting) return;

    await requireWallet(async () => {
      if (hasVotedRef.current) return;
      hasVotedRef.current = true;
      setIsVoting(true);

      // Optimistic update
      setUserVote(vote);
      if (vote === 'for') setVotesFor((v) => v + 1);
      else if (vote === 'against') setVotesAgainst((v) => v + 1);

      try {
        const success = await castVote(id, communityId, vote === 'for' ? 'yes' : vote === 'against' ? 'no' : 'abstain');
        if (!success) {
          // Rollback on failure
          setUserVote(null);
          if (vote === 'for') setVotesFor((v) => v - 1);
          else if (vote === 'against') setVotesAgainst((v) => v - 1);
          hasVotedRef.current = false;
        }
      } finally {
        setIsVoting(false);
      }
    });
  };

  const canVote = isReady && isActive && !userVote && !isVoting;

  return (
    <div className="baraza-card p-5">
      {/* Lifecycle stage pill + funding amount */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${stageMeta.className}`}
            aria-label={`Stage: ${stageMeta.label}`}
          >
            <StageIcon className="w-3 h-3" />
            {stageMeta.label}
          </span>
          {isActive && (
            <span className="text-[10px] text-muted-foreground">
              {days} day{days !== 1 ? 's' : ''} left
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-accent">{formatRailAmountFromKes(fundingAmount, chainMeta)}</span>
      </div>

      {/* Title & Description */}
      <h3 className="font-display text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{description}</p>

      {/* Proposed by */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">
          Proposed by{' '}
          <span className="text-foreground font-medium">{proposedBy}</span>
        </span>
      </div>

      {/* Vote progress bars */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-primary font-medium">Support {forPct}%</span>
          <span className="text-destructive font-medium">Object {againstPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${forPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-l-full"
            style={{ background: 'var(--gradient-primary)' }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${againstPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-destructive rounded-r-full"
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{votesFor} support</span>
          <span>{participationPct}% voted</span>
          <span>{votesAgainst} object</span>
        </div>
      </div>

      {/* Vote buttons */}
      {isActive && (
        <div className="flex gap-3">
          {(['for', 'against', 'abstain'] as const).map((side) => {
            const isThisSide = userVote === side;
            const isOtherSide = userVote !== null && userVote !== side;
            const label = side === 'for' ? 'Support' : side === 'against' ? 'Object' : 'Abstain';
            const Icon = side === 'for' ? ThumbsUp : side === 'against' ? ThumbsDown : CircleMinus;
            const activeClass =
              side === 'for'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : side === 'against'
                  ? 'bg-destructive/20 text-destructive border border-destructive/30'
                  : 'bg-accent/20 text-accent border border-accent/30';
            const idleClass =
              side === 'for'
                ? 'bg-primary/10 text-primary hover:bg-primary/20 border border-transparent hover:border-primary/30'
                : side === 'against'
                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-transparent hover:border-destructive/30'
                  : 'bg-accent/10 text-accent hover:bg-accent/20 border border-transparent hover:border-accent/30';

            return (
              <button
                key={side}
                onClick={() => handleVote(side)}
                disabled={!canVote || isVoting}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  isThisSide ? activeClass : isOtherSide ? 'opacity-40 ' + idleClass : idleClass
                }`}
              >
                {isVoting && isThisSide ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DecisionCard;
