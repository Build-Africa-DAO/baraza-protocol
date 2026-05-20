# Baraza - Contract Integration Checklist

**Status:** Preview mode (mock data). Write flows blocked.  
**Programs:** `community_registry`, `membership`, `payment_attestation`, `governance`, `treasury_vault`  
**Chains:** Solana (primary), Stellar, EVM (Ethereum, Base, Arbitrum, Polygon, Optimism)  
**Ref:** See `CROSS_CHAIN_DEPLOYMENT_CHECKLIST.md` before any testnet or mainnet rollout.

## Stage 0 - Repo Structure

- [x] Solana: confirm all five Anchor programs build cleanly with `cargo check` from repo root
- [ ] Stellar: add Soroban contract source or generated bindings to repo
- [x] EVM: run `scripts/setup_baraza_evm.sh` or otherwise add Solidity contracts and Foundry / Hardhat artifacts to repo
- [x] Create `/contracts` directory with subdirs: `solana/`, `stellar/`, `evm/`
- [ ] Add `.env.local.example` with all required keys and no real values committed

## Stage 1 - Solana Deployment

- [ ] Deploy `community_registry` to devnet; record program ID
- [ ] Deploy `membership` to devnet; record program ID
- [ ] Deploy `payment_attestation` to devnet; record program ID
- [ ] Deploy `governance` to devnet; record program ID
- [ ] Deploy `treasury_vault` to devnet; record program ID
- [ ] Run `anchor test` against devnet for all five programs
- [ ] Call `payment_attestation.initialize_config`; set config PDA and trusted attester signer
- [ ] Copy generated IDLs to `src/lib/idl/`
- [ ] Set all five program IDs in `.env.local`
- [ ] **⚠️ Transfer program upgrade authority to Squads multisig after deploy**

## Stage 2 - Stellar Deployment

- [ ] Deploy Soroban contracts to Futurenet / testnet; record contract IDs
- [ ] Validate contract size is within Soroban limit
- [ ] Fund contract account with XLM for base reserves
- [ ] Record contract IDs in `.env.local`
- [ ] Add `src/lib/stellar.ts` client module for settlement, refunds, and payouts
- [ ] **⚠️ Confirm bridge (LayerZero / Wormhole) Stellar support before enabling cross-chain flows**
- [ ] **⚠️ Confirm oracle strategy for Stellar (Pyth / DIA; Chainlink not available)**

## Stage 3 - EVM Deployment

- [ ] Deploy governance contracts to each EVM testnet: Sepolia, Base Sepolia, and other supported networks
- [ ] Verify source on each block explorer
- [ ] Record addresses per network in `.env.local`
- [ ] Add `src/lib/evm.ts` client module
- [ ] **⚠️ Transfer ownership to Gnosis Safe on each chain immediately after deploy**

## Stage 4 - `useBarazaContract.ts`: Remove Preview Guards

Replace mock data one flow at a time. Do not remove a guard until the program is deployed and the IDL is present.

### 4a - Read Flows

- [ ] Wire `fetchCommunity` to `community_registry` account read
- [ ] Wire `fetchMembership` to `membership` account read
- [ ] Wire `fetchProposal` to `governance` account read
- [ ] Wire `fetchTreasury` to `treasury_vault` account read
- [ ] Remove read-path mock data from `src/lib/constants.ts` after each flow is verified

### 4b - Join Flow

- [ ] Derive membership PDA for connected wallet
- [ ] Wire `joinCommunity` instruction via `membership` program
- [ ] Confirm consumed payment attestation is validated on-chain before activation
- [ ] **⚠️ Membership asset minting needs real mint CPI path; do not mark complete until minting works**
- [ ] Remove preview guard in `useBarazaContract.ts` for join

### 4c - Vote Flow

```ts
const ix = await program.methods
  .castVote(proposalId, support)
  .accounts({ community, proposal, voter: publicKey })
  .instruction();
tx.add(ix);
```

- [ ] Import IDL and instantiate `Program` with `AnchorProvider`
- [ ] Derive `proposal` PDA from `proposalId`
- [ ] Derive `community` PDA from community slug / ID
- [ ] Wire `castVote` instruction as shown above
- [ ] **⚠️ Governance activation still uses admin-supplied eligibility snapshot; do not treat as fully decentralized until membership snapshot CPI is implemented**
- [ ] Remove preview guard for vote

### 4d - Create Proposal Flow

- [ ] Derive new proposal PDA
- [ ] Wire `createProposal` instruction via `governance` program
- [ ] Validate proposer meets proposal threshold before submitting
- [ ] Remove preview guard for create

### 4e - Payment / Treasury Flow

- [ ] Wire payment attestation submission via `payment_attestation` program
- [ ] Confirm config PDA and trusted attester signer are present before any payment call
- [ ] **⚠️ Treasury withdrawals must stay disabled until executed-proposal validation or Squads multisig control is wired**
- [ ] Wire `treasury_vault` withdrawal only after proposal execution validation is confirmed
- [ ] Remove preview guard for payment; withdrawal guard stays until treasury wiring is complete

## Stage 5 - Chain Enablement in `src/lib/chain.ts`

Enable chains one at a time, only after the UI can submit and confirm real transactions.

- [ ] Solana devnet: enable after Stage 4 read flows pass
- [ ] Solana mainnet-beta: enable after full audit and promote gate passed
- [ ] Stellar testnet: enable after `src/lib/stellar.ts` can submit and confirm real transactions
- [ ] Stellar mainnet: enable after audit and bridge/oracle strategy confirmed
- [ ] EVM testnets: enable after `src/lib/evm.ts` can submit and confirm real calls
- [ ] EVM mainnets: enable after audit and Gnosis Safe ownership confirmed on all chains

## Stage 6 - RPC Fallback (`src/lib/rpc.ts`)

- [ ] Confirm fallback order: `VITE_RPC_ENDPOINT` to `api.devnet.solana.com` to `clusterApiUrl('devnet')`
- [ ] Add mainnet fallback chain before mainnet launch
- [ ] Test `withRpcFallback` by intentionally killing the primary endpoint
- [ ] Add alerting / logging when fallback is triggered

## Stage 7 - Page-by-page Frontend Verification

Check read, write, and guard removal in that order for each page.

### Home / Landing

- [ ] Community list reads from `community_registry`, not `constants.ts`
- [ ] No write flows on this page

### Community Page

- [ ] Community details read from `community_registry`
- [ ] Member count reads from `membership` program
- [ ] Treasury balance reads from `treasury_vault`
- [ ] Join button wired after Stage 4b is complete
- [ ] Join button disabled and labelled correctly if wallet not connected via `useWalletGuard`

### Proposal List Page

- [ ] Proposals read from `governance` program, not mock data
- [ ] Proposal status derived from on-chain state, not hardcoded

### Proposal Detail Page

- [ ] Proposal detail reads from `governance` PDA
- [ ] Vote counts read from on-chain tally
- [ ] Vote button wired after Stage 4c is complete
- [ ] Vote button gated by `useWalletGuard` and eligibility snapshot check
- [ ] **⚠️ Do not show vote button as enabled until eligibility is confirmed on-chain**

### Create Proposal Page

- [ ] Form submits via `createProposal` instruction after Stage 4d is complete
- [ ] Proposal threshold validated client-side before allowing submission
- [ ] Success state shows on-chain proposal PDA address

### Treasury Page

- [ ] Balance reads from `treasury_vault`
- [ ] Withdrawal UI hidden until executed-proposal validation is wired
- [ ] Payment attestation flow visible only to eligible members

### Settings / Admin Page

- [ ] Governance parameter display reads from on-chain config
- [ ] **⚠️ Any admin write action must go through Squads multisig; no direct EOA admin calls**

## Stage 8 - Cross-chain Wiring (LayerZero / Wormhole)

- [ ] Bridge choice finalized per chain pair
- [ ] Trusted remote / peer addresses set on every chain
- [ ] Replay protection confirmed with nonces / domain separators
- [ ] Relayer funded on all chains
- [ ] Cross-chain proposal execution tested end-to-end on testnet
- [ ] **⚠️ Stellar bridge support confirmed with LayerZero / Wormhole team before enabling**

## Stage 9 - Promote Gate: Testnet to Mainnet

- [ ] All Stage 4-8 checks passed on testnet
- [ ] All five Anchor programs audited; critical / high findings remediated
- [ ] EVM and Stellar contracts audited
- [ ] Bug bounty program live
- [ ] Squads multisig signers tested a real proposal execution on devnet
- [ ] Gnosis Safe signers tested on each EVM testnet
- [ ] Emergency pause tested on all chains
- [ ] Rollback plan documented
- [ ] Monitoring configured: OpenZeppelin Defender / Tenderly for EVM; custom alerts for Solana
- [ ] Incident response runbook updated with all contract addresses

## Deployment Readiness Verdict

**NOT READY**

Blocking items:

1. External audit not started
2. Write flows still behind preview guards
3. Membership mint CPI path not implemented
4. Treasury withdrawal guard not removable until proposal execution validation is wired
5. Stellar oracle and bridge support unconfirmed
6. Squads multisig not yet controlling program upgrade authority
