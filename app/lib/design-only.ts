// Gate for DESIGN-ONLY routes that render mock fixtures (e.g. /proposals,
// /communities/[slug]). These pages must never expose fabricated content on a
// public domain: they 404 unless DESIGN_ONLY is explicitly enabled (set
// DESIGN_ONLY=true only on a private preview), and they are always noindex so
// search engines never surface the mock data even when the flag is on.
export const DESIGN_ONLY = process.env.DESIGN_ONLY === "true";

// Spread into a route's `metadata` (or the return of `generateMetadata`).
export const noindex = { robots: { index: false, follow: false } } as const;
