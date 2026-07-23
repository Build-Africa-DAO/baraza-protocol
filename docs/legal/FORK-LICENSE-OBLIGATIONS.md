# Builder OSS License Extraction

**Classification: INTERNAL**

**Purpose:** factual extraction for counsel. This document does not determine
whether Baraza's planned use is permitted and is not legal advice.

## Revisions inspected

| Repository | Revision | License declaration |
|---|---|---|
| `BuilderOSS/nouns-protocol` | `ee88e32` | `LICENSE.md` and `package.json` declare MIT |
| `BuilderOSS/nouns-builder` | `ff9820c` (`staging`) | `license.md` declares MIT |
| `Build-Africa-DAO/baraza-protocol` | `5181a77` | Root `LICENSE` declares BSL 1.1; `contracts/evm/LICENSE.md` and `contracts/evm/package.json` declare MIT |

No Builder OSS file inspected declares the Business Source License. The BSL
declaration in the inspected material belongs to Baraza's repository.

## Upstream contract components

| Component | Package or contract | Declared license | Declaration source | Baraza feature dependency |
|---|---|---|---|---|
| Protocol package | `@buildeross/nouns-protocol` | MIT | `nouns-protocol/LICENSE.md`; `nouns-protocol/package.json` | Base DAO deployment and all inherited contract modules |
| Deployer | `Manager` | MIT | `nouns-protocol/LICENSE.md`; SPDX header in `src/manager/Manager.sol` | Deploying and registering DAO implementations |
| Membership/governance asset | `Token` | MIT, with documented BSD-3-Clause-derived voting code | `nouns-protocol/LICENSE.md`; SPDX header in `src/token/Token.sol`; provenance comment in `src/lib/token/ERC721Votes.sol` | ERC-721 issuance, checkpoints, token-weighted voting |
| Metadata | `MetadataRenderer` | MIT | `nouns-protocol/LICENSE.md`; SPDX header in `src/token/metadata/MetadataRenderer.sol` | DAO token metadata |
| Fundraising | `Auction` | MIT, with documented BSD-3-Clause and GPL-3.0 source fragments | `nouns-protocol/LICENSE.md`; SPDX header and provenance comments in `src/auction/Auction.sol` | Perpetual NFT auction and auction proceeds |
| Governance | `Governor` | MIT, with documented BSD-3-Clause-derived source | `nouns-protocol/LICENSE.md`; SPDX header and provenance comment in `src/governance/governor/Governor.sol` | Proposal lifecycle, voting, quorum, execution queueing |
| Executor | `Treasury` | MIT, with documented BSD-3-Clause-derived source | `nouns-protocol/LICENSE.md`; SPDX header and provenance comment in `src/governance/treasury/Treasury.sol` | Timelocked proposal execution and treasury custody |
| Deployment scripts | `script/*.s.sol` | UNLICENSED where an SPDX value is present | SPDX headers in the individual script files | Reference deployment and upgrade operations; not needed to run deployed contracts |
| Test utility | `test/utils/Base64URIDecoder.sol` | Apache-2.0 | SPDX header in that file | Test-only metadata decoding |

The source comments identify the upstream provenance of particular fragments.
This extraction records those notices but does not determine compatibility or
the obligations of a combined or derived work.

## Upstream application components

The following `BuilderOSS/nouns-builder` packages declare MIT in their own
`package.json` files:

| Component | Declaration source | Baraza feature dependency |
|---|---|---|
| `apps/subgraph` | `apps/subgraph/package.json` | Contract event indexing |
| `apps/web` | `apps/web/package.json` | Reference Builder web application |
| `packages/analytics` | `packages/analytics/package.json` | Analytics |
| `packages/auction-ui` | `packages/auction-ui/package.json` | Auction presentation and interaction |
| `packages/blocklist` | `packages/blocklist/package.json` | Address/content blocking support |
| `packages/candidate-ui` | `packages/candidate-ui/package.json` | Proposal candidate UI |
| `packages/constants` | `packages/constants/package.json` | Chain and application constants |
| `packages/create-dao-ui` | `packages/create-dao-ui/package.json` | DAO creation flow |
| `packages/create-proposal-ui` | `packages/create-proposal-ui/package.json` | Proposal creation flow |
| `packages/dao-ui` | `packages/dao-ui/package.json` | DAO views |
| `packages/eslint-config-custom` | `packages/eslint-config-custom/package.json` | Development tooling only |
| `packages/feed-ui` | `packages/feed-ui/package.json` | Activity feed |
| `packages/hooks` | `packages/hooks/package.json` | Contract and application hooks |
| `packages/ipfs-service` | `packages/ipfs-service/package.json` | Off-chain content publication |
| `packages/proposal-ui` | `packages/proposal-ui/package.json` | Proposal reading and voting UI |
| `packages/sdk` | `packages/sdk/package.json` | Contract client integration |
| `packages/stores` | `packages/stores/package.json` | Client state |
| `packages/swap` | `packages/swap/package.json` | Swap UI |
| `packages/tsconfig` | `packages/tsconfig/package.json` | Development tooling only |
| `packages/types` | `packages/types/package.json` | Shared application types |
| `packages/ui` | `packages/ui/package.json` | Shared UI |
| `packages/utils` | `packages/utils/package.json` | Shared utilities |
| `packages/zord` | `packages/zord/package.json` | UI primitives |

The root `nouns-builder/package.json` and
`packages/test-fixtures/package.json` do not declare a license. The repository
root `license.md` is MIT, but the license of those two package manifests cannot
be determined from their manifests alone.

## Builder OSS MIT text

Both inspected upstream repositories contain the standard MIT grant. The
operative grant and condition are:

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.

The complete upstream texts are in `nouns-protocol/LICENSE.md` and
`nouns-builder/license.md`.

## Baraza BSL parameters

The root `LICENSE` at Baraza revision `5181a77` contains these parameters:

| Parameter | Verbatim value |
|---|---|
| Licensor | `BAD DAO AFRICA LIMITED` |
| Licensed Work | `Baraza Protocol smart contracts and the module interface.` |
| Change Date | `2030-06-29 (four years from first publication; adjust to the actual first-publication date)` |
| Change License | `Apache License, Version 2.0` |

The Change Date includes an unresolved instruction to adjust it to the actual
first-publication date. The repository does not establish a final
component-specific Change Date.

### Additional Use Grant

Verbatim from the root `LICENSE`:

> You may use the Licensed Work in production solely to
> deploy, operate, and govern your own community or
> communities you directly serve, including by self-hosting.
> You may not use the Licensed Work, or a derivative of it,
> to provide a hosted or commercial product, platform,
> protocol, or service to third parties that competes with
> Baraza Protocol. Work contributed back to the project under
> the project CLA is exempt from this restriction.

### What the restriction is written to cover

The BSL text grants copying, modification, derivative works, redistribution,
and non-production use. The Additional Use Grant expressly allows specified
production operation for one's own or directly served communities, including
self-hosting, and expressly excludes using the work or a derivative to provide
a competing hosted or commercial product, platform, protocol, or service to
third parties. Counsel must determine how those words apply to Baraza's planned
operation and fee model.

## Unresolved Baraza license scope

`contracts/evm/LICENSE.md` and `contracts/evm/package.json` declare MIT, while
the root BSL defines the Licensed Work as “Baraza Protocol smart contracts and
the module interface.” The repository does not state whether the nested MIT
declaration is intended to exclude `contracts/evm` from the root BSL, replace
the root license for that subtree, or coexist with it.

Because Base features depend on the `Manager`, `Token`, `MetadataRenderer`,
`Auction`, `Governor`, and `Treasury` contracts in that subtree, the applicable
Baraza license for those features cannot be determined from the repository
without a maintainer/counsel decision.

## Counsel questions

1. Which license controls `contracts/evm`: the nested MIT declaration, the root
   BSL description of smart contracts, or both?
2. What is the actual first-publication date and therefore the final Change
   Date for each BSL-covered version?
3. Does Baraza's planned operation and 2% money-movement fee fall within the
   Additional Use Grant?
4. What obligations follow from the documented BSD-3-Clause and GPL-3.0 source
   fragments in the upstream contracts?

