// scripts/chaos-harness/types.mjs
// Standard: S&P 500 Enterprise Fintech / NIST SP 800-115 / Game-Theoretic Reinforcement Modeling
// Definitions for the 5,000-Persona Chaos Test Harness (Epoch 2)

export const TIERS = {
  TIER_0: 'tier_0_superadmin',
  TIER_1: 'tier_1_founders',
  TIER_2: 'tier_2_members',
  TIER_3: 'tier_3_developers',
  TIER_4: 'tier_4_adversarial',
};

export const TIER_COUNTS = {
  [TIERS.TIER_0]: 50,
  [TIERS.TIER_1]: 250,
  [TIERS.TIER_2]: 2200,
  [TIERS.TIER_3]: 500,
  [TIERS.TIER_4]: 2000,
};

export const INVARIANTS = {
  P1_DEMOCRATIC_CONSENSUS: 'I-GOV-VOTE-1',     // Zero duplicate votes allowed (HTTP 409 Conflict)
  P2_POSTGREST_RLS_CONTAINMENT: 'I-RLS-1',     // Zero plaintext rows/secrets leaked to anon
  P3_ZERO_MOCK_TOKEN_BLEED: 'I-AUTH-1',        // 100% mock bearer tokens rejected (HTTP 401)
  P4_FAIL_CLOSED_CRON_INGRESS: 'I-CRON-AUTH-1',// Unauthenticated cron triggers blocked (HTTP 401)
  P5_TENANT_BOLA_ISOLATION: 'I-BOLA-1',        // Cross-community mutations rejected (HTTP 403)
  P6_HMAC_SIGNATURE_INTEGRITY: 'I-SEC-1',      // Tampered webhooks rejected (HTTP 401/403)
  P7_DEAD_LETTER_QUEUE_ROUTING: 'I-REC-DLQ',   // Orphaned orders absorbed into DLQ (HTTP 200 { dlq: true })
  // --- Epoch 2 Newly Introduced Invariants ---
  P8_EMERGENCY_CIRCUIT_BREAKER: 'I-CB-FREEZE', // Active circuit breaker halts outbound payments (HTTP 503)
  P9_DISTRIBUTED_RATE_LIMITING: 'I-DDoS-429',  // DDoS bursts throttled with HTTP 429 & Retry-After
  P10_SALTED_OTP_SECURITY: 'I-NIST-OTP-SALT',  // 128-bit salted OTP resists brute-force (5-attempt cap)
  P11_PERSISTENT_BOT_FSM: 'I-BOT-FSM-PERSIST', // WhatsApp FSM state preserved across worker recycles
  P12_DLQ_INCIDENT_CAPTURE: 'I-DLQ-TELEMETRY', // Off-ramp failures captured in payment_exceptions table
};

export const REWARD_RULES = {
  [TIERS.TIER_0]: {
    PROMOTION_SUCCESS: { reward: 100, desc: 'Clean order promotion batch to RECONCILED' },
    COMPLIANCE_SLA: { reward: 50, desc: 'Compliance audit completed within SLA' },
    CIRCUIT_BREAKER_SEEDED: { reward: 100, desc: 'Emergency circuit breaker tripped safely' },
    UNAUTHORIZED_CRON: { penalty: 500, desc: 'Cron invoked with invalid secret' },
    TIMEOUT: { penalty: 200, desc: 'Request timed out or threw unhandled exception' },
  },
  [TIERS.TIER_1]: {
    TREASURY_INIT: { reward: 150, desc: 'Legal treasury initialization (multisig-ready)' },
    SASRA_LICENSE: { reward: 100, desc: 'Compliant SASRA license submission' },
    SOLVENT_QUOTE: { reward: 80, desc: 'Payout quote respecting 15% reserve floor' },
    BOLA_ATTEMPT: { penalty: 500, desc: 'Cross-community BOLA init on foreign vault' },
  },
  [TIERS.TIER_2]: {
    VALID_VOTE: { reward: 50, desc: 'Casting valid democratic proposal vote' },
    STK_PUSH_INIT: { reward: 50, desc: 'Initiated valid Daraja STK Push payment' },
    PROFILE_UPDATE: { reward: 30, desc: 'Profile metadata update' },
    VALID_AI_PROMPT: { reward: 20, desc: 'Valid Akili prompt (|M| <= 2000 chars)' },
    DOUBLE_VOTE_ATTEMPT: { penalty: 100, desc: 'Double-voting attempt blocked by HTTP 409' },
    RATE_LIMIT_BREACH: { penalty: 150, desc: 'Burst limit breached' },
  },
  [TIERS.TIER_3]: {
    VALID_HMAC_WEBHOOK: { reward: 100, desc: 'Valid HMAC-SHA256 webhook dispatch' },
    DLQ_ABSORPTION: { reward: 80, desc: 'Clean DLQ absorption of orphaned order' },
    UNSIGNED_CALLBACK: { penalty: 200, desc: 'Unsigned callback submission blocked' },
    TAMPERED_HMAC: { penalty: 300, desc: 'Tampered HMAC payload blocked' },
  },
  [TIERS.TIER_4]: {
    RLS_EXFILTRATION_FAIL: { penalty: 50, desc: 'PostgREST RLS blocked data exfiltration (401/403)' },
    MOCK_TOKEN_FAIL: { penalty: 100, desc: 'Mock test token rejected in production mode (401)' },
    RATE_LIMIT_BLOCKED: { penalty: 50, desc: 'Throttled by distributed rate limiter (429)' },
    CIRCUIT_BREAKER_BLOCKED: { penalty: 100, desc: 'Blocked by emergency circuit breaker freeze (503)' },
    UNAUTHORIZED_VOTE_FAIL: { penalty: 50, desc: 'Unauthorized vote casting rejected (401/403)' },
  },
};
