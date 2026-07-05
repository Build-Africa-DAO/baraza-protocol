-- External contributions do not imply a bounty until a maintainer approves one.
update public.bounties
set
  amount_usd = null,
  updated_at = now()
where issue_number = 28;
