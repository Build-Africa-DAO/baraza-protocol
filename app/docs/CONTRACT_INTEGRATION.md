# Contract Integration

## Current State
The app uses **mock data** (`src/lib/constants.ts`) with Solana transaction scaffolding in `src/hooks/useBarazaContract.ts`.

All transaction flows (vote, join, create) build real Solana `Transaction` objects and use `sendTransaction` from the wallet adapter — they just need program instructions added.

## Adding the Anchor Program

1. Deploy your Anchor program to devnet
2. Copy the IDL to `src/lib/baraza.idl.json`
3. Set `VITE_PROGRAM_ID` in `.env.local`
4. Update `useBarazaContract.ts`:

```ts
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from '@/lib/baraza.idl.json';

const program = new Program(idl, PROGRAM_ID, provider);

// In castVote:
const ix = await program.methods
  .castVote(proposalId, support)
  .accounts({ community, proposal, voter: publicKey })
  .instruction();
tx.add(ix);
```

## RPC Fallback
`src/lib/rpc.ts` rotates through RPC endpoints on failure:
1. `VITE_RPC_ENDPOINT` (env var)
2. `https://api.devnet.solana.com`
3. `clusterApiUrl('devnet')`

## Key Hooks
- `useBarazaContract` — Read (cached) + Write (with toast feedback)
- `useWalletGuard` — Gates actions behind wallet connection
- `withRpcFallback` — Wraps any RPC call with automatic retry across endpoints
