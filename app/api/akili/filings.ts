import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { CouncilAgentName } from '../../src/akili/council.js';

export const config = { runtime: 'nodejs' };

/**
 * Admin-gated read of Akili council filings.
 *
 * Reads from the founder-local council data directory at
 * `~/.claude/data/akili-council/<agent>/{filings,listening-notes,corrections}.jsonl`.
 * In local dev this returns the live filings; in production the directory does
 * not exist and the route returns an empty array with a sync-status note. A
 * deliberate Supabase mirror is the production data path — building that mirror
 * is a separate decision from exposing the read API.
 *
 * Auth model matches the rest of the repo: the requester passes their admin
 * wallet address and the server checks it against the `ADMIN_WALLETS` env var
 * (comma-separated). Unsigned — same convention as `AdminReconciliation`.
 */

type FilingKind = 'filing' | 'listening-note' | 'correction';

interface FilingRecord {
  id: string;
  ts: string;
  kind: FilingKind;
  topic: string;
  supersedes: string | null;
  body: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

interface FilingsResponse {
  agent: CouncilAgentName;
  filings: FilingRecord[];
  listeningNotes: FilingRecord[];
  corrections: FilingRecord[];
  /** True when the source directory was found and read (local dev / synced prod). */
  synced: boolean;
  /** Human-readable status when synced is false. */
  status?: string;
}

const ADMIN_AGENTS: ReadonlySet<CouncilAgentName> = new Set([
  'amara',
  'kofi',
  'zara',
  'nia',
  'seku',
]);

function parseAdminWallets(): string[] {
  return (process.env.ADMIN_WALLETS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAuthorized(wallet: string | null): boolean {
  if (!wallet) return false;
  const allowed = parseAdminWallets();
  if (allowed.length === 0) return false;
  return allowed.includes(wallet);
}

async function readJsonl(path: string): Promise<FilingRecord[]> {
  const raw = await readFile(path, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const records: FilingRecord[] = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line) as FilingRecord);
    } catch {
      // Skip malformed lines — never throw on a partial read.
    }
  }
  return records;
}

async function readAgentDir(agent: CouncilAgentName): Promise<FilingsResponse> {
  const baseDir = join(homedir(), '.claude', 'data', 'akili-council', agent);
  try {
    const [filings, listeningNotes, corrections] = await Promise.all([
      readJsonl(join(baseDir, 'filings.jsonl')).catch(() => []),
      readJsonl(join(baseDir, 'listening-notes.jsonl')).catch(() => []),
      readJsonl(join(baseDir, 'corrections.jsonl')).catch(() => []),
    ]);
    const synced =
      filings.length + listeningNotes.length + corrections.length > 0;
    return {
      agent,
      filings,
      listeningNotes,
      corrections,
      synced,
      ...(synced
        ? {}
        : {
            status:
              'No council data found in the local data directory. In production this surface will populate from the Supabase mirror once that sync lands.',
          }),
    };
  } catch {
    return {
      agent,
      filings: [],
      listeningNotes: [],
      corrections: [],
      synced: false,
      status:
        'Council data directory not reachable from this runtime. Local dev expects ~/.claude/data/akili-council/<agent>/. Production reads will come from the Supabase mirror.',
    };
  }
}

export function OPTIONS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Wallet',
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  const wallet = req.headers.get('x-admin-wallet');
  if (!isAuthorized(wallet)) {
    return new Response(
      JSON.stringify({ error: 'forbidden', message: 'Admin wallet not recognised.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    );
  }

  let body: { agent?: string };
  try {
    body = (await req.json()) as { agent?: string };
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const agent = body.agent as CouncilAgentName | undefined;
  if (!agent || !ADMIN_AGENTS.has(agent)) {
    return new Response(
      JSON.stringify({ error: 'invalid_agent', message: 'Unknown council agent.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    );
  }

  const data = await readAgentDir(agent);
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export type { FilingRecord, FilingsResponse, FilingKind };


export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return OPTIONS();
  if (req.method === 'POST') return POST(req);
  return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
