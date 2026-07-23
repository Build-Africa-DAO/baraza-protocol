# File Provenance

Status: factual extraction for counsel. This document does not determine which
license controls any file.

## Comparison basis

The EVM subtree first appears in Baraza commit
`cd330353809be4e47f027ddaa3e7e64d15ab7bcf` on 2026-05-24. The matching
BuilderOSS main-branch state is
`cfb42d898a2420e8d5aee9c594e66f9eaeed68ac`, merged on 2026-05-05. That
revision contains the mainnet-v2 files and values present at import. The next
BuilderOSS main commit, `ee88e32a284e275020cdad974def07d3444c2427`,
post-dates the import and adds `deploys/1.erc721_redeem_minter.txt`, which the
Baraza import does not contain.

The Baraza import commit does not record an upstream SHA in its message or
files. The revision above is therefore established from the retained import
commit, the upstream main-branch chronology, and the matching file set, not
from an embedded fork-point marker.

Method:

1. Enumerate every tracked blob under `contracts/evm/` at the current audit
   branch HEAD.
2. Compare Git blob IDs against the same relative path at upstream
   `cfb42d8`.
3. Map the two renamed paths
   `script/checkBarazaRewardsConfig.mjs` to
   `script/checkBuilderRewardsConfig.mjs` and
   `test/utils/BarazaTest.sol` to `test/utils/NounsBuilderTest.sol`.
4. Inspect textual diffs for every non-identical blob.

The package identifies the subtree and its repository at
`contracts/evm/package.json:2-13`. Its publish script copies compiled artifacts,
`src`, and `addresses` into `dist` at `contracts/evm/package.json:37-39`.

## Summary

| Classification | Count |
|---|---:|
| `upstream_unmodified` | 45 |
| `upstream_modified` | 113 |
| `original` | 0 |
| **Total tracked files** | **158** |

## `upstream_unmodified`

These blobs are byte-identical to upstream `cfb42d8`.

```text
contracts/evm/.github/workflows/test.yml
contracts/evm/.gitignore
contracts/evm/.gitmodules
contracts/evm/.prettierrc
contracts/evm/.solhint.json
contracts/evm/README.md
contracts/evm/deploys/.gitkeep
contracts/evm/deploys/1.escrow.txt
contracts/evm/deploys/1.txt
contracts/evm/deploys/1.upgradeMetadata.txt
contracts/evm/deploys/1.upgradeToken.txt
contracts/evm/deploys/1.version1_1.txt
contracts/evm/deploys/1.version2_upgrade.txt
contracts/evm/deploys/10.erc721_redeem_minter.txt
contracts/evm/deploys/10.txt
contracts/evm/deploys/10.version2_new.txt
contracts/evm/deploys/10.version2_upgrade.txt
contracts/evm/deploys/11155111.erc721_redeem_minter.txt
contracts/evm/deploys/11155111.txt
contracts/evm/deploys/11155111.version2_new.txt
contracts/evm/deploys/11155111.version2_upgrade.txt
contracts/evm/deploys/11155420.erc721_redeem_minter.txt
contracts/evm/deploys/11155420.txt
contracts/evm/deploys/11155420.version2_new.txt
contracts/evm/deploys/11155420.version2_upgrade.txt
contracts/evm/deploys/7777777.txt
contracts/evm/deploys/7777777.version2_new.txt
contracts/evm/deploys/7777777.version2_upgrade.txt
contracts/evm/deploys/8453.erc721_redeem_minter.txt
contracts/evm/deploys/8453.txt
contracts/evm/deploys/8453.version2_new.txt
contracts/evm/deploys/8453.version2_upgrade.txt
contracts/evm/deploys/84532.erc721_redeem_minter.txt
contracts/evm/deploys/84532.txt
contracts/evm/deploys/84532.version2_new.txt
contracts/evm/deploys/84532.version2_upgrade.txt
contracts/evm/deploys/999999999.txt
contracts/evm/deploys/999999999.version2_new.txt
contracts/evm/deploys/999999999.version2_upgrade.txt
contracts/evm/docs/README.md
contracts/evm/funding.json
contracts/evm/remappings.txt
contracts/evm/script/storage-check.sh
contracts/evm/slither.config.json
contracts/evm/yarn.lock
```

## `upstream_modified`

### Files with changed per-file headers

Each of these 98 files has an upstream ancestor at the same path, except for
the two renamed paths identified in the method. In each file, the upstream
`SPDX-License-Identifier: MIT` header was changed to
`SPDX-License-Identifier: BUSL-1.1` at line 1 or, for the three `.mjs` files
with a shebang, line 2. Some also contain the additional changes enumerated in
the next table.

```text
contracts/evm/script/checkBarazaRewardsConfig.mjs
contracts/evm/script/checkUpgradeStatus.mjs
contracts/evm/script/Constants.sol
contracts/evm/script/DeployERC721RedeemMinter.s.sol
contracts/evm/script/DeployMerkleReserveMinter.s.sol
contracts/evm/script/DeployNewDAO.s.sol
contracts/evm/script/DeployV2Core.s.sol
contracts/evm/script/DeployV2New.s.sol
contracts/evm/script/DeployV2Upgrade.s.sol
contracts/evm/script/GetInterfaceIds.s.sol
contracts/evm/script/networkConfig.mjs
contracts/evm/script/updateManagerOwner.mjs
contracts/evm/src/VersionedContract.sol
contracts/evm/src/auction/Auction.sol
contracts/evm/src/auction/IAuction.sol
contracts/evm/src/auction/storage/AuctionStorageV1.sol
contracts/evm/src/auction/storage/AuctionStorageV2.sol
contracts/evm/src/auction/types/AuctionTypesV1.sol
contracts/evm/src/auction/types/AuctionTypesV2.sol
contracts/evm/src/deployers/L2MigrationDeployer.sol
contracts/evm/src/deployers/interfaces/ICrossDomainMessenger.sol
contracts/evm/src/escrow/Escrow.sol
contracts/evm/src/governance/governor/Governor.sol
contracts/evm/src/governance/governor/IGovernor.sol
contracts/evm/src/governance/governor/ProposalHasher.sol
contracts/evm/src/governance/governor/storage/GovernorStorageV1.sol
contracts/evm/src/governance/governor/storage/GovernorStorageV2.sol
contracts/evm/src/governance/governor/types/GovernorTypesV1.sol
contracts/evm/src/governance/treasury/ITreasury.sol
contracts/evm/src/governance/treasury/Treasury.sol
contracts/evm/src/governance/treasury/storage/TreasuryStorageV1.sol
contracts/evm/src/governance/treasury/types/TreasuryTypesV1.sol
contracts/evm/src/lib/interfaces/IEIP712.sol
contracts/evm/src/lib/interfaces/IERC1967Upgrade.sol
contracts/evm/src/lib/interfaces/IERC721.sol
contracts/evm/src/lib/interfaces/IERC721Votes.sol
contracts/evm/src/lib/interfaces/IInitializable.sol
contracts/evm/src/lib/interfaces/IOwnable.sol
contracts/evm/src/lib/interfaces/IPausable.sol
contracts/evm/src/lib/interfaces/IProtocolRewards.sol
contracts/evm/src/lib/interfaces/IUUPS.sol
contracts/evm/src/lib/interfaces/IVersionedContract.sol
contracts/evm/src/lib/interfaces/IWETH.sol
contracts/evm/src/lib/proxy/ERC1967Proxy.sol
contracts/evm/src/lib/proxy/ERC1967Upgrade.sol
contracts/evm/src/lib/proxy/UUPS.sol
contracts/evm/src/lib/token/ERC721.sol
contracts/evm/src/lib/token/ERC721Votes.sol
contracts/evm/src/lib/utils/Address.sol
contracts/evm/src/lib/utils/EIP712.sol
contracts/evm/src/lib/utils/Initializable.sol
contracts/evm/src/lib/utils/OPAddressAliasHelper.sol
contracts/evm/src/lib/utils/Ownable.sol
contracts/evm/src/lib/utils/Pausable.sol
contracts/evm/src/lib/utils/ReentrancyGuard.sol
contracts/evm/src/lib/utils/SafeCast.sol
contracts/evm/src/lib/utils/TokenReceiver.sol
contracts/evm/src/manager/IManager.sol
contracts/evm/src/manager/Manager.sol
contracts/evm/src/manager/storage/ManagerStorageV1.sol
contracts/evm/src/manager/types/ManagerTypesV1.sol
contracts/evm/src/minters/ERC721RedeemMinter.sol
contracts/evm/src/minters/MerkleReserveMinter.sol
contracts/evm/src/token/IToken.sol
contracts/evm/src/token/Token.sol
contracts/evm/src/token/metadata/MetadataRenderer.sol
contracts/evm/src/token/metadata/interfaces/IBaseMetadata.sol
contracts/evm/src/token/metadata/interfaces/IPropertyIPFSMetadataRenderer.sol
contracts/evm/src/token/metadata/storage/MetadataRendererStorageV1.sol
contracts/evm/src/token/metadata/storage/MetadataRendererStorageV2.sol
contracts/evm/src/token/metadata/types/MetadataRendererTypesV1.sol
contracts/evm/src/token/metadata/types/MetadataRendererTypesV2.sol
contracts/evm/src/token/storage/TokenStorageV1.sol
contracts/evm/src/token/storage/TokenStorageV2.sol
contracts/evm/src/token/storage/TokenStorageV3.sol
contracts/evm/src/token/types/TokenTypesV1.sol
contracts/evm/src/token/types/TokenTypesV2.sol
contracts/evm/test/Auction.t.sol
contracts/evm/test/ERC721RedeemMinter.t.sol
contracts/evm/test/Gov.t.sol
contracts/evm/test/L2MigrationDeployer.t.sol
contracts/evm/test/Manager.t.sol
contracts/evm/test/MerkleReserveMinter.t.sol
contracts/evm/test/MetadataRenderer.t.sol
contracts/evm/test/Token.t.sol
contracts/evm/test/VersionedContractTest.t.sol
contracts/evm/test/forking/TestBid.t.sol
contracts/evm/test/forking/TestUpdateMinters.t.sol
contracts/evm/test/forking/TestUpdateOwners.t.sol
contracts/evm/test/utils/BarazaTest.sol
contracts/evm/test/utils/Base64URIDecoder.sol
contracts/evm/test/utils/mocks/MockCrossDomainMessenger.sol
contracts/evm/test/utils/mocks/MockERC1155.sol
contracts/evm/test/utils/mocks/MockERC721.sol
contracts/evm/test/utils/mocks/MockImpl.sol
contracts/evm/test/utils/mocks/MockPartialTokenImpl.sol
contracts/evm/test/utils/mocks/MockProtocolRewards.sol
contracts/evm/test/utils/mocks/WETH.sol
```

Additional content changes beyond the SPDX header:

| Current file | Upstream path | Factual change |
|---|---|---|
| `script/checkBarazaRewardsConfig.mjs` | `script/checkBuilderRewardsConfig.mjs` | File and Builder reward identifiers/messages renamed to Baraza; 11 lines added and 9 removed. |
| `script/checkUpgradeStatus.mjs` | same | Two repository-path strings changed from BuilderOSS to Build-Africa-DAO. |
| `script/Constants.sol` | same | Builder reward constant renamed to Baraza; 2 lines added and 1 removed. |
| `script/DeployERC721RedeemMinter.s.sol` | same | Builder reward constant reference renamed; 2 lines added and 1 removed. |
| `script/DeployMerkleReserveMinter.s.sol` | same | Builder reward constant reference renamed; 2 lines added and 1 removed. |
| `script/DeployNewDAO.s.sol` | same | Builder reward constant reference renamed; 2 lines added and 1 removed. |
| `script/DeployV2Core.s.sol` | same | Builder reward identifiers renamed; 3 lines added and 2 removed. |
| `script/DeployV2New.s.sol` | same | Builder reward constant reference renamed; 2 lines added and 1 removed. |
| `script/DeployV2Upgrade.s.sol` | same | Builder reward identifiers and messages renamed; 7 lines added and 6 removed. |
| `script/GetInterfaceIds.s.sol` | same | Builder naming changed to Baraza; 2 lines added and 1 removed. |
| `script/networkConfig.mjs` | same | Two repository-path strings changed. |
| `script/updateManagerOwner.mjs` | same | Two repository-path strings changed. |
| `src/auction/Auction.sol` | same | Repository/provenance text and Builder reward identifiers renamed to Baraza; 18 lines added and 17 removed. |
| `src/governance/governor/Governor.sol` | same | Repository/provenance and Builder DAO text renamed to Baraza; 4 lines added and 3 removed. |
| `src/governance/treasury/Treasury.sol` | same | Repository/provenance and Builder DAO text renamed to Baraza; 4 lines added and 3 removed. |
| `src/lib/token/ERC721Votes.sol` | same | Repository reference changed and a provenance sentence added; 3 lines added and 2 removed. |
| `src/manager/IManager.sol` | same | Builder reward symbols renamed to Baraza; 7 lines added and 6 removed. |
| `src/manager/Manager.sol` | same | Builder reward state, events, and methods renamed to Baraza; 11 lines added and 10 removed. |
| `src/minters/ERC721RedeemMinter.sol` | same | Builder reward symbols renamed to Baraza; 11 lines added and 10 removed. |
| `src/minters/MerkleReserveMinter.sol` | same | Builder reward symbols renamed to Baraza; 11 lines added and 10 removed. |
| `src/token/Token.sol` | same | Builder DAO text renamed to Baraza; 3 lines added and 2 removed. |
| `src/token/metadata/MetadataRenderer.sol` | same | Builder DAO text renamed to Baraza; 3 lines added and 2 removed. |
| `test/Auction.t.sol` | same | Shared test import/type and Builder reward names changed to Baraza; 9 lines added and 8 removed. |
| `test/ERC721RedeemMinter.t.sol` | same | Shared test import/type changed to Baraza; 4 lines added and 3 removed. |
| `test/Gov.t.sol` | same | Shared test import/type and proposal-description fixtures changed; 15 lines added and 8 removed. |
| `test/L2MigrationDeployer.t.sol` | same | Shared test import/type changed to Baraza; 4 lines added and 3 removed. |
| `test/Manager.t.sol` | same | Shared test import/type changed to Baraza; 4 lines added and 3 removed. |
| `test/MerkleReserveMinter.t.sol` | same | Shared test import/type changed to Baraza; 4 lines added and 3 removed. |
| `test/MetadataRenderer.t.sol` | same | Shared test import/type and metadata fixtures changed to Baraza; 24 lines added and 23 removed. |
| `test/Token.t.sol` | same | Shared test import/type and fixture values changed; 13 lines added and 13 removed. |
| `test/VersionedContractTest.t.sol` | same | Shared test import/type changed to Baraza; 4 lines added and 3 removed. |
| `test/forking/TestUpdateMinters.t.sol` | same | Builder reward symbols renamed and assertions added; 15 lines added and 3 removed. |
| `test/forking/TestUpdateOwners.t.sol` | same | Builder reward symbols renamed and assertions added; 14 lines added and 2 removed. |
| `test/utils/BarazaTest.sol` | `test/utils/NounsBuilderTest.sol` | File/type renamed and Builder reward fixtures renamed to Baraza; 9 lines added and 8 removed. |
| `test/utils/Base64URIDecoder.sol` | same | One non-header line added and one changed; 2 lines added and 1 removed in total. |

### Modified files without a BUSL per-file header

| File | Factual change |
|---|---|
| `contracts/evm/.github/workflows/storage.yml` | Working directory changed to `contracts/evm`; 1 line added and 1 removed. |
| `contracts/evm/.storage-layout` | Terminal newline added. |
| `contracts/evm/LICENSE.md` | Copyright line changed from Builder OSS to Baraza OSS at line 3. |
| `contracts/evm/package.json` | Package/repository names and reward-check script names changed; 4 lines added and 5 removed. |
| `contracts/evm/addresses/1.json` | Reward key renamed and all recorded addresses replaced by zero addresses; 11 lines added and 11 removed. |
| `contracts/evm/addresses/10.json` | Reward key renamed and all recorded addresses replaced by zero addresses; 15 lines added and 15 removed. |
| `contracts/evm/addresses/11155111.json` | Reward key renamed and all recorded addresses replaced by zero addresses; 13 lines added and 13 removed. |
| `contracts/evm/addresses/11155420.json` | Reward key renamed and all recorded addresses replaced by zero addresses; 15 lines added and 15 removed. |
| `contracts/evm/addresses/7777777.json` | Reward key renamed; address fields changed and six fields added; 8 lines added and 14 removed. |
| `contracts/evm/addresses/8453.json` | Reward key renamed and all recorded addresses replaced by zero addresses; 15 lines added and 15 removed. |
| `contracts/evm/addresses/84532.json` | Reward key renamed and all recorded addresses replaced by zero addresses; 15 lines added and 15 removed. |
| `contracts/evm/docs/deployment-workflows.md` | Builder naming changed to Baraza and workflow text changed; 11 lines added and 19 removed. |
| `contracts/evm/docs/mainnet-v2-upgrade-runbook.md` | Builder naming changed to Baraza and runbook steps changed; 38 lines added and 24 removed. |
| `contracts/evm/docs/manager-ownership-runbook.md` | One Builder reward identifier renamed to Baraza; 1 line added and 1 removed. |
| `contracts/evm/foundry.toml` | Output path changed to `dist/artifacts` and Base/Base Sepolia endpoint entries added; 3 lines added and 1 removed at lines 6 and 26-27. |

## `original`

None of the 158 tracked files lacks an ancestor in upstream `cfb42d8`.

## Ambiguous

No file is ambiguous between the three requested provenance categories under
the comparison method above.

The following declaration mismatch is factual and unresolved:

- `contracts/evm/LICENSE.md:1-3` and `contracts/evm/package.json:13` declare
  MIT for the directory/package.
- The 98 files listed above carry `BUSL-1.1` per-file SPDX headers.
- `contracts/evm/src/auction/Auction.sol:25-26`,
  `contracts/evm/src/governance/governor/Governor.sol:24`, and
  `contracts/evm/src/governance/treasury/Treasury.sol:21` also contain
  provenance comments naming BSD-3-Clause or GPL-3.0 source fragments.
- `contracts/evm/src/lib/token/ERC721Votes.sol:10` contains a provenance
  comment naming OpenZeppelin 4.7.3 and a BSD-3-Clause checkpointing pattern.

This document records those declarations without selecting among them.
