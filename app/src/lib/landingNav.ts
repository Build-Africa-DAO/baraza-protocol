export const LANDING_NAV = [
  { label: 'Home', to: '/#home', hash: 'home' },
  { label: 'How It Works', to: '/#how-it-works', hash: 'how-it-works' },
  { label: 'Features', to: '/#features', hash: 'features' },
  { label: 'Pricing', to: '/#pricing', hash: 'pricing' },
  { label: 'FAQ', to: '/#faq', hash: 'faq' },
  { label: 'Contact', to: '/#contact', hash: 'contact' },
] as const;

export type LandingSectionId = (typeof LANDING_NAV)[number]['hash'];

/** DOM ids the landing spy watches. The stats band belongs to Features. */
export const LANDING_SECTION_IDS = [
  'home',
  'how-it-works',
  'features',
  'who-its-for',
  'pricing',
  'faq',
  'contact',
] as const;

export function navHashForSection(sectionId: string): string {
  if (sectionId === 'who-its-for') return 'features';
  return sectionId;
}

export function isLandingNavActive(
  pathname: string,
  hash: string,
  scrollId: string | null,
  linkHash: string,
): boolean {
  if (pathname !== '/') return false;
  if (scrollId) return navHashForSection(scrollId) === linkHash;
  if (!hash || hash === '#') return linkHash === 'home';
  return navHashForSection(hash.replace('#', '')) === linkHash;
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
