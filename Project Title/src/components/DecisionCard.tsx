import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle2, User } from 'lucide-react';
import { formatKSh } from '@/lib/constants';
import { useWallet } from '@solana/wallet-adapter-react';

interface DecisionCardProps {
  id: string;
  title: string;
  description: string;
  fundingAmount: number;
  proposedBy: string;
  votesFor: number;
  votesAgainst: number;
  totalMembers: number;
  status: string;
  createdAt: string;
  endsAt: string;
}

const DecisionCard: React.FC<DecisionCardProps> = ({
  title,
  description,
  fundingAmount,
  proposedBy,
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  totalMembers,
  status,
  endsAt,
}) => {
  const { connected } = useWallet();
  const [votesFor, setVotesFor] = useState(initialVotesFor);
  const [votesAgainst, setVotesAgainst] = useState(initialVotesAgainst);
  const [userVote, setUserVote] = useState<'for' | 'against' | null>(null);

  const totalVotes = votesFor + votesAgainst;
  const forPercentage = totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0;
  const againstPercentage = totalVotes > 0 ? 100 - forPercentage : 0;
  const participationRate = Math.round((totalVotes / totalMembers) * 100);

  const isActive = status === 'active';
  const daysLeft = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleVote = (vote: 'for' | 'against') => {
    if (!connected || userVote || !isActive) return;
    
    setUserVote(vote);
    if (vote === 'for') {
      setVotesFor((v) => v + 1);
    } else {
      setVotesAgainst((v) => v + 1);
    }
  };

  return (
    <div className="baraza-card p-5">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
          isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          {isActive ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {isActive ? `${daysLeft} days left` : 'Completed'}
        </div>
        <span className="text-xs font-semibold text-accent">{formatKSh(fundingAmount)}</span>
      </div>

      {/* Title & Description */}
      <h3 className="font-display text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{description}</p>

      {/* Proposed by */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">Proposed by <span className="text-foreground font-medium">{proposedBy}</span></span>
      </div>

      {/* Vote progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-primary font-medium">Support {forPercentage}%</span>
          <span className="text-destructive font-medium">Object {againstPercentage}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${forPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-l-full"
            style={{ background: 'var(--gradient-primary)' }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${againstPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-destructive rounded-r-full"
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{votesFor} support</span>
          <span>{participationRate}% voted</span>
          <span>{votesAgainst} object</span>
        </div>
      </div>

      {/* Vote buttons */}
      {isActive && (
        <div className="flex gap-3">
          <button
            onClick={() => handleVote('for')}
            disabled={!connected || !!userVote}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              userVote === 'for'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : userVote
                ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                : 'bg-primary/10 text-primary hover:bg-primary/20 border border-transparent hover:border-primary/30'
            } ${!connected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsUp className="w-4 h-4" />
            Support
          </button>
          <button
            onClick={() => handleVote('against')}
            disabled={!connected || !!userVote}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              userVote === 'against'
                ? 'bg-destructive/20 text-destructive border border-destructive/30'
                : userVote
                ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                : 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-transparent hover:border-destructive/30'
            } ${!connected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsDown className="w-4 h-4" />
            Object
          </button>
        </div>
      )}

      {!connected && isActive && (
        <p className="text-[10px] text-center text-muted-foreground mt-2">Sign in to vote on this decision</p>
      )}
    </div>
  );
};

export default DecisionCard;
