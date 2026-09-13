/**
 * Build-time guards for surfaces that must never reach members in production.
 *
 * These are deliberately `import.meta.env`-based rather than runtime toggles:
 * `lib/network.ts` exposes a user-switchable `test | live` environment, which is
 * a product preference, not a safety boundary. Anything that fabricates an
 * order, a membership, or a balance belongs behind one of these instead.
 */

/**
 * The M-Pesa simulator (`POST /api/mpesa/simulate`) mints payment orders without
 * money moving. The handler already refuses to run in production and requires a
 * shared secret the browser does not hold, so calling it from the client can only
 * ever 403 — and the old fallback treated that 403 as permission to continue.
 *
 * Opt in explicitly with `VITE_ENABLE_PAYMENT_SIMULATOR=true` in a dev `.env`.
 */
export function isPaymentSimulatorEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_PAYMENT_SIMULATOR === 'true';
}

/**
 * Seeded communities, seeded proposals and the `dataStore` simulation timers.
 * Useful for local UI work, dishonest in front of a member.
 */
export function isSyntheticDataEnabled(): boolean {
  return import.meta.env.DEV;
}

/** Copy shown wherever a rail exists in the UI but cannot complete here. */
export const RAIL_UNAVAILABLE_COPY =
  'M-Pesa payment is not available in this environment yet. Nothing has been charged.';
