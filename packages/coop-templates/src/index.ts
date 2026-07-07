export type CommunityType = 'chama' | 'sacco' | 'stokvel' | 'dao' | 'government';
export type PayoutMode = 'rotating' | 'proportional' | 'milestone';

export interface CoopTemplate {
  type: CommunityType;
  label: string;
  summary: string;
  defaultContributionSchedule: string;
  defaultPayoutMode: PayoutMode;
  quorum: number;
  amendmentNoticeDays: number;
  halalMode: boolean;
  memberLimit: number;
  featureFlags: {
    akiliAccess: boolean;
    apiAccess: boolean;
    complianceReports: boolean;
    tokenDeployment: boolean;
  };
}

const templates: Record<CommunityType, CoopTemplate> = {
  chama: {
    type: 'chama',
    label: 'Chama',
    summary: 'Community savings circles with simple dues and clear approval rules.',
    defaultContributionSchedule: 'Monthly on the 5th',
    defaultPayoutMode: 'rotating',
    quorum: 51,
    amendmentNoticeDays: 7,
    halalMode: true,
    memberLimit: 60,
    featureFlags: {
      akiliAccess: false,
      apiAccess: false,
      complianceReports: false,
      tokenDeployment: false,
    },
  },
  sacco: {
    type: 'sacco',
    label: 'SACCO',
    summary: 'Higher-controls cooperative banking with compliance-aware defaults.',
    defaultContributionSchedule: 'Monthly on the 1st',
    defaultPayoutMode: 'proportional',
    quorum: 60,
    amendmentNoticeDays: 14,
    halalMode: true,
    memberLimit: 500,
    featureFlags: {
      akiliAccess: true,
      apiAccess: true,
      complianceReports: true,
      tokenDeployment: false,
    },
  },
  stokvel: {
    type: 'stokvel',
    label: 'Stokvel',
    summary: 'Rotating savings circles with simple member-led payout logic.',
    defaultContributionSchedule: 'Biweekly on Friday',
    defaultPayoutMode: 'rotating',
    quorum: 51,
    amendmentNoticeDays: 7,
    halalMode: false,
    memberLimit: 40,
    featureFlags: {
      akiliAccess: false,
      apiAccess: false,
      complianceReports: false,
      tokenDeployment: false,
    },
  },
  dao: {
    type: 'dao',
    label: 'DAO',
    summary: 'Token-aware governance for communities that want an explicit on-chain path.',
    defaultContributionSchedule: 'Monthly or custom schedule',
    defaultPayoutMode: 'milestone',
    quorum: 40,
    amendmentNoticeDays: 14,
    halalMode: false,
    memberLimit: 1000,
    featureFlags: {
      akiliAccess: true,
      apiAccess: true,
      complianceReports: true,
      tokenDeployment: true,
    },
  },
  government: {
    type: 'government',
    label: 'Government / public body',
    summary: 'Public-facing governance with tighter compliance, audit, and reporting defaults.',
    defaultContributionSchedule: 'Policy-driven',
    defaultPayoutMode: 'milestone',
    quorum: 66,
    amendmentNoticeDays: 21,
    halalMode: false,
    memberLimit: 5000,
    featureFlags: {
      akiliAccess: true,
      apiAccess: true,
      complianceReports: true,
      tokenDeployment: false,
    },
  },
};

export function getCoopTemplate(type: CommunityType): CoopTemplate {
  return templates[type];
}

export function listCoopTemplates(): CoopTemplate[] {
  return Object.values(templates);
}

