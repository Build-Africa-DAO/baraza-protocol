import { BadgeCheck, Crown, Lock, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleDef {
  id: string;
  name: string;
  icon: React.ElementType;
  badgeClass: string;
  permissions: string[];
}

const ROLE_DEFS: RoleDef[] = [
  {
    id: 'admin',
    name: 'Admin',
    icon: Crown,
    badgeClass: 'border-secondary/50 bg-secondary/10 text-secondary',
    permissions: [
      'Post & close bounties',
      'Approve/reject submissions',
      'Manage membership',
      'Edit community settings',
      'Release treasury funds',
      'All member permissions',
    ],
  },
  {
    id: 'moderator',
    name: 'Moderator',
    icon: Shield,
    badgeClass: 'border-primary/50 bg-primary/10 text-primary',
    permissions: [
      'Review work submissions',
      'Flag & remove content',
      'Pin announcements',
      'All member permissions',
    ],
  },
  {
    id: 'member',
    name: 'Member',
    icon: BadgeCheck,
    badgeClass: 'border-confirmed/50 bg-confirmed/10 text-confirmed',
    permissions: [
      'Vote on governance proposals',
      'Submit bounty work',
      'Access member-gated tasks',
      'Post & upvote suggestions',
      'Receive payouts',
    ],
  },
  {
    id: 'guest',
    name: 'Guest',
    icon: User,
    badgeClass: 'border-border/60 bg-surface/60 text-muted-foreground',
    permissions: [
      'Browse public proposals',
      'View bounty board',
      'Read announcements',
    ],
  },
];

interface Props {
  memberCount: number;
  adminName?: string;
}

export default function CommunityRoles({ memberCount, adminName: _adminName }: Props) {
  // Derive counts: 1 admin, 0 moderators (seed), rest are members
  const counts: Record<string, number> = {
    admin: 1,
    moderator: 0,
    member: Math.max(0, memberCount - 1),
    guest: 0,
  };

  return (
    <div className="space-y-4">
      <div className="baraza-card p-5">
        <h3 className="font-display text-base font-semibold mb-1">Role definitions</h3>
        <p className="text-xs text-muted-foreground mb-5">
          Permissions granted at each access level. Role assignment is tied to the membership record.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {ROLE_DEFS.map((role) => {
            const Icon = role.icon;
            const count = counts[role.id];
            return (
              <div
                key={role.id}
                className="rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
                    role.badgeClass,
                  )}>
                    <Icon className="h-3 w-3" />
                    {role.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {count} {count === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {role.permissions.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-border flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="baraza-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display text-base font-semibold">Role-gated access</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          {[
            ['Treasury actions', 'Admin only', 'border-secondary/30 text-secondary'],
            ['Bounty approval', 'Admin / Mod', 'border-primary/30 text-primary'],
            ['Work submission', 'Member +', 'border-confirmed/30 text-confirmed'],
          ].map(([feature, level, cls]) => (
            <div key={feature} className={cn('rounded-lg border p-3', cls)}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{feature}</p>
              <p className="mt-1 font-semibold">{level}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Role assignment uses membership credentials. Custom roles and weighted voting are planned for a later release.
        </p>
      </div>
    </div>
  );
}
