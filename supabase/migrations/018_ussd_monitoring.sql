-- 018_ussd_monitoring.sql
--
-- Seku's monitoring instrumentation (filing 2026-06-17). Two deliverables:
--
--   1. Session exit logging in the USSD flow — every session END writes one
--      row here so we can answer "did a USSD member's session terminate
--      before W0 delivered?" and "what menu path was the last thing the
--      member touched before they fell off?".
--
--   2. The 30-day RECONCILED-with-no-follow-up cohort flag — a payment_order
--      that has reached RECONCILED but the same phone has issued no further
--      USSD session within 30 days lands in a queryable cohort. The actual
--      flag is written to payment_orders.metadata.invisible_member via the
--      promoter sweep; this migration is here only to surface the contract
--      and add the supporting index.
--
-- Phone identity uses the same HMAC pepper as payment_orders.user_id_hash and
-- memberships.phone_hash so cohort joins stay consistent across the stack.

CREATE TABLE IF NOT EXISTS ussd_session_exits (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         text         NOT NULL,
  phone_hash         text         NOT NULL,
  country_code       text,
  service_code       text,
  -- Final accumulated `text` the AT-style USSD aggregator submitted. Useful
  -- for diagnosing where members dropped — e.g. '1*2' means W0 → "Main menu".
  last_menu_path     text,
  result_action      text         NOT NULL CHECK (result_action IN ('CON', 'END')),
  -- 'completed' (END action returned), 'invalid_input' (user gave bad selection),
  -- 'welcome_skipped' (W0 skip → SMS fallback), 'welcome_completed' (W3 done),
  -- 'main_menu_routed' (fell through to main), 'unknown'.
  exit_reason        text         NOT NULL,
  duration_ms        integer,
  -- 'none' (no welcome in flight), 'rendered' (W0+ shown), 'completed', 'skipped'.
  welcome_state      text,
  exited_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ussd_session_exits_phone_hash_idx
  ON ussd_session_exits (phone_hash);

CREATE INDEX IF NOT EXISTS ussd_session_exits_exited_at_idx
  ON ussd_session_exits (exited_at DESC);

CREATE INDEX IF NOT EXISTS ussd_session_exits_welcome_state_idx
  ON ussd_session_exits (welcome_state)
  WHERE welcome_state IS NOT NULL;

-- RLS: no public reads. Only the service role writes (USSD handler) and
-- reads (cohort analysis from cron). Same posture as payment_orders.
ALTER TABLE ussd_session_exits ENABLE ROW LEVEL SECURITY;

-- Operator note: the invisible-member cohort is computed at sweep time —
--   SELECT po.order_id
--   FROM payment_orders po
--   WHERE po.status = 'RECONCILED'
--     AND po.confirmed_at < now() - interval '30 days'
--     AND po.metadata->>'source' = 'ussd'
--     AND NOT EXISTS (
--       SELECT 1 FROM ussd_session_exits se
--       WHERE se.phone_hash = po.user_id_hash
--         AND se.exited_at > po.confirmed_at
--     );
-- The promoter writes metadata.invisible_member = true on each matched order.
