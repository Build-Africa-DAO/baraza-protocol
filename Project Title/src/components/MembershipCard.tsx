import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, Users } from 'lucide-react';

interface MembershipCardProps {
  communityName: string;
  memberName: string;
  memberId: string;
  joinDate: string;
  communityType: string;
}

const MembershipCard: React.FC<MembershipCardProps> = ({
  communityName,
  memberName,
  memberId,
  joinDate,
  communityType,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, rotateY: -5 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'var(--gradient-primary)' }}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-2 border-foreground/20" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full border-2 border-foreground/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border border-foreground/10" />
        </div>

        <div className="relative z-10 p-6">
          {/* Top section */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-md bg-background/20 flex items-center justify-center">
                  <span className="font-display text-[10px] font-bold text-foreground">B</span>
                </div>
                <span className="font-display text-xs font-bold text-primary-foreground/90">Baraza</span>
              </div>
              <p className="text-[10px] text-primary-foreground/60 uppercase tracking-widest mt-2">Membership Card</p>
            </div>
            <Shield className="w-8 h-8 text-primary-foreground/30" />
          </div>

          {/* Member info */}
          <div className="mb-6">
            <h3 className="font-display text-xl font-bold text-primary-foreground mb-1">
              {memberName}
            </h3>
            <p className="text-sm text-primary-foreground/70">{communityName}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[9px] text-primary-foreground/50 uppercase tracking-wider mb-0.5">Member ID</p>
              <p className="text-xs font-semibold text-primary-foreground/90 font-mono">{memberId}</p>
            </div>
            <div>
              <p className="text-[9px] text-primary-foreground/50 uppercase tracking-wider mb-0.5">Since</p>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary-foreground/60" />
                <p className="text-xs font-semibold text-primary-foreground/90">{joinDate}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-primary-foreground/50 uppercase tracking-wider mb-0.5">Type</p>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-primary-foreground/60" />
                <p className="text-xs font-semibold text-primary-foreground/90 capitalize">{communityType}</p>
              </div>
            </div>
          </div>

          {/* Bottom pattern line */}
          <div className="mt-6 pt-4 border-t border-primary-foreground/10 flex items-center justify-between">
            <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-1 h-3 rounded-full bg-primary-foreground/20" />
              ))}
            </div>
            <span className="text-[9px] text-primary-foreground/40 font-mono">VERIFIED</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MembershipCard;
