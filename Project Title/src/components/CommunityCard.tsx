import React from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, MessageSquare } from 'lucide-react';
import { formatKSh } from '@/lib/constants';

interface CommunityCardProps {
  id: string;
  name: string;
  type: string;
  description: string;
  membershipFee: number;
  memberCount: number;
  fundBalance: number;
  activeDecisions: number;
  image: string;
}

const typeColors: Record<string, string> = {
  savings: 'bg-primary/15 text-primary',
  cooperative: 'bg-accent/15 text-accent',
  professional: 'bg-secondary/15 text-secondary-foreground',
  housing: 'bg-destructive/15 text-destructive',
  welfare: 'bg-primary/15 text-primary',
  investment: 'bg-accent/15 text-accent',
  other: 'bg-muted text-muted-foreground',
};

const CommunityCard: React.FC<CommunityCardProps> = ({
  id,
  name,
  type,
  description,
  membershipFee,
  memberCount,
  fundBalance,
  activeDecisions,
  image,
}) => {
  return (
    <Link to={`/dashboard/${id}`} className="block">
      <div className="baraza-card p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-sm font-bold text-primary">{image}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-semibold text-foreground truncate">{name}</h3>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${typeColors[type] || typeColors.other}`}>
              {type}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-1">
          {description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
          <div className="flex flex-col items-center text-center">
            <Users className="w-3.5 h-3.5 text-primary mb-1" />
            <span className="text-xs font-semibold text-foreground">{memberCount}</span>
            <span className="text-[10px] text-muted-foreground">Members</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <TrendingUp className="w-3.5 h-3.5 text-accent mb-1" />
            <span className="text-xs font-semibold text-foreground">{formatKSh(fundBalance)}</span>
            <span className="text-[10px] text-muted-foreground">Fund</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <MessageSquare className="w-3.5 h-3.5 text-secondary mb-1" />
            <span className="text-xs font-semibold text-foreground">{activeDecisions}</span>
            <span className="text-[10px] text-muted-foreground">Decisions</span>
          </div>
        </div>

        {/* Fee */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Membership</span>
          <span className="text-xs font-semibold text-accent">{formatKSh(membershipFee)}/month</span>
        </div>
      </div>
    </Link>
  );
};

export default CommunityCard;
