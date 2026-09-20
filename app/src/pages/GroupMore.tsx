import { useSearchParams } from 'react-router-dom';
import {
  Activity as ActivityIcon,
  BriefcaseBusiness,
  Crown,
  Layers,
  Lightbulb,
  MapIcon,
  Trophy,
} from 'lucide-react';
import type { ElementType } from 'react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { useProposals } from '@/hooks/useProposals';
import ActivityFeed from '@/components/community/ActivityFeed';
import CommunityRoles from '@/components/community/CommunityRoles';
import CommunitySuggestions from '@/components/community/CommunitySuggestions';
import CommunityLeaderboard from '@/components/community/CommunityLeaderboard';
import CommunityRoadmap from '@/components/community/CommunityRoadmap';
import CombinedBoard from '@/components/community/CombinedBoard';
import BountyBoard from '@/components/BountyBoard';
import { MORE_TABS, isMoreTab, type MoreTab } from '@/lib/legacyRoutes';
import { cn } from '@/lib/utils';

const TAB_META: Record<MoreTab, { label: string; icon: ElementType }> = {
  activity: { label: 'Activity', icon: ActivityIcon },
  roles: { label: 'Roles', icon: Crown },
  suggestions: { label: 'Suggestions', icon: Lightbulb },
  leaderboard: { label: 'Leaderboards', icon: Trophy },
  roadmap: { label: 'Roadmap', icon: MapIcon },
  combined: { label: 'Board', icon: Layers },
  bounties: { label: 'Bounties', icon: BriefcaseBusiness },
};

/**
 * Everything that used to sit in the thirteen-tab sidebar but is not part of the
 * four things members actually do. §12 says keep the surfaces, take them out of
 * the way — so old `?tab=` deep links land here instead of 404ing.
 */
export default function GroupMore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const active: MoreTab = isMoreTab(requested) ? requested : 'activity';

  return (
    <GroupWorkspace title="More" subtitle="Secondary tools for this group." hideBanner>
      {({ community }) => (
        <MorePanel community={community} active={active} onSelect={(tab) => setSearchParams({ tab }, { replace: true })} />
      )}
    </GroupWorkspace>
  );
}

function MorePanel({
  community,
  active,
  onSelect,
}: {
  community: { id: string; name: string; type: string; memberCount: number };
  active: MoreTab;
  onSelect: (tab: MoreTab) => void;
}) {
  const { all: decisions } = useProposals(community.id);

  return (
        <div className="space-y-5">
          <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="More sections">
            {MORE_TABS.map((tab) => {
              const meta = TAB_META[tab];
              const Icon = meta.icon;
              const isActive = active === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelect(tab)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </button>
              );
            })}
          </div>

          {active === 'activity' && <ActivityFeed communityId={community.id} limit={30} />}
          {active === 'roles' && <CommunityRoles memberCount={community.memberCount} />}
          {active === 'suggestions' && <CommunitySuggestions communityId={community.id} />}
          {active === 'leaderboard' && <CommunityLeaderboard communityId={community.id} />}
          {active === 'roadmap' && <CommunityRoadmap communityId={community.id} />}
          {active === 'combined' && <CombinedBoard communityId={community.id} decisions={decisions} />}
          {active === 'bounties' && <BountyBoard communityId={community.id} communityName={community.name} />}
        </div>
  );
}
