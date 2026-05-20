import { PublicKey } from '@solana/web3.js';

export const COMMUNITY_REGISTRY_PROGRAM_ID = new PublicKey(
  'CmnZpkH1Y9d5oh4PNqRTYAyMRhFqLkXq2fJh6cN6jPbm',
);
export const GOVERNANCE_PROGRAM_ID = new PublicKey(
  'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
);
export const MEMBERSHIP_PROGRAM_ID = new PublicKey(
  'EnCvLHcm2dSjwKjskwihHbuHWLQKjPKMLGJJxbPiaDup',
);

const enc = new TextEncoder();

function u64LeBytes(n: bigint | number): Uint8Array {
  const arr = new Uint8Array(8);
  let v = BigInt(n);
  for (let i = 0; i < 8; i++) {
    arr[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return arr;
}

export function communityPda(slug: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('community'), enc.encode(slug)],
    COMMUNITY_REGISTRY_PROGRAM_ID,
  );
}

export function govConfigPda(communityKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('config'), communityKey.toBytes()],
    GOVERNANCE_PROGRAM_ID,
  );
}

export function proposalPda(communityKey: PublicKey, proposalId: bigint | number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('proposal'), communityKey.toBytes(), u64LeBytes(proposalId)],
    GOVERNANCE_PROGRAM_ID,
  );
}

export function voteReceiptPda(proposalKey: PublicKey, voterMemberKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('vote'), proposalKey.toBytes(), voterMemberKey.toBytes()],
    GOVERNANCE_PROGRAM_ID,
  );
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}
