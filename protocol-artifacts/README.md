# Protocol Artifacts

This directory is the public, versioned artifact boundary for data the app
consumes from the protocol layer.

Contents:

- `solana/idl/*.ts` — vendored TypeScript IDL definitions for the five Anchor
  programs.
- `evm/evmAddresses.ts` — deployed EVM contract addresses.
- `evm/abis.ts` — app-facing EVM ABIs.
- `interface/SPEC.md` — chain-agnostic protocol interface contract.

The app does not import these files directly at runtime. Instead, it keeps
vendored copies under `app/src/lib/...` so the private app can move to its own
repo without a filesystem dependency on this repo.

## Sync step

When any public protocol artifact changes:

1. Update the canonical public file in `protocol-artifacts/`.
2. Run `npm run protocol:artifacts:sync`.
3. Commit both the public artifact and the vendored app copy together.

CI runs `npm run protocol:artifacts:check` to ensure the public artifacts and
the app's vendored copies stay in sync.
