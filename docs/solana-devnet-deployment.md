# Solana Devnet Deployment & Smoke Test

This document records the devnet deployment of Baraza's five Anchor programs:
program IDs, explorer links, deploy transaction signatures, a reproducible
smoke-test command, and troubleshooting notes for common failures.

> **Maintainer note:** Replace every `<FILL_IN_...>` placeholder below with
> the real value captured at deploy time (from `anchor deploy` / `solana
> program show` output). Keep this file in sync whenever a program is
> redeployed to devnet.

## Cluster

- **Network:** Solana Devnet
- **RPC endpoint:** `https://api.devnet.solana.com`
- **Explorer cluster query param:** `?cluster=devnet`

## Programs

| # | Program | Program ID | Explorer Link | Deploy Tx Signature |
|---|---------|-------------|----------------|----------------------|
| 1 | community-registry | `<FILL_IN_PROGRAM_ID_1>` | https://explorer.solana.com/address/`<FILL_IN_PROGRAM_ID_1>`?cluster=devnet | `<FILL_IN_DEPLOY_TX_1>` |
| 2 | payment-orders | `<FILL_IN_PROGRAM_ID_2>` | https://explorer.solana.com/address/`<FILL_IN_PROGRAM_ID_2>`?cluster=devnet | `<FILL_IN_DEPLOY_TX_2>` |
| 3 | dues-streak | `<FILL_IN_PROGRAM_ID_3>` | https://explorer.solana.com/address/`<FILL_IN_PROGRAM_ID_3>`?cluster=devnet | `<FILL_IN_DEPLOY_TX_3>` |
| 4 | season-artifact | `<FILL_IN_PROGRAM_ID_4>` | https://explorer.solana.com/address/`<FILL_IN_PROGRAM_ID_4>`?cluster=devnet | `<FILL_IN_DEPLOY_TX_4>` |
| 5 | identity-link | `<FILL_IN_PROGRAM_ID_5>` | https://explorer.solana.com/address/`<FILL_IN_PROGRAM_ID_5>`?cluster=devnet | `<FILL_IN_DEPLOY_TX_5>` |

Each deploy transaction signature can also be inspected directly at:

```
https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

## Reproducing the Deployment

From the Anchor workspace root:

```bash
# 1. Point the CLI/config at devnet
solana config set --url https://api.devnet.solana.com

# 2. Ensure the deploy keypair has enough SOL (airdrop is rate-limited;
#    retry with backoff if it 429s)
solana airdrop 2

# 3. Build all programs
anchor build

# 4. Deploy all programs to devnet
anchor deploy --provider.cluster devnet

# 5. Confirm each program landed and capture its deploy signature
solana program show <PROGRAM_ID> --url https://api.devnet.solana.com
```

Record the `Program Id` and the transaction signature printed by `anchor
deploy` (or found via `solana confirm -v <SIGNATURE>`) into the table above.

## Smoke Test

The smoke test exercises the full happy path end-to-end against devnet: it
creates a community, submits a payment order, and mints the resulting season
artifact, then verifies the on-chain state matches expectations.

### Command

```bash
# From the Anchor workspace root, with ANCHOR_PROVIDER_URL/WALLET pointed at devnet
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
  anchor run smoke-test -- --cluster devnet
```

If a dedicated `anchor run` script is not configured, the equivalent can be
run via the test harness directly:

```bash
yarn test:e2e:devnet
```

### Expected Result

```
<FILL_IN_SMOKE_TEST_OUTPUT>

✔ community-registry: community created (tx <sig>)
✔ payment-orders: dues payment submitted (tx <sig>)
✔ dues-streak: streak counter incremented
✔ season-artifact: artifact minted (tx <sig>)
✔ identity-link: wallet linked to identity claim

All 5 programs smoke-tested successfully on devnet.
```

Re-running the same command should be idempotent for read checks (program
state lookups) but will create new on-chain accounts/transactions for the
write steps — expect new transaction signatures on each run.

## Troubleshooting

- **`Error: insufficient funds for rent`** — the deploy or test wallet ran
  out of devnet SOL. Run `solana airdrop 2` again; devnet airdrops are
  rate-limited per IP/wallet, so wait ~30s and retry, or use
  `https://faucet.solana.com` as a fallback.
- **`AccountDidNotDeserialize` / IDL mismatch** — the deployed program's
  on-chain account layout no longer matches the local IDL. Re-run
  `anchor build && anchor deploy --provider.cluster devnet` for the affected
  program, or `anchor idl upgrade` if only the IDL changed.
- **`429 Too Many Requests` from the public devnet RPC** — the public
  `api.devnet.solana.com` endpoint is heavily rate-limited. Add retry/backoff
  around RPC calls in the smoke test, or point `ANCHOR_PROVIDER_URL` at a
  private devnet RPC provider.
- **`Program ID mismatch` when deploying** — the `declare_id!()` in the
  program source no longer matches the keypair in `target/deploy/*.json`.
  Regenerate the ID with `anchor keys sync` (or update `declare_id!()`
  manually), rebuild, then redeploy.
- **Deploy succeeds but smoke test can't find the program** — confirm the
  smoke-test script's expected program ID env vars (e.g.
  `COMMUNITY_REGISTRY_PROGRAM_ID`) were updated to match the freshly
  deployed ID; stale IDs are the most common cause of "account not found"
  errors right after a redeploy.
- **Explorer shows "Program not found"** — devnet occasionally lags behind
  the RPC node used for deploy; wait a few seconds and refresh, or check the
  transaction directly via its signature rather than the program address
  page.
