# Forge and Anchor Verification

**Classification: INTERNAL**

## Environment

| Tool | Version | Source |
|---|---|---|
| Foundry | `forge 1.7.1` | Official Windows release binary |
| Anchor | `anchor-cli 0.32.1` | Official Windows release binary |
| Solana | `solana-cli 1.18.26`; Agave `4.1.2` also attempted | Official release archives |

The programs declare Anchor `0.30.1`. No Windows `0.30.1` Anchor binary was
available in that release, so the available `0.32.1` CLI was used and its
version-mismatch warning is part of the result.

## EVM result

Commands:

```text
npm install --ignore-scripts --package-lock=false
forge build
forge test --no-match-test 'WithAddress' -vv
```

Result:

- Build passed: 137 Solidity files compiled with Solc `0.8.16`.
- Tests passed: 11 suites, 205 passed, 0 failed, 0 skipped.
- The repository's `npm test` script deliberately excludes tests whose name
  matches `WithAddress`; therefore this result does not verify deployed-address
  metadata.
- Foundry emitted lint warnings, including timestamp use and typecasts. They did
  not fail compilation or tests.

This changes Base contract-test evidence from unverified to passing locally. It
does not satisfy deployment, adapter, proposal-read, sample, custody, or cost
criteria, so Base remains `in_preparation`.

## Solana result

Observed results:

1. `anchor build` compiled all five programs.
2. `node tests/anchor-smoke.mjs --drift-only` passed the cross-program
   constant checks.
3. A local Anchor deployment completed for all five built programs.
4. A full smoke run did not pass. The first instruction,
   `createCommunity`, failed simulation with `Attempt to load a program that
   does not exist`.

The repository contains a concrete program-ID drift:

| Program | `Anchor.toml` and `declare_id!` | Generated deployment keypair |
|---|---|---|
| community registry | `Ggj4...d7eD` | `7pS2...Ldso` |
| governance | `DzMh...q25A` | `9aFA...qXip` |
| membership | `34MQ...NtuK` | `Aa3X...U3HY` |
| payment attestation | `Az2C...GVpT` | `Dn9u...C9L3` |
| treasury vault | `ApPd...nxYy` | `C6FJ...65LRF` |

The abbreviated identifiers are public program identifiers, not credentials.
The full configured identifiers remain in `Anchor.toml`.

Two environmental limitations also prevented a clean automatic rerun:

- Agave `4.1.2` validator startup fails on Windows when creating ledger
  symlinks (`OS error 1314` / access denied).
- Solana `1.18.26` can start temporarily, but its faucet RPC fails and the
  ledger later encounters the same Windows symlink restriction.

The smoke failure is therefore not reported as a passing Anchor suite or as a
confirmed program defect. What remains unverified is actual instruction
execution across the five programs under the committed IDs. Solana remains
`in_preparation`; its readiness does not advance.

## Viable-launch impact

| Chain | Before | After | Reason |
|---|---|---|---|
| Base | `in_preparation` | `in_preparation` | Contract suite now passes, but six launch-candidate criteria remain unsupported and the adapter/proposal work is incomplete. |
| Solana | `in_preparation` | `in_preparation` | Compilation and drift checks pass, but full smoke execution does not and generated keypairs diverge from committed IDs. |

