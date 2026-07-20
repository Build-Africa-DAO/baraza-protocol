# Solana devnet deployment & smoke test

Bounty: [#26 — Document the Solana devnet deployment and smoke test](https://github.com/Build-Africa-DAO/baraza-protocol/issues/26)

This note records **localnet program IDs** from `Anchor.toml`, the path to publish them on **devnet**, explorer links, and a repeatable smoke test. Replace placeholders once a funded deploy key signs the five programs on devnet.

## Programs (five Anchor crates)

| Program | Crate path | ID (from `Anchor.toml` / localnet) |
| --- | --- | --- |
| Community registry | `programs/community_registry` | `Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD` |
| Governance | `programs/governance` | `DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A` |
| Membership | `programs/membership` | `34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK` |
| Payment attestation | `programs/payment_attestation` | `Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT` |
| Treasury vault | `programs/treasury_vault` | `ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy` |

> **Note:** The IDs above are the workspace keys used for localnet. After `anchor deploy --provider.cluster devnet`, update this table and `[programs.devnet]` in `Anchor.toml` if keypairs rotate.

## Explorer links (devnet)

For each program id `P`:

```
https://explorer.solana.com/address/<P>?cluster=devnet
```

Examples (localnet IDs — valid once the same keys are deployed to devnet):

- [community_registry](https://explorer.solana.com/address/Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD?cluster=devnet)
- [governance](https://explorer.solana.com/address/DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A?cluster=devnet)
- [membership](https://explorer.solana.com/address/34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK?cluster=devnet)
- [payment_attestation](https://explorer.solana.com/address/Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT?cluster=devnet)
- [treasury_vault](https://explorer.solana.com/address/ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy?cluster=devnet)

Deploy **transaction signatures** should be pasted here after each `solana program deploy` / `anchor deploy` run:

| Program | Deploy tx signature | Date (UTC) |
| --- | --- | --- |
| community_registry | _pending first devnet deploy_ | — |
| governance | _pending first devnet deploy_ | — |
| membership | _pending first devnet deploy_ | — |
| payment_attestation | _pending first devnet deploy_ | — |
| treasury_vault | _pending first devnet deploy_ | — |

## Prerequisites

```bash
# Toolchain
solana --version    # 1.18+ recommended
anchor --version    # matching Anchor.toml
rustc --version

# Devnet wallet with SOL
solana config set --url https://api.devnet.solana.com
solana airdrop 2
solana balance
```

## Deploy (repeatable)

From repo root:

```bash
# 1) Build all workspace programs
anchor build

# 2) Point provider at devnet (or pass flags)
# Edit Anchor.toml [provider] cluster = "devnet" temporarily, or:
anchor deploy --provider.cluster devnet

# 3) Record program IDs from deploy output / target/deploy/*-keypair.json
solana address -k target/deploy/community_registry-keypair.json
# ...repeat for each program...

# 4) Optional: verify on-chain
solana program show <PROGRAM_ID> --url devnet
```

## Smoke test (contracts)

Package scripts (repo root `package.json`):

```bash
npm run test:contracts:smoke
# or, Anchor native:
anchor test --skip-local-validator   # when a local validator is already up
# local full cycle:
anchor test
```

Minimal manual smoke after devnet deploy:

```bash
# Confirm each program is executable on devnet
for id in \
  Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD \
  DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A \
  34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK \
  Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT \
  ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy
do
  echo "=== $id ==="
  solana program show "$id" --url devnet || echo "not deployed yet"
done
```

Expected result when live: each `Program Id` shows `Authority`, `Last Deployed In Slot`, and executable data length > 0.

## Smoke test (app + payments path)

See also root [`DEPLOY.md`](../DEPLOY.md) for Supabase/Vercel. After contracts are on devnet:

1. Set `VITE_SOLANA_NETWORK=devnet` and optional private RPC.
2. Open production/preview URL → `/communities`.
3. Create or open a seed community; confirm wallet balance reads from devnet.
4. Run membership / payment attestation flow against the deployed program IDs (not localnet-only mocks).

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Attempt to load program failed` | Program id not on cluster | Redeploy; update client IDL/program id constants |
| `Insufficient funds for fee` | Empty deploy wallet | `solana airdrop 2` (rate-limited) or use a faucet |
| IDL mismatch at runtime | Client built against old IDL | `anchor build` + regenerate client types / copy IDL |
| `Blockhash not found` | Stale RPC / wrong cluster | Confirm `solana config get` URL is devnet |
| Local tests pass, devnet fails | Feature flags / `declare_id!` mismatch | Ensure `declare_id!` matches keypair used on devnet |
| Explorer 404 on address | Never deployed to devnet | Deploy first; localnet IDs are not automatic on devnet |

## Related

- `Anchor.toml` — program ids and workspace members
- `DEPLOY.md` — full stack (Supabase, Vercel, Stellar, M-Pesa)
- `tests/anchor-smoke.mjs` — scripted smoke entry (`test:contracts:smoke`)
