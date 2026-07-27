import {
  BriefcaseBusiness,
  HeartHandshake,
  PartyPopper,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react';

export type CommunityPurpose =
  | 'monthly_savings'
  | 'community_service'
  | 'social_gathering'
  | 'business_ventures';

export interface PurposeOption {
  value: CommunityPurpose;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    value: 'monthly_savings',
    title: 'Monthly Savings',
    description: 'Regular contributions and pooled funds for the group.',
    icon: PiggyBank,
  },
  {
    value: 'community_service',
    title: 'Community Service',
    description: 'Organizing events and social welfare initiatives.',
    icon: HeartHandshake,
  },
  {
    value: 'social_gathering',
    title: 'Social Gathering',
    description: 'Events, meetups, and fostering personal connections.',
    icon: PartyPopper,
  },
  {
    value: 'business_ventures',
    title: 'Business Ventures',
    description: 'Joint investments and commercial group activities.',
    icon: BriefcaseBusiness,
  },
];
