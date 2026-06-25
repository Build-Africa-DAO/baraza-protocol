import type { Community } from "./types";

/**
 * Mock communities. fundDisplay is DISPLAY-ONLY — a figure the SACCO states
 * about itself. Nothing in this app moves or settles it.
 */
export const COMMUNITIES: Record<string, Community> = {
  "c-tujenge": {
    id: "c-tujenge",
    slug: "tujenge-sacco",
    name: "Tujenge SACCO",
    tagline: "A savings & credit co-op for Nairobi market traders",
    type: "sacco",
    fundDisplay: "KES 1,240,000",
    meetingCycle: "Monthly",
  },
};

export const getCommunity = (id: string): Community | undefined =>
  COMMUNITIES[id];

export const getCommunityBySlug = (slug: string): Community | undefined =>
  Object.values(COMMUNITIES).find((c) => c.slug === slug);
