-- An open external pull request is review evidence, not payment evidence.
update public.bounties
set
  status = 'in_review',
  reviewer = 'Pending maintainer review',
  updated_at = now()
where issue_number = 28
  and status = 'paid';
