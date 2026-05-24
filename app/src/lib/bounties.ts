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
}

export interface BountySubmission {
  id: string;
  bountyId: string;
  contributor: string;
  workUrl: string;
  note: string;
  submittedAt: string;
}

export interface CreateBountyInput {
  communityId: string;
  postedBy: string;
  title: string;
  category: string;
  rewardKes: number;
  deadline: string;
  summary: string;
  skills: string[];
}

const LOCAL_BOUNTIES_KEY = 'baraza.bounties.v1';
const LOCAL_SUBMISSIONS_KEY = 'baraza.bountySubmissions.v1';

const SEED_BOUNTIES: Bounty[] = [
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
  },
];

function readLocalBounties(): Bounty[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_BOUNTIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalBounties(bounties: Bounty[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_BOUNTIES_KEY, JSON.stringify(bounties));
}

function readSubmissions(): BountySubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSubmissions(submissions: BountySubmission[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

function splitSkills(raw: string[]): string[] {
  return raw.map((skill) => skill.trim()).filter(Boolean).slice(0, 6);
}

export function listBounties(): Bounty[] {
  const submissions = readSubmissions();
  return [...SEED_BOUNTIES, ...readLocalBounties()]
    .map((bounty) => ({
      ...bounty,
      submissions: bounty.submissions + submissions.filter((submission) => submission.bountyId === bounty.id).length,
    }))
    .sort((a, b) => {
      const statusRank = Number(b.status === 'open') - Number(a.status === 'open');
      if (statusRank !== 0) return statusRank;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
}

export function getBountiesForCommunity(communityId: string): Bounty[] {
  return listBounties().filter((bounty) => bounty.communityId === communityId);
}

export function getOpenBountiesForCommunity(communityId: string): Bounty[] {
  return getBountiesForCommunity(communityId).filter((bounty) => bounty.status === 'open');
}

export function createBountyRecord(input: CreateBountyInput): Bounty {
  if (!input.communityId) throw new Error('Choose a community.');
  if (!input.title.trim()) throw new Error('Bounty title is required.');
  if (!input.summary.trim()) throw new Error('Bounty summary is required.');
  if (!Number.isFinite(input.rewardKes) || input.rewardKes <= 0) throw new Error('Reward must be greater than zero.');
  if (!input.deadline) throw new Error('Deadline is required.');

  const bounty: Bounty = {
    id: `b-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    communityId: input.communityId,
    title: input.title.trim(),
    category: input.category.trim() || 'General',
    rewardKes: input.rewardKes,
    deadline: input.deadline,
    submissions: 0,
    status: 'open',
    postedBy: input.postedBy,
    summary: input.summary.trim(),
    skills: splitSkills(input.skills),
  };

  writeLocalBounties([bounty, ...readLocalBounties()]);
  return bounty;
}

export function submitBountyWork(input: {
  bountyId: string;
  contributor: string;
  workUrl: string;
  note: string;
}): BountySubmission {
  if (!input.bountyId) throw new Error('Choose a bounty.');
  if (!input.contributor.trim()) throw new Error('Contributor name is required.');
  if (!input.workUrl.trim()) throw new Error('Work URL is required.');

  const submission: BountySubmission = {
    id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    bountyId: input.bountyId,
    contributor: input.contributor.trim(),
    workUrl: input.workUrl.trim(),
    note: input.note.trim(),
    submittedAt: new Date().toISOString(),
  };

  writeSubmissions([submission, ...readSubmissions()]);
  return submission;
}

export function listBountySubmissions(bountyId: string): BountySubmission[] {
  return readSubmissions()
    .filter((submission) => submission.bountyId === bountyId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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
