export const COMMUNITY_BANNER_IMAGES: Record<string, string> = {
  savings: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=80",
  cooperative: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  professional: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80",
  housing: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
  welfare: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1400&q=80",
  investment: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
  other: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1400&q=80",
};

export const DEFAULT_COMMUNITY_BANNER =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80";

export interface CommunityGalleryItem {
  src: string;
  title: string;
  caption: string;
}

const COMMUNITY_GALLERIES: Record<string, CommunityGalleryItem[]> = {
  savings: [
    {
      src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
      title: "Member circle",
      caption: "Regular meetings keep savings goals visible to every member.",
    },
    {
      src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
      title: "Shared planning",
      caption: "Contributions, proposals, and approvals are reviewed together.",
    },
    {
      src: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
      title: "Treasury records",
      caption: "Every shilling has a traceable record from payment to release.",
    },
  ],
  cooperative: [
    {
      src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
      title: "Co-op coordination",
      caption: "Members coordinate supply, buying, and distribution decisions.",
    },
    {
      src: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80",
      title: "Market decisions",
      caption: "Bulk purchase and supplier proposals move through governance.",
    },
    {
      src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      title: "Digital records",
      caption: "Mobile-first participation keeps the co-op ledger accessible.",
    },
  ],
  professional: [
    {
      src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
      title: "Working sessions",
      caption: "Members plan programs, grants, and emergency support together.",
    },
    {
      src: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
      title: "Skill network",
      caption: "Knowledge sharing becomes a funded community priority.",
    },
    {
      src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      title: "Transparent operations",
      caption: "The dashboard gives members a common operating view.",
    },
  ],
  housing: [
    {
      src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      title: "Long-term assets",
      caption: "Land and construction proposals can be tracked from vote to spend.",
    },
    {
      src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      title: "Member goals",
      caption: "Shared housing targets stay connected to contribution history.",
    },
    {
      src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
      title: "Project milestones",
      caption: "Major releases follow governance rules and member approvals.",
    },
  ],
  welfare: [
    {
      src: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
      title: "Care fund",
      caption: "Emergency support can be proposed, voted, and recorded clearly.",
    },
    {
      src: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1200&q=80",
      title: "Community support",
      caption: "Members see how welfare requests move through the group.",
    },
    {
      src: "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
      title: "Accountable help",
      caption: "Support decisions stay visible before and after funds move.",
    },
  ],
  investment: [
    {
      src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
      title: "Investment ledger",
      caption: "Portfolio decisions can be proposed and approved by members.",
    },
    {
      src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
      title: "Strategy meetings",
      caption: "Members inspect opportunities before committing shared capital.",
    },
    {
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      title: "Performance view",
      caption: "Treasury activity and decisions stay in one inspectable place.",
    },
  ],
  other: [
    {
      src: DEFAULT_COMMUNITY_BANNER,
      title: "Community workspace",
      caption: "A shared place for members, proposals, and treasury activity.",
    },
    {
      src: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80",
      title: "Member coordination",
      caption: "Groups can coordinate funding decisions from one dashboard.",
    },
    {
      src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
      title: "Governed action",
      caption: "Decisions, payments, and releases stay connected.",
    },
  ],
};

export function getCommunityBannerImage(type?: string | null): string {
  if (!type) return DEFAULT_COMMUNITY_BANNER;
  return COMMUNITY_BANNER_IMAGES[type] ?? COMMUNITY_BANNER_IMAGES.other;
}

export function getCommunityGallery(type?: string | null): CommunityGalleryItem[] {
  if (!type) return COMMUNITY_GALLERIES.other;
  return COMMUNITY_GALLERIES[type] ?? COMMUNITY_GALLERIES.other;
}
