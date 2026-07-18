import { Navigate, Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useCommunities, useAllDecisions } from '@/hooks/useBarazaData';
import { useMembershipAccess } from '@/hooks/useMembershipAccess';
import { listBounties } from '@/lib/bounties';
import { useSeo } from '@/lib/seo';

const entrance = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function EntryExperience() {
  useSeo({
    title: 'Communities deciding and building together',
    description: 'Find a community, follow shared decisions, and contribute to work that matters.',
    path: '/',
  });
  const communities = useCommunities();
  const decisions = useAllDecisions();
  const { communityIds, identified } = useMembershipAccess();
  const reduceMotion = useReducedMotion();
  const firstCommunityId = communityIds[0];

  if (firstCommunityId) {
    const dashboardPath = `/dashboard/${firstCommunityId}`;
    const lastInterface = typeof window !== 'undefined' ? window.localStorage.getItem('baraza.interface.last') : null;
    return <Navigate to={lastInterface === 'chat' ? `/akili?from=${encodeURIComponent(dashboardPath)}` : dashboardPath} replace />;
  }
  if (identified) return <Navigate to="/communities" replace />;

  const openDecisions = decisions.filter((decision) => decision.status === 'active').slice(0, 2);
  const openTasks = listBounties().filter((task) => task.status === 'open').slice(0, 1);
  const featuredCommunity = communities[0];
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' as const };

  return (
    <Layout>
      <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden border-b border-border/60 bg-[#18130b] text-white">
        <img
          src="/media/community-meeting-hero.webp"
          alt="Community members gathered around a table discussing a shared plan"
          className="absolute inset-0 h-full w-full object-cover object-center"
          width="1792"
          height="1024"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,11,7,0.98)_0%,rgba(13,11,7,0.88)_34%,rgba(13,11,7,0.2)_70%,rgba(13,11,7,0.08)_100%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col justify-between px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={entrance} transition={transition} className="max-w-xl pt-6 sm:pt-12">
            <div className="mb-6 flex items-center gap-3 text-sm text-white/75">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Users className="h-4 w-4" /></span>
              Built around the way communities already work
            </div>
            <h1 className="max-w-[12ch] text-balance font-display text-5xl font-black leading-[0.96] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              Where your group decides together.
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-white/78 sm:text-lg sm:leading-8">
              Find your community, understand open decisions, contribute useful work, and keep every member informed.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/akili?from=%2Fcommunities" onClick={() => window.localStorage.setItem('baraza.interface.last', 'chat')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                <MessageCircle className="h-4 w-4" /> Ask Akili
              </Link>
              <Link to="/communities" onClick={() => window.localStorage.setItem('baraza.interface.last', 'platform')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 bg-black/15 px-5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/10">
                Explore communities <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 max-w-md rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-md">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">A</span>
                <p className="text-sm leading-6 text-white/82"><strong className="text-white">Akili:</strong> Habari. Tell me what kind of group or decision you're looking for, and I'll take you to the right place.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={entrance} transition={{ ...transition, delay: reduceMotion ? 0 : 0.12 }} className="mt-16 grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 md:grid-cols-3">
            <Link to={featuredCommunity ? `/dashboard/${featuredCommunity.id}` : '/communities'} className="bg-black/55 p-5 backdrop-blur-md transition-colors hover:bg-black/68">
              <p className="text-xs font-semibold text-primary">Community gathering</p>
              <h2 className="mt-2 text-base font-bold">{featuredCommunity?.name ?? 'Find your community'}</h2>
              <p className="mt-1 text-sm text-white/65">{featuredCommunity ? `${featuredCommunity.memberCount} members coordinating together` : 'Browse active groups'}</p>
            </Link>
            <Link to={openDecisions[0] ? `/dashboard/${openDecisions[0].communityId}/decisions/${openDecisions[0].id}` : '/communities'} className="bg-black/55 p-5 backdrop-blur-md transition-colors hover:bg-black/68">
              <p className="text-xs font-semibold text-primary">Open decision</p>
              <h2 className="mt-2 text-base font-bold">{openDecisions[0]?.title ?? 'See what members are deciding'}</h2>
              <p className="mt-1 text-sm text-white/65">Read the reason, discussion, and current participation</p>
            </Link>
            <Link to={openTasks[0] ? `/bounties/${openTasks[0].id}` : '/bounties'} className="bg-black/55 p-5 backdrop-blur-md transition-colors hover:bg-black/68">
              <p className="text-xs font-semibold text-primary">Community work</p>
              <h2 className="mt-2 text-base font-bold">{openTasks[0]?.title ?? 'Contribute useful work'}</h2>
              <p className="mt-1 text-sm text-white/65">{openTasks[0] ? `KES ${openTasks[0].rewardKes.toLocaleString()} - open brief` : 'See available tasks'}</p>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
