# Stellar Contracts (Soroban)

Soroban prototypes for Baraza protocol primitives. **Not yet on the live rail** —
production XLM settlement currently uses Stellar G-accounts + Horizon verification
+ Kotani onramp reconciliation via the Vercel API routes under `app/api/stellar/`.
Promoting any of these crates to production requires updating
`app/src/lib/knowledgeGraph.ts` and wiring the contract calls into the relevant
adapter under `app/src/lib/adapters/`.

## Crates

| Crate | Purpose |
|---|---|
| `community_registry` | Owner-gated registry of community metadata + admin pointer |
| `membership` | Per-community member set with join / leave / kick + count |
| `governance` | Proposals, voting (1-member-1-vote), finalize, mark_executed, cancel |
| `payment_attestation` | Admin-attested off-chain payment receipts indexed by Stellar tx hash |
| `treasury_vault` | M-of-N multisig vault holding a Soroban token (BRZA or native XLM) |

## Build & test

```bash
# from contracts/stellar/
cargo test --workspace
cargo build --release --target wasm32-unknown-unknown
```

Current status: **21 tests passing across 5 crates** (2026-06-17).
`cargo test --workspace` is the gate before promoting any crate to mainnet.

## Cross-contract topology

```
governance ──(is_member)──▶ membership
treasury_vault ──(token::transfer)──▶ <token contract>   # BRZA or XLM SAC
```

`community_registry` is currently a pure data store — neither governance nor
membership reads from it. The `Registry` field stored in `membership` at
`initialize` is reserved for future cross-contract membership-vs-registry
consistency checks.

## Known gaps before promotion

- **`treasury_vault.execute()` is permissionless after threshold approvals.** Any
  address can trigger payout once N-of-M signers have approved. This is the
  intended timelock-style pattern (signers gate the *decision*, anyone can pay
  the gas to *execute*), but the contract has no time delay between final
  approval and execution. Add a `min_execution_delay` if community policy needs
  one.
- **`governance` cross-contract call to `membership`** panics if `membership` is
  uninitialized or returns a non-bool. Validate the membership contract address
  at `initialize` (cheap probe call) before allowing `create_proposal`.
- **`community_registry` is wired into `membership.initialize` but never read.**
  Either consume the registry in `membership.join` (require `registry.get(id)`
  to exist) or drop the field.
- **`payment_attestation` uses `tx_hash` uniqueness as its only replay defense.**
  Caller-side hash validation in `app/api/stellar/verify-payment.ts` must stay
  the source of truth; the contract trusts whatever the admin attests.
- **No deployment / build scripts in `scripts/`.** Adding crates to the live rail
  requires writing a Stellar CLI deploy script and recording network-pinned
  contract IDs in `app/src/lib/chains/config.ts`.

## Proposal status semantics

`ProposalStatus::Tied` is distinct from `Failed`. A proposal whose `for_votes`
equals `against_votes` at the deadline finalizes to `Tied` (terminal — cannot be
executed, cannot be re-voted). Strict majority is required to `Pass`. Callers
must surface `Tied` to the UI rather than treating it as rejection — a deadlock
is not the same outcome as a clear "no".

## Token semantics

`treasury_vault` accepts any Soroban token address at `initialize`. For BRZA
treasuries pass the BRZA Stellar Asset Contract ID. For native XLM treasuries
pass the native SAC. The contract makes no BRZA-specific assumptions; callers
choose the asset and live with the consequences (XLM has reserve overhead, BRZA
does not).

## Out of scope

- Bridging (Allbridge or otherwise) — handled off-chain.
- BRZA issuance / distribution — handled by the off-chain mint pipeline under
  `app/api/cron/promote-orders.ts`.
- Vesting math — lives in `app/src/lib/brza/constants.ts`, not on-chain yet.
