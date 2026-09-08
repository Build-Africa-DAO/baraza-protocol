export const LANDING_NAV = [
  { label: 'Groups', to: '/#groups', hash: 'groups' },
  { label: 'How It Works', to: '/#how-it-works', hash: 'how-it-works' },
  { label: 'Features', to: '/#features', hash: 'features' },
  { label: 'FAQ', to: '/#faq', hash: 'faq' },
  { label: 'Contact', to: '/#contact', hash: 'contact' },
] as const;

export type LandingSectionId = (typeof LANDING_NAV)[number]['hash'];

export const LANDING_SECTION_IDS = LANDING_NAV.map((link) => link.hash);

export function isLandingNavActive(
  pathname: string,
  hash: string,
  scrollId: string | null,
  linkHash: string,
): boolean {
  if (pathname !== '/') return false;
  if (scrollId) return scrollId === linkHash;
  return hash === `#${linkHash}`;
}

export function pickActiveLandingSection(
  sections: Array<{ id: string; top: number; height: number }>,
  viewportHeight: number,
  headerPx = 72,
): string | null {
  const cutoff = viewportHeight * 0.45;
  const inPlay = sections.filter((section) => section.top < cutoff && section.top + section.height > headerPx);
  if (inPlay.length === 0) return null;
  return [...inPlay].sort((a, b) => a.top - b.top)[0].id;
}
