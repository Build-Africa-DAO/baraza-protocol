export const COMMUNITY_BANNER_IMAGES: Record<string, string> = {
  savings:     "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1400&q=80",
  cooperative: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80",
  professional:"https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=80",
  housing:     "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
  welfare:     "https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?auto=format&fit=crop&w=1400&q=80",
  investment:  "https://images.unsplash.com/photo-1552799446-159ba9523315?auto=format&fit=crop&w=1400&q=80",
  other:       "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1400&q=80",
};

export const DEFAULT_COMMUNITY_BANNER =
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1400&q=80";

export interface CommunityGalleryItem {
  src: string;
  title: string;
  caption: string;
}

const COMMUNITY_GALLERIES: Record<string, CommunityGalleryItem[]> = {
  savings: [
    {
      src: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1200&q=80",
      title: "Chama circle",
      caption: "The rotating savings tradition — merry-go-round — has sustained African families for generations.",
    },
    {
      src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80",
      title: "Shared trust",
      caption: "Contributions, accountability, and collective wealth-building rooted in African community values.",
    },
    {
      src: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
      title: "Heritage ledger",
      caption: "Every shilling traced — honouring the Ubuntu principle that wealth belongs to the community.",
    },
  ],
  cooperative: [
    {
      src: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80",
      title: "Market heritage",
      caption: "African markets have anchored trade and kinship across the continent for centuries.",
    },
    {
      src: "https://images.unsplash.com/photo-1488716820095-cbe80883c496?auto=format&fit=crop&w=1200&q=80",
      title: "Harvest decisions",
      caption: "Co-operative farming and collective bargaining — African traditions now governed on-chain.",
    },
    {
      src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      title: "Digital commons",
      caption: "Mobile-first participation keeps the co-op ledger accessible across East Africa.",
    },
  ],
  professional: [
    {
      src: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80",
      title: "Pan-African vision",
      caption: "From the Rift Valley to the coast — a professional network built on African solidarity.",
    },
    {
      src: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
      title: "Knowledge transfer",
      caption: "Griot traditions live on — elders and emerging leaders share skills in a governed space.",
    },
    {
      src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      title: "Transparent operations",
      caption: "Members share a common view — an African approach to collective accountability.",
    },
  ],
  housing: [
    {
      src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      title: "African architecture",
      caption: "From the stone houses of Lamu to modern Nairobi — housing is a communal milestone.",
    },
    {
      src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      title: "Building together",
      caption: "The African tradition of communal house-raising — harambee — now governed on-chain.",
    },
    {
      src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
      title: "Milestones on the ledger",
      caption: "Land rights and construction proposals follow group governance — transparent and traceable.",
    },
  ],
  welfare: [
    {
      src: "https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?auto=format&fit=crop&w=1200&q=80",
      title: "Ubuntu treasury",
      caption: "'I am because we are' — emergency care funds governed by the group, for the group.",
    },
    {
      src: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1200&q=80",
      title: "Community of care",
      caption: "African mutual aid — harambee contributions tracked with full transparency for every member.",
    },
    {
      src: "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
      title: "Accountable support",
      caption: "Support decisions stay visible — honouring the communal covenant before and after funds move.",
    },
  ],
  investment: [
    {
      src: "https://images.unsplash.com/photo-1552799446-159ba9523315?auto=format&fit=crop&w=1200&q=80",
      title: "African futures",
      caption: "Investing in the continent's next chapter — from Nairobi's Silicon Savannah to the Sahel.",
    },
    {
      src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
      title: "Strategy council",
      caption: "Members inspect opportunities together — collective wealth-building in the African tradition.",
    },
    {
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      title: "Heritage capital",
      caption: "Treasury decisions stay on a shared, inspectable trail — accountability across generations.",
    },
  ],
  other: [
    {
      src: DEFAULT_COMMUNITY_BANNER,
      title: "African commons",
      caption: "A shared space for members, proposals, and treasury — rooted in African community tradition.",
    },
    {
      src: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80",
      title: "Collective voice",
      caption: "From the baraza — the council gathering — every member has a seat at the table.",
    },
    {
      src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
      title: "Governed action",
      caption: "Decisions, payments, and releases stay connected — the African council model on-chain.",
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
