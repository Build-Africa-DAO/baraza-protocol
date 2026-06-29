/**
 * Badge distribution gate — Akili council ruling 2026-06-18.
 *
 * The ruling parks WhatsApp / broadcast distribution of badge content
 * until Nia's USSD welcome is *deployed* (not just merged). Phase 2-A
 * shipped the welcome in code (`app/src/lib/ussd/welcome.ts`); production
 * deployment is the actual gate.
 *
 * Until both signals are true, any caller asking "can I broadcast badge
 * content?" gets a `blocked` response with the reason. The downstream
 * sender (Kemi's distribution code, future WhatsApp adapter, etc.) reads
 * `canBroadcastBadgeContent()` and either sends or skips.
 *
 * This is a runtime gate, not a code gate. It exists because the council
 * ruling carries the constraint long-term and we can't rely on every
 * future code change remembering it.
 *
 * Dissent on file:
 *   Kemi (broadcast): WhatsApp-first is the natural channel for "your
 *     badges, your standing" — it's visual, it's status, it lands where
 *     members already are.
 *   Nia (people):     WhatsApp-first presupposes a smartphone and an
 *     account that already knows what a badge is — distribution before
 *     the USSD welcome widens the people-gap rather than closing it.
 *
 * The gate sides with Nia until the USSD welcome is deployed. Once it is,
 * the broadcast door opens and Kemi's plan runs.
 */

export interface BroadcastGateInput {
  /**
   * Has Nia's USSD welcome (W0–W3) been deployed to the production USSD
   * endpoint? Sourced from the deployment environment, not code presence —
   * a build can carry the welcome code without the prod cron actually
   * firing it yet. Set via env var `USSD_WELCOME_DEPLOYED=1`.
   */
  ussdWelcomeDeployed: boolean;
  /**
   * Operator escape hatch: an explicit env-controlled override that lets a
   * release manager enable broadcast even when `ussdWelcomeDeployed` reads
   * false. Setting this to `true` MUST be accompanied by an override-log
   * entry in `akili/override-log.jsonl` per the council ruling — this code
   * does NOT enforce that, the operator process does.
   */
  explicitOverride?: boolean;
}

export interface BroadcastGateResult {
  allowed: boolean;
  /** Empty when allowed; otherwise the council-readable reason. */
  reason: string;
}

const COUNCIL_REASON_USSD_NOT_DEPLOYED =
  'broadcast_blocked_ussd_welcome_not_deployed';
const COUNCIL_REASON_OVERRIDE_LOGGED =
  'broadcast_allowed_via_operator_override';

/**
 * Pure decision. The caller is responsible for sourcing the env signals.
 * See `canBroadcastBadgeContentFromEnv()` for the convenience wrapper.
 */
export function canBroadcastBadgeContent(input: BroadcastGateInput): BroadcastGateResult {
  if (input.explicitOverride) {
    return { allowed: true, reason: COUNCIL_REASON_OVERRIDE_LOGGED };
  }
  if (!input.ussdWelcomeDeployed) {
    return { allowed: false, reason: COUNCIL_REASON_USSD_NOT_DEPLOYED };
  }
  return { allowed: true, reason: '' };
}

/**
 * Convenience wrapper that pulls signals from env. Use this in the actual
 * sending code paths (Kemi's WhatsApp adapter, badge social-card poster,
 * etc.). Falls closed — if env is absent, broadcast is blocked.
 */
export function canBroadcastBadgeContentFromEnv(): BroadcastGateResult {
  return canBroadcastBadgeContent({
    ussdWelcomeDeployed: process.env.USSD_WELCOME_DEPLOYED === '1',
    explicitOverride: process.env.BADGE_BROADCAST_OPERATOR_OVERRIDE === '1',
  });
}

export const BADGE_DISTRIBUTION_GATE_REASONS = {
  USSD_NOT_DEPLOYED: COUNCIL_REASON_USSD_NOT_DEPLOYED,
  OVERRIDE_LOGGED: COUNCIL_REASON_OVERRIDE_LOGGED,
} as const;
