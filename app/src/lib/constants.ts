// ─── Types ────────────────────────────────────────────────────────────────────

export interface Community {
  id: string;
  name: string;
  type: string;
  description: string;
  membershipFee: number;
  memberCount: number;
  fundBalance: number;
  activeDecisions: number;
  createdAt: string;
  image: string;
}

export interface Decision {
  id: string;
  communityId: string;
  title: string;
  description: string;
  fundingAmount: number;
  proposedBy: string;
  votesFor: number;
  votesAgainst: number;
  totalMembers: number;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  endsAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_COMMUNITIES: Community[] = [
  {
    id: '1',
    name: 'Kibera Youth Collective',
    type: 'savings',
    description:
      "A savings group for young entrepreneurs in Kibera. We pool resources monthly and support each other's business ventures.",
    membershipFee: 500,
    memberCount: 47,
    fundBalance: 234500,
    activeDecisions: 3,
    createdAt: '2024-11-15',
    image: 'KY',
  },
  {
    id: '2',
    name: 'Mama Mboga Association',
    type: 'cooperative',
    description:
      'Market vendors cooperative for bulk purchasing, shared transport, and collective bargaining.',
    membershipFee: 200,
    memberCount: 123,
    fundBalance: 567800,
    activeDecisions: 5,
    createdAt: '2024-08-22',
    image: 'MM',
  },
  {
    id: '3',
    name: 'TechBridge Nairobi',
    type: 'professional',
    description:
      'Professional network for tech workers. Monthly meetups, skills sharing, and emergency support fund.',
    membershipFee: 1000,
    memberCount: 89,
    fundBalance: 890000,
    activeDecisions: 2,
    createdAt: '2024-06-10',
    image: 'TB',
  },
  {
    id: '4',
    name: 'Mwanzo Housing Sacco',
    type: 'housing',
    description:
      'Community housing initiative. Members contribute towards land purchase and affordable housing construction.',
    membershipFee: 2000,
    memberCount: 34,
    fundBalance: 1450000,
    activeDecisions: 1,
    createdAt: '2024-09-01',
    image: 'MH',
  },
];

export const MOCK_DECISIONS: Decision[] = [
  {
    id: '1',
    communityId: '1',
    title: 'Purchase Shared Boda-Boda',
    description:
      'Proposal to purchase 2 motorcycles for shared use by members who need transport for their businesses. Each member can book time slots.',
    fundingAmount: 85000,
    proposedBy: 'Amani K.',
    votesFor: 32,
    votesAgainst: 8,
    totalMembers: 47,
    status: 'active',
    createdAt: '2025-05-01',
    endsAt: '2026-08-15',
  },
  {
    id: '2',
    communityId: '1',
    title: 'Emergency Fund for Members',
    description:
      'Set aside KSh 50,000 from the community fund as an emergency medical fund that members can access interest-free.',
    fundingAmount: 50000,
    proposedBy: 'Wanjiku M.',
    votesFor: 41,
    votesAgainst: 3,
    totalMembers: 47,
    status: 'active',
    createdAt: '2025-04-28',
    endsAt: '2026-08-12',
  },
  {
    id: '3',
    communityId: '1',
    title: 'Skill Training Workshop',
    description:
      'Organize a 3-day financial literacy and digital skills workshop. Covers trainer