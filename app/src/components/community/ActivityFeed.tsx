import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Vote, ThumbsUp, CheckCircle2, PiggyBank } from 'lucide-react';
import { useActivities } from '@/hooks/useBarazaData';
import type { ActivityEvent } from '@/lib/dataStore';

const iconMap: Record<ActivityEvent['type'], { icon: React.ElementType; color: string; bg: string }> = {
  member_joined: { icon: UserPlus, color: 'text-primary', bg: 'bg-primary/15' },
  decision_created: { icon: Vote, color: 'text-accent', bg: 'bg-accent/15' },
  vote_cast: { icon: ThumbsUp, color: 'text-secondary', bg: 'bg-secondary/15' },
  decision_completed: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/15' },
  fund_deposit: { icon: PiggyBank, color: 'text-accent', bg: 'bg-accent/15' },
};

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface ActivityFeedProps {
  communityId: string;
  limit?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ communityId, limit = 10 }) => {
  const activities = useActivities(communityId);
  const shown = activities.slice(0, limit);

  if (shown.length === 0) {
    return (
      <div className="baraza-card p-6 text-center">
        <p className="text-xs text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <AnimatePresence initial={false}>
        {shown.map((event) => {
          const { icon: Icon, color, bg } = iconMap[event.type] || iconMap.member_joined;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface/50 transition-colors">
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{event.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(event.timestamp)}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ActivityFeed;
