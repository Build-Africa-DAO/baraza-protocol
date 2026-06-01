import { PublicKey } from '@solana/web3.js';

function programIdFromEnv(value: string | undefined, fallback: string): PublicKey {
  return new PublicKey(value?.trim() || fallback);
}

export const COMMUNITY_REGISTRY_PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_COMMUNITY_REGISTRY_PROGRAM_ID?.trim()
    || 'Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD',
);
export const GOVERNANCE_PROGRAM_ID = programIdFromEnv(
  import.meta.env.VITE_GOVERNANCE_PROGRAM_ID,
  'DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A',
);
export const MEMBERSHIP_PROGRAM_ID = programIdFromEnv(
  import.meta.env.VITE_MEMBERSHIP_PROGRAM_ID,
  '34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK',
);
export const PAYMENT_ATTESTATION_PROGRAM_ID = programIdFromEnv(
  import.meta.env.VITE_PAYMENT_ATTESTATION_PROGRAM_ID,
  'Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT',
);
export const TREASURY_VAULT_PROGRAM_ID = programIdFromEnv(
  import.meta.env.VITE_TREASURY_VAULT_PROGRAM_ID,
  'ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy',
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

function u16LeBytes(n: number): Uint8Array {
  const arr = new Uint8Array(2);
  arr[0] = n & 0xff;
  arr[1] = (n >> 8) & 0xff;
  return arr;
}

function bytes32(value: Uint8Array | number[]): Uint8Array {
  const bytes = value instanceof Uint8Array ? value : Uint8Array.from(value);
  if (bytes.length !== 32) {
    throw new Error(`Expected 32 bytes, got ${bytes.length}`);
  }
  return bytes;
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

export function membershipTierPda(communityKey: PublicKey, tierId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('membership_tier'), communityKey.toBytes(), u16LeBytes(tierId)],
    MEMBERSHIP_PROGRAM_ID,
  );
}

export function memberPda(communityKey: PublicKey, memberIdHash: Uint8Array | number[]): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('member'), communityKey.toBytes(), bytes32(memberIdHash)],
    MEMBERSHIP_PROGRAM_ID,
  );
}

export function paymentConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('payment_config')],
    PAYMENT_ATTESTATION_PROGRAM_ID,
  );
}

export function paymentAttestationPda(orderIdHash: Uint8Array | number[]): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('payment'), bytes32(orderIdHash)],
    PAYMENT_ATTESTATION_PROGRAM_ID,
  );
}

/** SHA-256 a string into the 32-byte seed required by memberPda / paymentAttestationPda. */
export async function hashToBytes32(input: string): Promise<Uint8Array> {
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return new Uint8Array(buffer);
}

export function treasuryVaultPda(communityKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('treasury'), communityKey.toBytes()],
    TREASURY_VAULT_PROGRAM_ID,
  );
}

export function treasuryReleaseReceiptPda(proposalKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [enc.encode('release'), proposalKey.toBytes()],
    TREASURY_VAULT_PROGRAM_ID,
  );
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}
