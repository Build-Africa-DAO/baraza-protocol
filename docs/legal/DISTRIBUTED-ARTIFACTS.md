# Distributed Artifacts

Status: factual extraction for counsel. This document identifies present and
technically available notice locations. It does not determine whether a notice
is required or sufficient.

The provenance categories below refer to
`docs/legal/FILE-PROVENANCE.md`. The current EVM subtree contains 45
`upstream_unmodified` files and 113 `upstream_modified` files.

## Artifact inventory

| Artifact | Current or intended state | Upstream-derived content | Current notice location | Technically available notice locations |
|---|---|---|---|---|
| Public repository source and Git source archives | Current. The repository visibility check is recorded as `PUBLIC` in `docs/audits/PUBLICATION-REDACTION-REPORT.md:5-8`. | Contains every tracked EVM source, test, script, address, and support file classified in the provenance list. | Root `LICENSE`; `contracts/evm/LICENSE.md`; `contracts/evm/package.json:13`; per-file SPDX and provenance comments enumerated in the provenance list. | Root notice file, subtree notice file, per-file headers, repository README, and release/source-archive notes. |
| EVM npm package `@barazaoss/baraza-protocol` | Intended, not observed as published. The manifest is `private: false` at `contracts/evm/package.json:2-4`; the npm registry returned `E404` for the package on 2026-07-24. | The prepublish script builds contracts and copies `src` and `addresses` into `dist` at `contracts/evm/package.json:37-39`. Those inputs include both provenance categories. | A local `npm pack --dry-run --ignore-scripts` includes `LICENSE.md`, `README.md`, `package.json`, and generated `dist/artifacts`. `package.json:13` contains a license field. The dry run did not execute the source-copying prepublish script. | Package-root LICENSE or NOTICE files, package metadata, README, per-file headers in copied source, and notice fields/files adjacent to generated artifacts. |
| Forge contract artifact JSON | Current local build output and intended npm-package content. Foundry writes to `dist/artifacts` at `contracts/evm/foundry.toml:1-8`; the package build and file allowlist reference that directory at `contracts/evm/package.json:9-11,37-39`. | ABI and bytecode are compiled from `upstream_modified` contract files and imported dependencies. Artifact metadata lists source paths and source-level SPDX identifiers. | Artifact JSON contains ABI, bytecode, deployed bytecode, source maps, and compiler metadata. For example, the generated `Auction.json` metadata records `BUSL-1.1` for `src/auction/Auction.sol`; it does not contain the directory copyright and permission text as a standalone notice. When packed, `LICENSE.md` is adjacent at package root. | Additional JSON fields, an adjacent NOTICE file, package-root LICENSE/NOTICE files, artifact-index metadata, and release notes. |
| Standalone ABI data | Current in source and local build output. Full ABIs are fields in Forge artifact JSON; curated app-facing ABIs begin at `app/src/lib/evm/abis.ts:1-4` and are exported as a set at `app/src/lib/evm/abis.ts:6693-6699`. | The curated ABI shapes are generated from the EVM artifacts according to `app/src/lib/evm/abis.ts:1-2`; they contain interface descriptions but no Solidity source or bytecode. | No copyright or permission notice appears in `app/src/lib/evm/abis.ts`. The Forge package has the adjacent notice locations described above. | Header comments in standalone ABI source, adjacent LICENSE/NOTICE files, package metadata, generated-file manifests, and API documentation. |
| Frontend source package | Current as repository source. The app manifest is private at `app/package.json:1-4`, so repository evidence does not describe an npm publication path for the app. | The frontend source includes the curated EVM ABIs and EVM clients. `app/src/lib/evm/manager.ts:12-14` imports the Manager ABI. It does not copy the Solidity subtree into the frontend source directory. | Root `LICENSE`. No separate notice was found in `app/src/lib/evm/abis.ts`. | Root or app-level LICENSE/NOTICE, generated-file header, application documentation, and an about/legal page. |
| Production frontend bundle | Current local build artifact and intended web-delivery artifact. `vite build` is the app build command at `app/package.json:6-15`; chunking is configured at `app/vite.config.ts:16-72`. | The JavaScript bundle contains the curated ABI data and client code reached from the app. It does not contain the EVM Solidity source files or deployable EVM bytecode. | No MIT permission text, EVM subtree copyright line, or Solidity SPDX header was found in the generated `app/dist` JavaScript files inspected on 2026-07-24. | A bundled notice asset, generated banner, source-map companion, application legal/about route, deployment manifest, or documentation linked from the delivered application. |
| Deployed EVM contract creation/runtime bytecode | Intended, not evidenced as a Baraza deployment. Deployment and verification commands are defined at `contracts/evm/package.json:41-47`. The application records Base and Base Sepolia as `NOT_DEPLOYED` at `app/src/lib/evm/manager.ts:16-29`, and the tracked EVM address table contains placeholders at `app/src/lib/programs/evmAddresses.ts:40-59`. | Would be compiled from `upstream_modified` contracts and linked/imported code. Runtime bytecode is not a source-file container. Solidity compiler metadata may append a metadata reference to bytecode. | No conventional location exists inside deployed on-chain bytecode for a human-readable copyright or permission notice. No Baraza EVM deployment record was found to inspect. | Block-explorer source-verification entry, comments retained in verified source, compiler metadata referenced by the bytecode, an off-chain notice referenced from project documentation, deployment records, and contract metadata URIs where a contract exposes one. These are available mechanisms only; this document does not assess them. |

## Source packages

The public Git repository and its generated source archives contain the complete
`contracts/evm/` subtree. The subtree package manifest names the package and
repository at `contracts/evm/package.json:2-8`. The subtree's current notice
declarations are not uniform:

- `contracts/evm/LICENSE.md:1-3` and
  `contracts/evm/package.json:13` state MIT.
- The 98 source, script, and test files listed in the provenance document carry
  `BUSL-1.1` SPDX headers.
- Four source files contain additional provenance comments, identified in
  `docs/legal/FILE-PROVENANCE.md`.

This section records the locations only.

## npm package dry-run

On 2026-07-24:

- `npm view @barazaoss/baraza-protocol` returned `E404`.
- `npm pack --dry-run --ignore-scripts --json` produced a 147-entry prospective
  package containing `LICENSE.md`, `README.md`, `package.json`, and generated
  artifact JSON.
- Because scripts were disabled, that dry run did not test the
  `prepublishOnly` step that copies `src` and `addresses` into `dist`.

Repository evidence therefore establishes a publication configuration and a
prospective package shape, but not a completed npm publication.

## Compiled artifacts and ABI detail

The local Forge artifact schema includes `abi`, `bytecode`,
`deployedBytecode`, `methodIdentifiers`, `rawMetadata`, and parsed `metadata`.
The metadata records source paths, content hashes, retrieval URLs, and SPDX
license identifiers. The package build deletes files matching
`dist/artifacts/*/*.metadata.json` at `contracts/evm/package.json:37`; the main
contract artifact JSON still contains metadata fields in the inspected local
build.

The frontend's curated ABI file states that it was generated from those
artifacts at `app/src/lib/evm/abis.ts:1-2`. The browser bundle therefore carries
contract interface data, but no evidence was found that it carries the
subtree's LICENSE text or per-file source headers.

## Deployed bytecode limitation

Deployed on-chain bytecode has no conventional location for a human-readable
notice. Technically available mechanisms include:

- publishing verified source and its retained comments on a block explorer;
- retaining a compiler metadata reference in bytecode and making the referenced
  metadata available;
- publishing an off-chain notice in deployment documentation or a deployment
  registry;
- exposing or linking an off-chain metadata document where a contract interface
  provides such a field.

These are enumerated as mechanisms. No statement is made about what they
accomplish for licensing purposes.

## Evidence gaps

- No npm publication record exists for `@barazaoss/baraza-protocol`.
- No Baraza EVM deployed address or verified-source record exists in the
  inspected repository.
- Repository evidence does not enumerate every CDN, mirror, release archive, or
  privately distributed build that may exist outside the repository.
- The intended production hosting service can be inferred from configuration
  files, but the repository does not provide a complete inventory of every
  frontend bundle already served to users.
