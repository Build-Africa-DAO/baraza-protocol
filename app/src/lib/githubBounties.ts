import { getSupabaseClient } from '@/lib/communities';

export type GithubBountyStatus = 'open' | 'claimed' | 'in_review' | 'paid';

export interface GithubBounty {
  issueNumber: number;
  title: string;
  bodyMd: string;
  amountUsd: number | null;
  status: GithubBountyStatus;
  deadline: string | null;
  reviewer: string | null;
  htmlUrl: string;
  updatedAt: string;
}

interface GithubBountyRow {
  issue_number: number;
  title: string;
  body_md: string;
  amount_usd: number | string | null;
  status: GithubBountyStatus;
  deadline: string | null;
  reviewer: string | null;
  html_url: string;
  updated_at: string;
}

function fromRow(row: GithubBountyRow): GithubBounty {
  return {
    issueNumber: row.issue_number,
    title: row.title,
    bodyMd: row.body_md,
    amountUsd: row.amount_usd === null ? null : Number(row.amount_usd),
    status: row.status,
    deadline: row.deadline,
    reviewer: row.reviewer,
    htmlUrl: row.html_url,
    updatedAt: row.updated_at,
  };
}

export function sortGithubBounties(bounties: GithubBounty[]): GithubBounty[] {
  return [...bounties].sort((left, right) => {
    const openDifference = Number(right.status === 'open') - Number(left.status === 'open');
    if (openDifference !== 0) return openDifference;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export async function listGithubBounties(): Promise<GithubBounty[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('bounties')
    .select('issue_number,title,body_md,amount_usd,status,deadline,reviewer,html_url,updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return sortGithubBounties((data ?? []).map((row) => fromRow(row as GithubBountyRow)));
}
