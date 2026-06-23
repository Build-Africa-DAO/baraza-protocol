alter table if exists public.bounties
  add column if not exists access text not null default 'community-restricted',
  add column if not exists reward_token text not null default 'SOL',
  add column if not exists payout_tx_hash text;

alter table if exists public.bounties
  add constraint bounties_access_check
  check (access in ('public', 'community-restricted'));

alter table if exists public.bounties
  add constraint bounties_reward_token_check
  check (reward_token in ('SOL', 'G$', 'XLM', 'COMMUNITY_TOKEN'));
