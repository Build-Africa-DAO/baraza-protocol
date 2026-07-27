-- Durable bounty payout workflow. Service-role APIs are the only writers.

ALTER TABLE public.bounty_submissions
  ADD COLUMN IF NOT EXISTS contributor_wallet text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.bounty_submissions
  DROP CONSTRAINT IF EXISTS bounty_submissions_status_check;
ALTER TABLE public.bounty_submissions
  ADD CONSTRAINT bounty_submissions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.bounties DROP CONSTRAINT IF EXISTS bounties_status_chk;
ALTER TABLE public.bounties
  ADD CONSTRAINT bounties_status_chk
  CHECK (status IN ('open', 'in_progress', 'in_review', 'awarded', 'paid'));

ALTER TABLE public.bounties DROP CONSTRAINT IF EXISTS bounties_reward_token_check;
ALTER TABLE public.bounties ALTER COLUMN reward_token SET DEFAULT 'USDC';
ALTER TABLE public.bounties
  ADD CONSTRAINT bounties_reward_token_check
  CHECK (reward_token IN ('USDC', 'USDT', 'G$', 'SOL', 'XLM', 'COMMUNITY_TOKEN'));

CREATE TABLE IF NOT EXISTS public.bounty_payouts (
  id                  text PRIMARY KEY,
  bounty_id           text NOT NULL REFERENCES public.bounties(id) ON DELETE RESTRICT,
  community_id        text NOT NULL,
  submission_id       text NOT NULL REFERENCES public.bounty_submissions(id) ON DELETE RESTRICT,
  recipient_wallet    text NOT NULL,
  recipient_name      text NOT NULL DEFAULT 'Contributor',
  amount_kes          numeric(20, 2) NOT NULL CHECK (amount_kes > 0),
  asset               text NOT NULL DEFAULT 'USDC' CHECK (asset IN ('USDC', 'USDT', 'G$')),
  asset_amount        numeric(30, 7),
  required_approvals  integer NOT NULL DEFAULT 2 CHECK (required_approvals BETWEEN 1 AND 10),
  status              text NOT NULL DEFAULT 'awaiting_approval'
                      CHECK (status IN ('awaiting_approval', 'ready', 'processing', 'paid', 'failed', 'cancelled')),
  idempotency_key     text NOT NULL UNIQUE,
  tx_hash             text UNIQUE,
  explorer_url        text,
  failure_reason      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  paid_at             timestamptz
);

CREATE TABLE IF NOT EXISTS public.bounty_payout_approvals (
  payout_id       text NOT NULL REFERENCES public.bounty_payouts(id) ON DELETE CASCADE,
  approver_wallet text NOT NULL,
  approved_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (payout_id, approver_wallet)
);

CREATE TABLE IF NOT EXISTS public.bounty_payout_attempts (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payout_id          text NOT NULL REFERENCES public.bounty_payouts(id) ON DELETE CASCADE,
  provider           text NOT NULL,
  provider_reference text,
  status             text NOT NULL CHECK (status IN ('created', 'submitted', 'confirmed', 'failed')),
  tx_hash            text,
  error_code         text,
  error_message      text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bounty_payout_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payout_id   text NOT NULL REFERENCES public.bounty_payouts(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  actor       text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bounty_payouts_bounty_id_idx ON public.bounty_payouts (bounty_id);
CREATE INDEX IF NOT EXISTS bounty_payouts_community_status_idx ON public.bounty_payouts (community_id, status);
CREATE INDEX IF NOT EXISTS bounty_payout_events_payout_id_idx ON public.bounty_payout_events (payout_id, created_at);

ALTER TABLE public.bounty_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_payout_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_payout_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_payout_events ENABLE ROW LEVEL SECURITY;

-- Public receipts deliberately omit recipient names, submissions, approvers, and internal errors.
CREATE OR REPLACE VIEW public.public_bounty_payout_receipts AS
SELECT
  id AS payout_id,
  bounty_id,
  community_id,
  amount_kes,
  asset,
  asset_amount,
  recipient_wallet,
  tx_hash,
  explorer_url,
  paid_at
FROM public.bounty_payouts
WHERE status = 'paid' AND tx_hash IS NOT NULL;

GRANT SELECT ON public.public_bounty_payout_receipts TO anon, authenticated;
