-- Require separate bounty-creator and community-admin sign-off before payout.

ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS created_by text;

ALTER TABLE public.bounty_submissions
  ADD COLUMN IF NOT EXISTS creator_approved_by text,
  ADD COLUMN IF NOT EXISTS creator_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_approved_by text,
  ADD COLUMN IF NOT EXISTS admin_approved_at timestamptz;

ALTER TABLE public.bounty_submissions
  DROP CONSTRAINT IF EXISTS bounty_submissions_dual_approval_check;
UPDATE public.bounty_submissions
SET status = 'pending', reviewed_at = NULL
WHERE status = 'approved'
  AND (creator_approved_at IS NULL OR admin_approved_at IS NULL);
ALTER TABLE public.bounty_submissions
  ADD CONSTRAINT bounty_submissions_dual_approval_check
  CHECK (
    status <> 'approved'
    OR (creator_approved_at IS NOT NULL AND admin_approved_at IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS bounties_created_by_idx
  ON public.bounties (created_by);

COMMENT ON COLUMN public.bounties.created_by IS
  'Baraza account id that created the bounty and must approve completed work.';
COMMENT ON COLUMN public.bounty_submissions.creator_approved_at IS
  'Creator sign-off. Submission remains pending until admin_approved_at is also present.';
COMMENT ON COLUMN public.bounty_submissions.admin_approved_at IS
  'Community admin sign-off. Submission remains pending until creator_approved_at is also present.';
