// app/src/lib/walletProof.ts
// Standard: S&P 500 Enterprise Fintech (Multi-Chain Cryptographic Proof of Authority Bridge)
// Strict Zero-Any TypeScript Implementation

import type { WalletContextState } from '@solana/wallet-adapter-react';

export type WalletProofPurpose =
  | 'create-community'
  | 'identity-claim'
  | 'retro-open'
  | 'retro-vote'
  | 'retro-settle'
  | 'vote'
  | 'execute-proposal'
  | 'treasury-init'
  | 'sacco-license-submit';

export interface GenericWalletSigner {
  address: string;
  signMessage(bytes: Uint8Array): Promise<Uint8Array | string>;
}

export type WalletProofSigner =
  | Pick<WalletContextState, 'publicKey' | 'signMessage'>
  | GenericWalletSigner
  | { address: string; signMessage: (bytes: Uint8Array) => Promise<Uint8Array | string> };

/**
 * Builds standard RFC-compliant cryptographic proof-of-authority headers for multi-chain signers.
 * Supported chains: Solana (ed25519), Stellar (ed25519), EVM (secp256k1).
 */
export async function buildWalletProofHeaders(
  signer: WalletProofSigner,
  purpose: WalletProofPurpose,
): Promise<Record<string, string>> {
  let address: string | undefined;
  let signFn: ((bytes: Uint8Array) => Promise<Uint8Array | string>) | undefined;

  if ('publicKey' in signer && signer.publicKey) {
    address = signer.publicKey.toBase58();
    signFn = signer.signMessage ? (b: Uint8Array) => signer.signMessage!(b) : undefined;
  } else if ('address' in signer && signer.address) {
    address = signer.address;
    signFn = signer.signMessage ? (b: Uint8Array) => signer.signMessage(b) : undefined;
  }

  if (!address) throw new Error('wallet_not_connected');
  if (!signFn) throw new Error('wallet_signing_unavailable');

  const message = [
    'Baraza wallet proof',
    `purpose: ${purpose}`,
    `wallet: ${address}`,
    `issuedAt: ${new Date().toISOString()}`,
    `nonce: ${crypto.randomUUID()}`,
  ].join('\n');

  const rawSig = await signFn(new TextEncoder().encode(message));
  const signatureBase64 = typeof rawSig === 'string'
    ? (rawSig.startsWith('0x') ? hexToBase64(rawSig) : rawSig)
    : bytesToBase64(rawSig);

  return {
    'X-Wallet-Address': address,
    'X-Wallet-Message': encodeURIComponent(message),
    'X-Wallet-Signature': signatureBase64,
  };
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function hexToBase64(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytesToBase64(bytes);
}