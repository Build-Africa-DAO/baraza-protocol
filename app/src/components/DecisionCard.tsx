import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CircleMinus, Loader2, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import { formatRailAmountFromKes, daysRemaining, cn } from '@/lib/utils';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useCastVote, useVoteStatus } from '@/hooks/useBarazaData';
import type { ProposalLifecycleStage } from '@/lib/constants';
import { DEFAULT_GOVERNANCE } from '@/lib/constants';
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
  quorumPct?: number;
}

const DecisionCard: React.FC<DecisionCardProps> = ({
  id,
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
  quorumPct = DEFAULT_GOVERNANCE.quorumPct,
}) => {
  const { requireWallet, isReady, address } = useWalletGuard({ action: 'vote on decisions' });
  const { vote: submitVote } = useCastVote();
  const storedVote = useVoteStatus(id, address);

  // Optimistic vote state: counts derive from props (kept fresh by the store
  // subscription in the parent); pendingVote bridges the gap while the cast
  // is in flight, then clears so the store-backed props take over.
  const [pendingVote, setPendingVote] = useState<'for' | 'against' | 'abstain' | null>(null);
  const [localVote, setLocalVote] = useState<'for' | 'against' | 'abstain' | null>(null);
  const userVote = storedVote ?? localVote;
  const [isVoting, setIsVoting] = useState(false);
  const hasVotedRef = useRef(false);

  const votesFor = initialVotesFor + (pendingVote === 'for' ? 1 : 0);
  const votesAgainst = initialVotesAgainst + (pendingVote === 'against' ? 1 : 0);
  const totalVotes = votesFor + votesAgainst + (pendingVote === 'abstain' ? 1 : 0);
  const decidedVotes = votesFor + votesAgainst;
  const forPct = decidedVotes > 0 ? Math.round((votesFor / decidedVotes) * 100) : 0;
  const againstPct = decidedVotes > 0 ? 100 - forPct : 0;
  const participationPct = totalMembers > 0 ? Math.round((totalVotes / totalMembers) * 100) : 0;
  const requiredQuorumPct = quorumPct > 0 ? quorumPct : DEFAULT_GOVERNANCE.quorumPct;
  const quorumMet = participationPct >= requiredQuorumPct;

  const stage: ProposalLifecycleStage = lifecycleStage ?? inferStage(status);
  const stageMeta = STAGE_META[stage];
  const StageIcon = stageMeta.icon;
  const isActive = stageMeta.votable;
  const days = daysRemaining(endsAt);

  const handleVote = async (vote: 'for' | 'against' | 'abstain') => {
    if (!isActive || hasVotedRef.current || isVoting) return;

    await requireWallet(async () => {
      if (hasVotedRef.current || !address) return;
      hasVotedRef.current = true;
      setIsVoting(true);

      // Optimistic update
      setLocalVote(vote);
      setPendingVote(vote);

      try {
        const success = await submitVote(id, address, vote);
        if (!success) {
          // Rollback on failure
          setLocalVote(null);
          hasVotedRef.current = false;
        }
        // Success or failure, the store now holds the truth — drop the delta.
        setPendingVote(null);
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
          <span className="text-primary font-medium">Yes {forPct}%</span>
          <span className="text-destructive font-medium">No {againstPct}%</span>
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
          <span>{votesFor} yes</span>
          <span>{votesAgainst} no</span>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Quorum {requiredQuorumPct}%</span>
            <span className={quorumMet ? 'font-semibold text-primary' : undefined}>
              {participationPct}% voted{quorumMet ? ' — met' : ''}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={participationPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Quorum ${participationPct} of ${requiredQuorumPct} percent`}>
            <div
              className={cn('h-full rounded-full', quorumMet ? 'bg-primary' : 'bg-accent')}
              style={{ width: `${Math.min(100, participationPct)}%` }}
            />
          </div>
        </div>
      </div>

      {(stage === 'tied' || stage === 'tied_extended') && (
        <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium leading-5">
          {stage === 'tied_extended'
            ? 'Proposal tied — deliberation extended 48 hours.'
            : 'Proposal Tied (Deadlocked — Not Executed)'}
        </p>
      )}

      {/* Vote buttons */}
      {isActive && (
        <div className="flex gap-3">
          {(['for', 'against', 'abstain'] as const).map((side) => {
            const isThisSide = userVote === side;
            const isOtherSide = userVote !== null && userVote !== side;
            const label = side === 'for' ? 'Yes' : side === 'against' ? 'No' : 'Abstain';
            const Icon = side === 'for' ? ThumbsUp : side === 'against' ? ThumbsDown : CircleMinus;
            const solid = isThisSide || (userVote === null && side === 'for');

            return (
              <button
                key={side}
                onClick={() => handleVote(side)}
                disabled={!canVote || isVoting}
                className={cn(
                  'flex-1 gap-2 py-2.5 text-xs',
                  solid ? 'btn-wipe' : 'btn-wipe-outline',
                  isOtherSide && 'opacity-40',
                )}
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
