export type BountyStatus = 'open' | 'in_review' | 'awarded';

export interface Bounty {
  id: string;
  communityId: string;
  title: string;
  category: string;
  rewardKes: number;
  deadline: string;
  submissions: number;
  status: BountyStatus;
  postedBy: string;
  summary: string;
  skills: string[];
  externalUrl: string;
}

export const DEWORK_BOUNTY_URL = 'https://dework.xyz/';

const BOUNTIES: Bounty[] = [
  {
    id: 'b-ky-brand',
    communityId: '1',
    title: 'Youth business poster kit',
    category: 'Design',
    rewardKes: 26000,
    deadline: '2026-06-08',
    submissions: 4,
    status: 'open',
    postedBy: 'Kibera Youth Collective',
    summary: 'Create reusable poster and WhatsApp story templates for member businesses.',
    skills: ['Canva', 'Branding', 'Social media'],
    externalUrl: DEWORK_BOUNTY_URL,
  },
  {
    id: 'b-ky-training',
    communityId: '1',
    title: 'Financial literacy facilitator',
    category: 'Events',
    rewardKes: 42000,
    deadline: '2026-06-14',
    submissions: 2,
    status: 'open',
    postedBy: 'Kibera Youth Collective',
    summary: 'Run a Saturday workshop on savings, pricing, and mobile-money records.',
    skills: ['Training', 'Events', 'Finance'],
    externalUrl: DEWORK_BOUNTY_URL,
  },
  {
    id: 'b-mm-supplier',
    communityId: '2',
    title: 'Supplier price tracker',
    category: 'Operations',
    rewardKes: 18000,
    deadline: '2026-06-05',
    submissions: 6,
    status: 'in_review',
    postedBy: 'Mama Mboga Association',
    summary: 'Collect weekly market prices and publish a simple member buying guide.',
    skills: ['Research', 'Sheets', 'Procurement'],
    externalUrl: DEWORK_BOUNTY_URL,
  },
  {
    id: 'b-mm-photo',
    communityId: '2',
    title: 'Vendor product photo day',
    category: 'Events',
    rewardKes: 30000,
    deadline: '2026-06-17',
    submissions: 1,
    status: 'open',
    postedBy: 'Mama Mboga Association',
    summary: 'Photograph 25 vendor stalls for online catalogues and delivery menus.',
    skills: ['Photography', 'Events', 'Content'],
    externalUrl: DEWORK_BOUNTY_URL,
  },
  {
    id: 'b-tb-audit',
    communityId: '3',
    title: 'Smart contract audit notes',
    category: 'Dev',
    rewardKes: 64500,
    deadline: '2026-06-10',
    submissions: 3,
    status: 'open',
    postedBy: 'TechBridge Nairobi',
    summary: 'Review governance contract assumptions and produce issue-ranked audit notes.',
    skills: ['Solana', 'Rust', 'Security'],
    externalUrl: DEWORK_BOUNTY_URL,
  },
  {
    id: 'b-tb-mentor',
    communityId: '3',
    title: 'Junior dev mentorship night',
    category: 'Events',
    rewardKes: 22000,
    deadline: '2026-06-12',
    submissions: 5,
    status: 'awarded',
    postedBy: 'TechBridge Nairobi',
    summary: 'Host a practical pair-programming session for junior DAO members.',
    skills: ['Mentoring', 'React', 'Community'],
    externalUrl: DEWORK_BOUNTY_URL,
  },
  {
    id: 'b-mh-site',
    communityId: '4',
    title: 'Site visit photo report',
    category: 'Field work',
    rewardKes: 38000,
    deadline: '2026-06-09',
    submissions: 2,
    status: 'open',
    postedBy: 'Mwanzo Housing Sacco',
    summary: 'Document Plot 3 access roads, utilities, and boundary markers for members.',
    skills: ['Photography', 'Reporting', 'Mapping'],
    externalUrl: DEWORK_BOUNTY_URL,
  },
  {
    id: 'b-mh-legal',
    communityId: '4',
    title: 'Land title checklist',
    category: 'Research',
    rewardKes: 55000,
    deadline: '2026-06-21',
    submissions: 0,
    status: 'open',
    postedBy: 'Mwanzo Housing Sacco',
    summary: 'Prepare a member-readable title due-diligence checklist before purchase votes.',
    skills: ['Legal ops', 'Research', 'Real estate'],
    externalUrl: DEWORK_BOUNTY_URL,
  },
];

export function listBounties(): Bounty[] {
  return BOUNTIES;
}

export function getBountiesForCommunity(communityId: string): Bounty[] {
  return BOUNTIES.filter((bounty) => bounty.communityId === communityId);
}

export function getOpenBountiesForCommunity(communityId: string): Bounty[] {
  return getBountiesForCommunity(communityId).filter((bounty) => bounty.status === 'open');
}

export function getBountyStatsForCommunity(communityId: string) {
  const bounties = getBountiesForCommunity(communityId);
  const open = bounties.filter((bounty) => bounty.status === 'open');
  const totalRewardKes = open.reduce((sum, bounty) => sum + bounty.rewardKes, 0);
  return {
    total: bounties.length,
    open: open.length,
    inReview: bounties.filter((bounty) => bounty.status === 'in_review').length,
    awarded: bounties.filter((bounty) => bounty.status === 'awarded').length,
    totalRewardKes,
    featured: open[0] ?? bounties[0] ?? null,
  };
}
