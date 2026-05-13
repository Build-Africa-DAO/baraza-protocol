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

export function getCommunityBannerImage(type?: string | null): string {
  if (!type) return DEFAULT_COMMUNITY_BANNER;
  return COMMUNITY_BANNER_IMAGES[type] ?? COMMUNITY_BANNER_IMAGES.other;
}
