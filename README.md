# Baraza Protocol

Baraza Protocol is a non-custodial community governance toolkit for groups that want shared rules, shared treasury control, and clear records without making members think about wallets, gas, or chains.

This public repository is the source-available protocol layer: smart contracts, the shared module interface, adapter guidance, and architecture docs. The product frontend, onboarding compiler, AI layer, backend, and operator tooling are not part of this repo.

## What Baraza is

Baraza is a governance compiler. A community answers plain questions about how it wants to operate, and Baraza produces a working governance deployment that matches those rules.

Five principles are non-negotiable:

- Non-custodial
- Never touch payments
- The community holds any license it earns
- No loans by default
- Blockchain invisible to members

## Architecture

Baraza uses one chain-agnostic module interface with chain-specific adapters behind it.

- `contracts/stellar/` is the reference implementation in Soroban/Rust.
- `interface/` defines the observable behavior every adapter must match.
- Other chains are added as adapters that implement the same interface and pass the same behavior tests.

Stellar is the reference chain in this repo. Baraza is multichain by design, but no chain adapter is allowed to change the community experience or violate the core principles.

## Public repo scope

This repo is for the protocol layer only:

- Smart contracts and chain adapters
- The shared interface spec
- Architecture and decision records
- Contributor docs for adding new chains

Not included here:

- Product frontend
- Onboarding compiler
- AI layer
- Backend services

Those product-layer systems are proprietary and will be handled as a separate maintainer decision.

## Current status

Baraza is in transition toward the protocol-only public structure.

- Stellar Soroban contracts are present under `contracts/stellar/`.
- Interface spec and adapter behavior scaffolding live under `interface/`.
- Additional chain work exists in this repo but is not yet normalized to the target public structure.
- Product-layer code is still present here pending a maintainer-approved split.

## Repository structure

```text
contracts/
  stellar/        reference implementation (Soroban / Rust)
  evm/            adapter work in progress
interface/        chain-agnostic module interface and behavior tests
docs/             architecture, adding-a-chain guide, decision records, diagrams
```

Start with:

- [contracts/README.md](contracts/README.md)
- [interface/SPEC.md](interface/SPEC.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/adding-a-chain.md](docs/adding-a-chain.md)

## Contributing: builders on every chain

Anyone can contribute. The fastest useful contribution is implementing the shared interface for a chain you know well.

Baraza is open to contributors and closed to copycat hosted forks:

- You can read the contracts
- You can build adapters
- You can open pull requests
- You cannot use this code to run a competing hosted service in violation of the repository license

See:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CLA.md](CLA.md)
- [SECURITY.md](SECURITY.md)

## Licensing posture

The protocol layer in this repository is proposed to be released under Business Source License 1.1, with a future change date to Apache 2.0 as described in [LICENSE](LICENSE).

The license parameters and CLA text in this repo are proposed and pending counsel confirmation.
