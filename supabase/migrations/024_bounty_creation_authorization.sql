alter table if exists public.bounties
  add column if not exists approval_proposal_id text;

comment on column public.bounties.approval_proposal_id is
  'Passed community proposal authorizing bounty creation when the creator is not a community admin.';
