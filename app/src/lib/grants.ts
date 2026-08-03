export type GrantStatus = 'open' | 'closing_soon' | 'closed' | 'upcoming';
export type GrantType = 'protocol' | 'external' | 'ecosystem';
export type GrantCategory = 'governance' | 'community' | 'education' | 'infrastructure' | 'finance';

export interface Grant {
  id: string;
  title: string;
  funder: string;
  type: GrantType;
  category: GrantCategory;
  amountLabel: string;
  currency: string;
  deadline: string;
  status: GrantStatus;
  summary: string;
  eligibility: string[];
  tags: string[];
  applyUrl?: string;
  requiresEligibilityCheck?: boolean;
}

const SEED_GRANTS: Grant[] = [
  {
    id: 'baraza-umbrella-grant-q3-2026',
    title: 'Baraza Umbrella Community Grant',
    funder: 'Baraza Protocol',
    type: 'protocol',
    category: 'governance',
    amountLabel: 'Up to KSh 250,000',
    currency: 'KES',
    deadline: '2026-09-30',
    status: 'open',
    summary:
      'Quarterly protocol grant distributed to eligible Baraza communities that meet membership, governance, and treasury activity thresholds. Funded from the BRZA grants allocation pool.',
    eligibility: [
      '25+ active members',
      '50+ votes cast across proposals',
      '20+ treasury transactions',
      'TVL ≥ KSh 50,000',
      '3+ passed proposals',
      '30+ days active on-chain',
    ],
    tags: ['BRZA', 'protocol', 'quarterly', 'treasury'],
    requiresEligibilityCheck: true,
  },
  {
    id: 'stellar-community-fund-2026',
    title: 'Stellar Community Fund — Africa Round',
    funder: 'Stellar Development Foundation',
    type: 'ecosystem',
    category: 'infrastructure',
    amountLabel: 'USD 5,000 – 50,000',
    currency: 'USD',
    deadline: '2026-10-15',
    status: 'open',
    summary:
      'Funding for teams building on Stellar in Africa. Prioritises savings circles, cooperative treasury infrastructure, M-Pesa integrations, and community tooling that drives real-world XLM adoption.',
    eligibility: [
      'Building on Stellar mainnet or testnet',
      'African founding team or primary user base',
      'Working product or detailed prototype',
      'Open-source or community-benefit focus',
    ],
    tags: ['Stellar', 'XLM', 'Africa', 'infrastructure', 'open-source'],
    applyUrl: 'https://stellar.org/foundation/grants',
  },
  {
    id: 'gitcoin-africa-dao-round-2026',
    title: 'Gitcoin Grants — Africa DAO Round',
    funder: 'Gitcoin',
    type: 'external',
    category: 'community',
    amountLabel: 'Quadratic matching pool',
    currency: 'USD',
    deadline: '2026-09-01',
    status: 'closing_soon',
    summary:
      'Quadratic funding round for African DAOs, chamas, SACCOs, and cooperatives building on-chain governance and treasury tools. Matching from the Africa Web3 Fund. Community donations unlock additional matching.',
    eligibility: [
      'Registered Gitcoin passport (score ≥ 20)',
      'African-led or African-focused project',
      'Public good or community benefit',
      'At least one prior governance vote or treasury action',
    ],
    tags: ['Gitcoin', 'quadratic', 'matching', 'Africa', 'DAO'],
    applyUrl: 'https://grants.gitcoin.co',
  },
  {
    id: 'web3-foundation-community-2026',
    title: 'Web3 Foundation Community Grants',
    funder: 'Web3 Foundation',
    type: 'external',
    category: 'education',
    amountLabel: 'USD 10,000 – 100,000',
    currency: 'USD',
    deadline: '2026-11-30',
    status: 'open',
    summary:
      'Open grants for projects advancing decentralised web adoption in emerging markets. Covers education, on-chain governance tooling, SACCO digitalisation, cooperative finance, and cross-chain interoperability.',
    eligibility: [
      'Verifiable team with delivery track record',
      'Decentralised or open-source deliverable',
      'Milestone-based payment terms accepted',
      'Focus on financial inclusion or public goods',
    ],
    tags: ['Web3', 'education', 'financial inclusion', 'open-source'],
    applyUrl: 'https://grants.web3.foundation',
  },
  {
    id: 'afdb-digital-finance-2026',
    title: 'AfDB Digital Finance Innovation Grant',
    funder: 'African Development Bank',
    type: 'external',
    category: 'finance',
    amountLabel: 'USD 25,000 – 200,000',
    currency: 'USD',
    deadline: '2026-12-15',
    status: 'upcoming',
    summary:
      'Non-dilutive grant for African fintech and cooperative finance innovators. Focus areas: SACCO digitalisation, mobile treasury management, remittance cost reduction, and member-owned financial infrastructure.',
    eligibility: [
      'Registered legal entity in an AfDB member country',
      'Demonstrated community or cooperative focus',
      'Financial sustainability plan',
      'Impact metrics aligned with African Union financial inclusion targets',
    ],
    tags: ['AfDB', 'fintech', 'SACCO', 'cooperative', 'non-dilutive'],
    applyUrl: 'https://www.afdb.org/en/topics-and-sectors/sectors/finance',
  },
  {
    id: 'celo-climate-collective-2026',
    title: 'Celo Climate Collective — Community DAOs',
    funder: 'Celo Foundation',
    type: 'ecosystem',
    category: 'community',
    amountLabel: 'cUSD 5,000 – 30,000',
    currency: 'cUSD',
    deadline: '2026-10-01',
    status: 'open',
    summary:
      'Grants for community DAOs using Celo to fund climate action, green cooperative projects, and sustainable savings programmes in Africa and Latin America. Preference for projects with measurable carbon or social impact.',
    eligibility: [
      'Active community DAO with on-chain treasury',
      'Climate or sustainability mission',
      'Celo mobile wallet or GoodDollar integration',
      '10+ verified community members',
    ],
    tags: ['Celo', 'climate', 'cUSD', 'GoodDollar', 'impact'],
    applyUrl: 'https://celo.org/build',
  },
  {
    id: 'baraza-retro-grant-q3-2026',
    title: 'Baraza Retro Allocation Bonus',
    funder: 'Baraza Protocol',
    type: 'protocol',
    category: 'governance',
    amountLabel: 'BRZA token distribution',
    currency: 'BRZA',
    deadline: '2026-09-30',
    status: 'open',
    summary:
      'Extra BRZA token allocation for communities that complete a retro round with at least 60% member participation this quarter. Rewards active governance and peer-to-peer contribution recognition.',
    eligibility: [
      'Completed retro round with ≥ 60% member participation',
      'At least 5 retro nominations cast',
      'Community treasury not paused',
      'Active Baraza community on any supported chain',
    ],
    tags: ['BRZA', 'retro', 'protocol', 'governance', 'participation'],
    requiresEligibilityCheck: true,
  },
  {
    id: 'ict-authority-kenya-2026',
    title: 'ICT Authority Kenya — Digital Cooperative Grant',
    funder: 'ICT Authority Kenya',
    type: 'external',
    category: 'infrastructure',
    amountLabel: 'KSh 500,000 – 2,000,000',
    currency: 'KES',
    deadline: '2026-08-31',
    status: 'closing_soon',
    summary:
      'Kenyan government grant for registered SACCOs and cooperatives digitalising member management, contributions, and governance. Must demonstrate active membership records and compliance with Cooperative Societies Act.',
    eligibility: [
      'Registered SACCO or cooperative (Kenya Cooperative Alliance or SASRA)',
      'Minimum 50 active members',
      'Functional digital records system or roadmap',
      'Letter of support from county cooperative officer',
    ],
    tags: ['Kenya', 'SACCO', 'cooperative', 'government', 'KES'],
    applyUrl: 'https://www.ict.go.ke',
  },
];

export function listGrants(): Grant[] {
  return SEED_GRANTS;
}

export function filterGrants(
  grants: Grant[],
  filters: { search: string; type: GrantType | 'all'; status: GrantStatus | 'all' },
): Grant[] {
  const q = filters.search.toLowerCase();
  return grants.filter((grant) => {
    if (filters.type !== 'all' && grant.type !== filters.type) return false;
    if (filters.status !== 'all' && grant.status !== filters.status) return false;
    if (q) {
      const haystack = [grant.title, grant.funder, grant.summary, ...grant.tags, ...grant.eligibility]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
