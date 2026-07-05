-- Preserve Baraza's existing community-work table before introducing the
-- public GitHub bounty mirror requested at /bounties.
do $$
begin
  if to_regclass('public.community_bounties') is null
    and to_regclass('public.bounties') is not null then
    alter table public.bounties rename to community_bounties;
  end if;
end
$$;

create table if not exists public.bounties (
  issue_number integer primary key,
  title text not null,
  body_md text not null default '',
  amount_usd numeric(12, 2),
  status text not null default 'open',
  deadline date,
  reviewer text,
  html_url text not null,
  updated_at timestamptz not null default now(),

  constraint bounties_issue_number_unique unique (issue_number),
  constraint bounties_amount_usd_nonnegative check (amount_usd is null or amount_usd >= 0),
  constraint bounties_status_check check (status in ('open', 'claimed', 'in_review', 'paid')),
  constraint bounties_html_url_check check (html_url ~ '^https://github\.com/[^/]+/[^/]+/issues/[0-9]+$')
);

create index if not exists bounties_status_updated_at_idx
  on public.bounties (status, updated_at desc);

alter table public.bounties enable row level security;

drop policy if exists "Public can read GitHub bounties" on public.bounties;
create policy "Public can read GitHub bounties"
  on public.bounties
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete, truncate, references, trigger
  on public.bounties from anon, authenticated;
grant select on public.bounties to anon, authenticated;
grant all on public.bounties to service_role;

drop trigger if exists bounties_set_updated_at on public.bounties;
create trigger bounties_set_updated_at
  before update on public.bounties
  for each row
  execute function public.set_updated_at();

insert into public.bounties (
  issue_number,
  title,
  body_md,
  amount_usd,
  status,
  deadline,
  reviewer,
  html_url,
  updated_at
)
values
  (
    16,
    'Resolve TS2307 Akili module resolution failures in test imports',
    'Restore reliable test imports for the Akili modules and document the resolution.',
    300,
    'open',
    '2026-07-12',
    'Baraza core',
    'https://github.com/Build-Africa-DAO/baraza-protocol/issues/16',
    '2026-07-05T08:00:00Z'
  ),
  (
    26,
    'Document the Solana devnet deployment and smoke test',
    'Publish program IDs, explorer links, and the repeatable smoke-test path.',
    750,
    'claimed',
    '2026-07-15',
    'Protocol review',
    'https://github.com/Build-Africa-DAO/baraza-protocol/issues/26',
    '2026-07-05T07:00:00Z'
  ),
  (
    27,
    'Audit the mobile join flow for accessibility',
    'Review keyboard flow, readable contrast, focus order, and compact-phone layouts.',
    500,
    'in_review',
    '2026-07-18',
    'Product review',
    'https://github.com/Build-Africa-DAO/baraza-protocol/issues/27',
    '2026-07-05T06:00:00Z'
  ),
  (
    28,
    'Add payout receipt export for community admins',
    'Create a durable receipt export for approved community payouts.',
    900,
    'in_review',
    null,
    'Pending maintainer review',
    'https://github.com/Build-Africa-DAO/baraza-protocol/issues/28',
    '2026-07-05T05:00:00Z'
  )
on conflict (issue_number) do update set
  title = excluded.title,
  body_md = excluded.body_md,
  amount_usd = excluded.amount_usd,
  status = excluded.status,
  deadline = excluded.deadline,
  reviewer = excluded.reviewer,
  html_url = excluded.html_url,
  updated_at = excluded.updated_at;
