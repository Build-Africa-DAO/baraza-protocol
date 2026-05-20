/**
 * Baraza Data Store
 * 
 * Centralized reactive data layer that simulates on-chain data.
 * Uses an event emitter pattern so hooks can subscribe to real-time updates.
 * When a real Solana program is connected, replace the internals here —
 * the hook API stays the same.
 */

// ---------- Types ----------

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
  members: string[]; // wallet public keys
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
  status: 'active' | 'completed';
  createdAt: string;
  endsAt: string;
  voters: Record<string, 'for' | 'against'>; // walletKey -> vote
}

export interface Member {
  id: string;
  communityId: string;
  name: string;
  walletKey: string;
  joinedAt: number; // timestamp
  role: 'founder' | 'admin' | 'member';
  status: 'active' | 'inactive';
  totalContributed: number;
  contributionCount: number;
  lastContributionAt: number;
  contributions: Contribution[];
  votesCount: number;
  proposalsCount: number;
}

export interface Contribution {
  id: string;
  amount: number;
  type: 'membership' | 'monthly' | 'extra';
  timestamp: number;
  note: string;
}

export interface ActivityEvent {
  id: string;
  communityId: string;
  type: 'member_joined' | 'decision_created' | 'vote_cast' | 'decision_completed' | 'fund_deposit' | 'bounty_opened';
  message: string;
  timestamp: number;
}

type Listener = () => void;

// ---------- Seed member names with metadata ----------

const SEED_MEMBER_DATA: { name: string; role: 'founder' | 'admin' | 'member'; monthsActive: number }[] = [
  { name: 'Amani Kimathi', role: 'founder', monthsActive: 18 },
  { name: 'Wanjiku Muthoni', role: 'admin', monthsActive: 16 },
  { name: 'Ochieng Juma', role: 'admin', monthsActive: 15 },
  { name: 'Njeri Kariuki', role: 'member', monthsActive: 14 },
  { name: 'Kamau Deng', role: 'member', monthsActive: 13 },
  { name: 'Akinyi Wambui', role: 'member', monthsActive: 12 },
  { name: 'Otieno Rioba', role: 'member', monthsActive: 11 },
  { name: 'Fatuma Said', role: 'member', monthsActive: 10 },
  { name: 'Baraka Hassan', role: 'member', monthsActive: 9 },
  { name: 'Zawadi Lumumba', role: 'member', monthsActive: 8 },
  { name: 'Juma Pius', role: 'member', monthsActive: 7 },
  { name: 'Makena Nyambura', role: 'member', monthsActive: 6 },
  { name: 'Kipchoge Tanui', role: 'member', monthsActive: 5 },
  { name: 'Halima Abdi', role: 'member', monthsActive: 4 },
  { name: 'Mwangi Benson', role: 'member', monthsActive: 3 },
  { name: 'Zuri Odhiambo', role: 'member', monthsActive: 2 },
  { name: 'Nia Chebet', role: 'member', monthsActive: 2 },
  { name: 'Tendai Wafula', role: 'member', monthsActive: 1 },
];

function generateContributions(fee: number, monthsActive: number): Contribution[] {
  const contributions: Contribution[] = [];
  const now = Date.now();

  // Initial membership payment
  contributions.push({
    id: `c-${Math.random().toString(36).slice(2, 8)}`,
    amount: fee,
    type: 'membership',
    timestamp: now - monthsActive * 30 * 86400000,
    note: 'Membership fee',
  });

  // Monthly contributions
  for (let i = monthsActive - 1; i >= 0; i--) {
    contributions.push({
      id: `c-${Math.random().toString(36).slice(2, 8)}`,
      amount: fee,
      type: 'monthly',
      timestamp: now - i * 30 * 86400000 + Math.random() * 5 * 86400000,
      note: `Monthly contribution`,
    });
  }

  // Random extra contributions (20% chance per month)
  for (let i = 0; i < monthsActive; i++) {
    if (Math.random() < 0.2) {
      const extra = Math.round(fee * (0.5 + Math.random() * 1.5));
      contributions.push({
        id: `c-${Math.random().toString(36).slice(2, 8)}`,
        amount: extra,
        type: 'extra',
        timestamp: now - i * 30 * 86400000 + Math.random() * 15 * 86400000,
        note: 'Additional contribution',
      });
    }
  }

  return contributions.sort((a, b) => b.timestamp - a.timestamp);
}

function generateSeedMembers(communityId: string, fee: number, count: number): Member[] {
  const members: Member[] = [];
  const usedData = SEED_MEMBER_DATA.slice(0, Math.min(count, SEED_MEMBER_DATA.length));

  usedData.forEach((data, idx) => {
    const contributions = generateContributions(fee, data.monthsActive);
    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);
    const now = Date.now();

    members.push({
      id: `m-${communityId}-${idx}`,
      communityId,
      name: data.name,
      walletKey: `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
      joinedAt: now - data.monthsActive * 30 * 86400000,
      role: data.role,
      status: 'active',
      totalContributed,
      contributionCount: contributions.length,
      lastContributionAt: contributions[0]?.timestamp || now,
      contributions,
      votesCount: Math.floor(data.monthsActive * 1.5 + Math.random() * 5),
      proposalsCount: data.role === 'founder' ? 3 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3),
    });
  });

  return members;
}

// ---------- Initial Seed Data ----------

const SEED_COMMUNITIES: Community[] = [
  {
    id: '1',
    name: 'Kibera Youth Collective',
    type: 'savings',
    description: 'A savings group for young entrepreneurs in Kibera. We pool resources monthly and support each other\'s business ventures.',
    membershipFee: 500,
    memberCount: 47,
    fundBalance: 234500,
    activeDecisions: 2,
    createdAt: '2024-11-15',
    image: 'KY',
    members: [],
  },
  {
    id: '2',
    name: 'Mama Mboga Association',
    type: 'cooperative',
    description: 'Market vendors cooperative for bulk purchasing, shared transport, and collective bargaining.',
    membershipFee: 200,
    memberCount: 123,
    fundBalance: 567800,
    activeDecisions: 2,
    createdAt: '2024-08-22',
    image: 'MM',
    members: [],
  },
  {
    id: '3',
    name: 'TechBridge Nairobi',
    type: 'professional',
    description: 'Professional network for tech workers. Monthly meetups, skills sharing, and emergency support fund.',
    membershipFee: 1000,
    memberCount: 89,
    fundBalance: 890000,
    activeDecisions: 1,
    createdAt: '2024-06-10',
    image: 'TB',
    members: [],
  },
  {
    id: '4',
    name: 'Mwanzo Housing Sacco',
    type: 'housing',
    description: 'Community housing initiative. Members contribute towards land purchase and affordable housing construction.',
    membershipFee: 2000,
    memberCount: 34,
    fundBalance: 1450000,
    activeDecisions: 1,
    createdAt: '2024-09-01',
    image: 'MH',
    members: [],
  },
];

const SEED_DECISIONS: Decision[] = [
  {
    id: 'd1',
    communityId: '1',
    title: 'Purchase Shared Boda-Boda',
    description: 'Proposal to purchase 2 motorcycles for shared use by members who need transport for their businesses. Each member can book time slots.',
    fundingAmount: 85000,
    proposedBy: 'Amani K.',
    votesFor: 32,
    votesAgainst: 8,
    totalMembers: 47,
    status: 'active',
    createdAt: '2026-05-01',
    endsAt: '2026-06-15',
    voters: {},
  },
  {
    id: 'd2',
    communityId: '1',
    title: 'Emergency Fund for Members',
    description: 'Set aside KSh 50,000 from the community fund as an emergency medical fund that members can access interest-free.',
    fundingAmount: 50000,
    proposedBy: 'Wanjiku M.',
    votesFor: 41,
    votesAgainst: 3,
    totalMembers: 47,
    status: 'active',
    createdAt: '2026-04-28',
    endsAt: '2026-06-12',
    voters: {},
  },
  {
    id: 'd3',
    communityId: '1',
    title: 'Skill Training Workshop',
    description: 'Organize a 3-day financial literacy and digital skills workshop. Covers trainer fees, venue, and materials.',
    fundingAmount: 25000,
    proposedBy: 'Ochieng J.',
    votesFor: 38,
    votesAgainst: 2,
    totalMembers: 47,
    status: 'completed',
    createdAt: '2025-03-10',
    endsAt: '2025-03-24',
    voters: {},
  },
  {
    id: 'd4',
    communityId: '2',
    title: 'Bulk Purchase of Market Stalls',
    description: 'Buy 10 portable market stall canopies at wholesale price for members without permanent stalls.',
    fundingAmount: 120000,
    proposedBy: 'Akinyi W.',
    votesFor: 87,
    votesAgainst: 12,
    totalMembers: 123,
    status: 'active',
    createdAt: '2026-05-02',
    endsAt: '2026-06-16',
    voters: {},
  },
  {
    id: 'd5',
    communityId: '2',
    title: 'Shared Cold Storage Unit',
    description: 'Rent a cold storage unit near the market to reduce produce spoilage. Monthly rent split among all members.',
    fundingAmount: 45000,
    proposedBy: 'Njeri K.',
    votesFor: 95,
    votesAgainst: 18,
    totalMembers: 123,
    status: 'active',
    createdAt: '2026-04-20',
    endsAt: '2026-07-10',
    voters: {},
  },
  {
    id: 'd6',
    communityId: '3',
    title: 'Sponsor Bootcamp for Juniors',
    description: 'Fund 5 scholarships for junior developers to attend a 2-week coding bootcamp in Nairobi.',
    fundingAmount: 250000,
    proposedBy: 'Kamau D.',
    votesFor: 72,
    votesAgainst: 5,
    totalMembers: 89,
    status: 'active',
    createdAt: '2026-05-05',
    endsAt: '2026-06-18',
    voters: {},
  },
  {
    id: 'd7',
    communityId: '4',
    title: 'Land Survey for Plot 3',
    description: 'Commission an official land survey for the third community plot before construction begins.',
    fundingAmount: 75000,
    proposedBy: 'Otieno R.',
    votesFor: 28,
    votesAgainst: 4,
    totalMembers: 34,
    status: 'active',
    createdAt: '2026-05-03',
    endsAt: '2026-07-14',
    voters: {},
  },
];

// ---------- Simulated names for live events ----------

const SIMULATED_NAMES = [
  'Amani K.', 'Wanjiku M.', 'Ochieng J.', 'Njeri K.', 'Kamau D.',
  'Akinyi W.', 'Otieno R.', 'Fatuma S.', 'Baraka H.', 'Zawadi L.',
  'Juma P.', 'Makena N.', 'Kipchoge T.', 'Halima A.', 'Mwangi B.',
];

function randomName(): string {
  return SIMULATED_NAMES[Math.floor(Math.random() * SIMULATED_NAMES.length)];
}

// ---------- Store Class ----------

class BarazaDataStore {
  private communities: Map<string, Community> = new Map();
  private decisions: Map<string, Decision> = new Map();
  private activities: Map<string, ActivityEvent[]> = new Map(); // communityId -> events
  private memberRegistry: Map<string, Member[]> = new Map(); // communityId -> members
  private listeners: Set<Listener> = new Set();
  private nextCommunityId = 5;
  private nextDecisionId = 8;
  private nextMemberId = 100;
  private simulationTimers: ReturnType<typeof setInterval>[] = [];

  constructor() {
    // Seed
    SEED_COMMUNITIES.forEach((c) => this.communities.set(c.id, { ...c }));
    SEED_DECISIONS.forEach((d) => this.decisions.set(d.id, { ...d }));

    // Seed members for each community
    SEED_COMMUNITIES.forEach((c) => {
      const memberCount = Math.min(c.memberCount, SEED_MEMBER_DATA.length);
      const members = generateSeedMembers(c.id, c.membershipFee, memberCount);
      this.memberRegistry.set(c.id, members);
    });

    // Seed initial activities
    SEED_COMMUNITIES.forEach((c) => {
      this.activities.set(c.id, [
        {
          id: `init-${c.id}-1`,
          communityId: c.id,
          type: 'member_joined',
          message: `${randomName()} joined the community`,
          timestamp: Date.now() - 60000 * 30,
        },
        {
          id: `init-${c.id}-2`,
          communityId: c.id,
          type: 'fund_deposit',
          message: `Monthly contributions received from 12 members`,
          timestamp: Date.now() - 60000 * 120,
        },
        {
          id: `init-${c.id}-3`,
          communityId: c.id,
          type: 'bounty_opened',
          message: `Bounty board announcement posted for members and contributors`,
          timestamp: Date.now() - 60000 * 180,
        },
      ]);
    });

    // Start live simulation
    this.startSimulation();
  }

  // ---- Subscriptions ----

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // ---- Reads ----

  getAllCommunities(): Community[] {
    return Array.from(this.communities.values());
  }

  getCommunity(id: string): Community | undefined {
    return this.communities.get(id);
  }

  getDecisionsForCommunity(communityId: string): Decision[] {
    return Array.from(this.decisions.values()).filter((d) => d.communityId === communityId);
  }

  getDecision(id: string): Decision | undefined {
    return this.decisions.get(id);
  }

  getMembersForCommunity(communityId: string): Member[] {
    return this.memberRegistry.get(communityId) || [];
  }

  getMember(communityId: string, memberId: string): Member | undefined {
    const members = this.memberRegistry.get(communityId) || [];
    return members.find((m) => m.id === memberId);
  }

  getActivities(communityId: string): ActivityEvent[] {
    return (this.activities.get(communityId) || []).sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  }

  isMember(communityId: string, walletKey: string): boolean {
    const community = this.communities.get(communityId);
    return community ? community.members.includes(walletKey) : false;
  }

  hasVoted(decisionId: string, walletKey: string): 'for' | 'against' | null {
    const decision = this.decisions.get(decisionId);
    return decision?.voters[walletKey] || null;
  }

  // ---- Writes ----

  async createCommunity(data: {
    name: string;
    type: string;
    description: string;
    membershipFee: number;
    creatorWallet: string;
  }): Promise<Community> {
    // Simulate network delay
    await this.simulateDelay(1500);

    const id = String(this.nextCommunityId++);
    const initials = data.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    
    const community: Community = {
      id,
      name: data.name,
      type: data.type,
      description: data.description,
      membershipFee: data.membershipFee,
      memberCount: 1,
      fundBalance: data.membershipFee,
      activeDecisions: 0,
      createdAt: new Date().toISOString().split('T')[0],
      image: initials,
      members: [data.creatorWallet],
    };

    this.communities.set(id, community);
    this.activities.set(id, [{
      id: `act-create-${id}`,
      communityId: id,
      type: 'member_joined',
      message: 'Community created by founder',
      timestamp: Date.now(),
    }]);

    this.notify();
    return community;
  }

  async joinCommunity(communityId: string, walletKey: string): Promise<boolean> {
    await this.simulateDelay(1200);

    const community = this.communities.get(communityId);
    if (!community || community.members.includes(walletKey)) return false;

    community.members.push(walletKey);
    community.memberCount += 1;
    community.fundBalance += community.membershipFee;

    // Create member record with first contribution
    const memberName = SIMULATED_NAMES[Math.floor(Math.random() * SIMULATED_NAMES.length)];
    const contribution: Contribution = {
      id: `c-${Date.now()}`,
      amount: community.membershipFee,
      type: 'membership',
      timestamp: Date.now(),
      note: 'Membership fee',
    };
    const newMember: Member = {
      id: `m-${this.nextMemberId++}`,
      communityId,
      name: walletKey.length > 20 ? 'You' : memberName,
      walletKey,
      joinedAt: Date.now(),
      role: 'member',
      status: 'active',
      totalContributed: community.membershipFee,
      contributionCount: 1,
      lastContributionAt: Date.now(),
      contributions: [contribution],
      votesCount: 0,
      proposalsCount: 0,
    };
    const members = this.memberRegistry.get(communityId) || [];
    members.unshift(newMember);
    this.memberRegistry.set(communityId, members);

    this.addActivity(communityId, {
      type: 'member_joined',
      message: `New member joined (${walletKey.slice(0, 6)}...)`,
    });

    this.notify();
    return true;
  }

  async createDecision(data: {
    communityId: string;
    title: string;
    description: string;
    fundingAmount: number;
    proposedBy: string;
    durationDays: number;
  }): Promise<Decision> {
    await this.simulateDelay(1500);

    const community = this.communities.get(data.communityId);
    const id = `d${this.nextDecisionId++}`;
    const endsAt = new Date(Date.now() + data.durationDays * 86400000).toISOString().split('T')[0];

    const decision: Decision = {
      id,
      communityId: data.communityId,
      title: data.title,
      description: data.description,
      fundingAmount: data.fundingAmount,
      proposedBy: data.proposedBy,
      votesFor: 0,
      votesAgainst: 0,
      totalMembers: community?.memberCount || 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      endsAt,
      voters: {},
    };

    this.decisions.set(id, decision);

    if (community) {
      community.activeDecisions += 1;
    }

    this.addActivity(data.communityId, {
      type: 'decision_created',
      message: `New decision proposed: "${data.title}"`,
    });

    this.notify();
    return decision;
  }

  async castVote(decisionId: string, walletKey: string, vote: 'for' | 'against'): Promise<boolean> {
    await this.simulateDelay(800);

    const decision = this.decisions.get(decisionId);
    if (!decision || decision.voters[walletKey] || decision.status !== 'active') return false;

    decision.voters[walletKey] = vote;
    if (vote === 'for') {
      decision.votesFor += 1;
    } else {
      decision.votesAgainst += 1;
    }

    this.addActivity(decision.communityId, {
      type: 'vote_cast',
      message: `A member ${vote === 'for' ? 'supported' : 'objected to'} "${decision.title}"`,
    });

    this.notify();
    return true;
  }

  // ---- Activity helpers ----

  private addActivity(communityId: string, data: { type: ActivityEvent['type']; message: string }) {
    const events = this.activities.get(communityId) || [];
    events.unshift({
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      communityId,
      type: data.type,
      message: data.message,
      timestamp: Date.now(),
    });
    this.activities.set(communityId, events.slice(0, 50));
  }

  // ---- Simulation ----

  private startSimulation() {
    // Simulate new members joining every 8-15s
    const memberTimer = setInterval(() => {
      const communities = this.getAllCommunities();
      if (communities.length === 0) return;
      const community = communities[Math.floor(Math.random() * communities.length)];
      
      community.memberCount += 1;
      community.fundBalance += community.membershipFee;

      // Add simulated member to registry
      const simName = randomName();
      const simContrib: Contribution = {
        id: `c-sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        amount: community.membershipFee,
        type: 'membership',
        timestamp: Date.now(),
        note: 'Membership fee',
      };
      const simMember: Member = {
        id: `m-sim-${this.nextMemberId++}`,
        communityId: community.id,
        name: simName,
        walletKey: `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
        joinedAt: Date.now(),
        role: 'member',
        status: 'active',
        totalContributed: community.membershipFee,
        contributionCount: 1,
        lastContributionAt: Date.now(),
        contributions: [simContrib],
        votesCount: 0,
        proposalsCount: 0,
      };
      const existingMembers = this.memberRegistry.get(community.id) || [];
      existingMembers.unshift(simMember);
      this.memberRegistry.set(community.id, existingMembers);

      this.addActivity(community.id, {
        type: 'member_joined',
        message: `${simName} joined the community`,
      });

      this.notify();
    }, 8000 + Math.random() * 7000);

    // Simulate votes on active decisions every 5-10s
    const voteTimer = setInterval(() => {
      const activeDecisions = Array.from(this.decisions.values()).filter((d) => d.status === 'active');
      if (activeDecisions.length === 0) return;

      const decision = activeDecisions[Math.floor(Math.random() * activeDecisions.length)];
      const isFor = Math.random() > 0.25; // 75% support rate

      if (isFor) {
        decision.votesFor += 1;
      } else {
        decision.votesAgainst += 1;
      }

      this.addActivity(decision.communityId, {
        type: 'vote_cast',
        message: `${randomName()} ${isFor ? 'supported' : 'objected to'} "${decision.title}"`,
      });

      this.notify();
    }, 5000 + Math.random() * 5000);

    // Simulate fund deposits every 20-30s
    const fundTimer = setInterval(() => {
      const communities = this.getAllCommunities();
      if (communities.length === 0) return;
      const community = communities[Math.floor(Math.random() * communities.length)];
      
      const deposit = community.membershipFee * (Math.floor(Math.random() * 5) + 1);
      community.fundBalance += deposit;

      // Add contribution to a random existing member
      const communityMembers = this.memberRegistry.get(community.id) || [];
      if (communityMembers.length > 0) {
        const randomMember = communityMembers[Math.floor(Math.random() * communityMembers.length)];
        const contrib: Contribution = {
          id: `c-dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          amount: deposit,
          type: 'monthly',
          timestamp: Date.now(),
          note: 'Monthly contribution',
        };
        randomMember.contributions.unshift(contrib);
        randomMember.totalContributed += deposit;
        randomMember.contributionCount += 1;
        randomMember.lastContributionAt = Date.now();
      }

      this.addActivity(community.id, {
        type: 'fund_deposit',
        message: `Monthly contributions received (KSh ${deposit.toLocaleString('en-KE')})`,
      });

      this.notify();
    }, 20000 + Math.random() * 10000);

    this.simulationTimers.push(memberTimer, voteTimer, fundTimer);
  }

  stopSimulation() {
    this.simulationTimers.forEach(clearInterval);
    this.simulationTimers = [];
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton
export const dataStore = new BarazaDataStore();
