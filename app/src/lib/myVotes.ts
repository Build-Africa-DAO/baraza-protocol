/**
 * Which way this account voted on which decision, kept on this device.
 *
 * The `votes` table is closed to the browser by design, so the app cannot ask
 * the server "did I vote?". After `POST /api/governance/vote` succeeds the
 * choice is written here; the server's 409 `already_voted` covers the case
 * where this record is lost. The tally itself always comes from the server.
 */
export type MyVoteChoice = 'for' | 'against' | 'abstain';

const KEY = 'baraza.myVotes.v1';

type Store = Record<string, MyVoteChoice>;

function storageKey(decisionId: string, voter: string): string {
  return `${voter}::${decisionId}`;
}

function read(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked: the server still knows.
  }
}

export function getMyVote(decisionId: string, voter: string | null | undefined): MyVoteChoice | null {
  if (!voter) return null;
  return read()[storageKey(decisionId, voter)] ?? null;
}

export function recordMyVote(decisionId: string, voter: string, choice: MyVoteChoice): void {
  const store = read();
  store[storageKey(decisionId, voter)] = choice;
  write(store);
  window.dispatchEvent(new Event('baraza:my-votes'));
}

/** Subscribe to changes so `useVoteStatus` re-renders after a ballot lands. */
export function onMyVotesChange(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('baraza:my-votes', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('baraza:my-votes', listener);
    window.removeEventListener('storage', listener);
  };
}
