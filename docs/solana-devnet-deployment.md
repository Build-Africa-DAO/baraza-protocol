# Solana Devnet Deployment & Smoke Test

Deployment record and reproducible smoke-test path for Baraza's five Anchor
programs. Resolves #26.

## Program IDs & explorer links

These are the **synced** program IDs after `anchor keys sync`. They are the
deterministic addresses of each program's keypair and are identical on localnet
and devnet, so the addresses below are the canonical ones the client and the
on-chain `declare_id!` are wired to.

| Program | Program ID | Explorer (devnet) |
|---------|------------|-------------------|
| `community_registry` | `5jgs47wXR92SMDzyG5LznPy95S6dohLuCKdQyCpEjTbp` | [explorer](https://explorer.solana.com/address/5jgs47wXR92SMDzyG5LznPy95S6dohLuCKdQyCpEjTbp?cluster=devnet) |
| `governance` | `5abk3TPAhghaTvyxLYGRdY7YktHGKtJvxtyUYAtMwqqi` | [explorer](https://explorer.solana.com/address/5abk3TPAhghaTvyxLYGRdY7YktHGKtJvxtyUYAtMwqqi?cluster=devnet) |
| `membership` | `ANra85R8oRawbSQu4z9yKjC8z7dcCyqeDJ5LzK4sonsa` | [explorer](https://explorer.solana.com/address/ANra85R8oRawbSQu4z9yKjC8z7dcCyqeDJ5LzK4sonsa?cluster=devnet) |
| `payment_attestation` | `CCDYCTxAHREYgowDHViefiGUpvvN16JyiBiQhTdLtqCo` | [explorer](https://explorer.solana.com/address/CCDYCTxAHREYgowDHViefiGUpvvN16JyiBiQhTdLtqCo?cluster=devnet) |
| `treasury_vault` | `BjECSjJWMAn13eVJftch45f1LNYXa95UMTRp7S77M6wS` | [explorer](https://explorer.solana.com/address/BjECSjJWMAn13eVJftch45f1LNYXa95UMTRp7S77M6wS?cluster=devnet) |

## Toolchain

| Tool | Version |
|------|---------|
| Anchor | `0.32.1` (pinned in `package-lock.json`) |
| Solana CLI | `1.18+` |
| Rust | `1.79+` |

Anchor **0.32.1 specifically** matters — see Troubleshooting.

## Reproducible deploy (devnet)

```bash
# 1. Point the CLI at devnet and fund the deploy wallet
solana config set --url https://api.devnet.solana.com
solana airdrop 2                      # repeat if the faucet rate-limits

# 2. Build and sync IDs (no-op if already synced — see Anchor.toml)
anchor build
anchor keys sync

# 3. Deploy all five programs; each prints its deploy tx signature
anchor deploy --provider.cluster devnet
```

`anchor deploy` prints one deploy signature per program. Record them here once the
devnet deploy completes:

| Program | Deploy tx signature |
|---------|---------------------|
| `community_registry` | _pending devnet deploy_ |
| `governance` | _pending devnet deploy_ |
| `membership` | _pending devnet deploy_ |
| `payment_attestation` | _pending devnet deploy_ |
| `treasury_vault` | _pending devnet deploy_ |

> **Status:** validation was run on a local validator because the public devnet
> faucet was rate-limiting at the time of writing. This matches the maintainer's
> guidance on #26 that localnet validation "gets us 90% there"; the signatures
> above are filled in on the devnet deploy once faucet funds land. The program
> IDs, client wiring, and smoke test are cluster-independent and already verified.

## Reproducible smoke test

```bash
# From repo root — spins up a local validator, deploys, and runs the suite
anchor test
```

Expected result — a green suite across all five programs:

```
  baraza
    ✔ community_registry: initializes registry
    ✔ membership: enrolls a member
    ✔ governance: creates and tallies a proposal
    ✔ treasury_vault: deposits and withdraws
    ✔ payment_attestation: attests a payment

  5 passing
```

## Troubleshooting

- **`TypeError: Cannot use 'in' operator to search for 'vec' in pubkey`** during
  `anchor test` / IDL parsing. Cause: an older globally-installed
  `@coral-xyz/anchor` (< 0.32) mis-parses the `address` field in the 0.32 IDL
  format. Fix: use the repo-pinned Anchor client — run `npm ci` (or `npm install`)
  so `@coral-xyz/anchor@0.32.1` from `package-lock.json` is used, and avoid a
  stale global `anchor` shadowing it.
- **Drifted program IDs** (`DeclaredProgramIdMismatch` / cross-program calls fail).
  Cause: the `declare_id!` in a program, its cross-program `Pubkey::new_from_array`
  constants, and the `[programs.localnet]` table in `Anchor.toml` had fallen out of
  sync. Fix: `anchor keys sync`, then rebuild. This PR brings all three back into
  agreement (see the `governance`/`membership`/`treasury_vault` byte-array
  constants).
- **Faucet rate limits** on devnet: `solana airdrop 2` repeatedly, or use the web
  faucet at <https://faucet.solana.com>, then re-run `anchor deploy`.
