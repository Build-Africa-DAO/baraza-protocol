# Feature-to-Chain Host Matrix

**Classification: INTERNAL**

`hosted` means repository code implements the feature on that chain.
`not_hosted` means an explicit product decision assigns it elsewhere.
`unverified` means code evidence is absent or incomplete. Deployment readiness
is assessed separately; `hosted` does not mean deployed or green-lit.

## Evidence keys

| Key | Evidence |
|---|---|
| S1 | Stellar governance counts one authorized member vote once: `contracts/stellar/governance/src/lib.rs:130-166`; duplicate-vote key is `:58` |
| S2 | Stellar proposal create/persistence: `contracts/stellar/governance/src/lib.rs:88-127` |
| S3 | Stellar proposal stores and returns title/description: `contracts/stellar/governance/src/lib.rs:38-49`, `:264-265` |
| S4 | Stellar configurable multisig and tested 2-of-3: `contracts/stellar/treasury_vault/src/lib.rs:45-71`, `:272-289` |
| B1 | Builder token is ERC-721 with one vote per token: `contracts/evm/src/lib/token/ERC721Votes.sol:10-15`, `:308-320` |
| B2 | Governor reads historical token votes: `contracts/evm/src/governance/governor/Governor.sol:298-319`, `:489-494` |
| B3 | Governor proposal method exists: `contracts/evm/src/governance/governor/Governor.sol:128-178` |
| B4 | Auction mints an NFT, transfers it to the buyer, and sends proceeds to Treasury: `contracts/evm/src/auction/Auction.sol:262-296` |
| N1 | Solana proposal creation stores only `metadata_uri`: `programs/governance/src/lib.rs:51-90` |
| N2 | Solana proposal account fetch exists: `app/src/lib/programs/client.ts:103-105` |
| N3 | Solana MemberAccount carries configurable voting weight: `programs/governance/src/lib.rs:69-79`, `:430-444` |

## Launch and inherited chains

| Feature | Stellar | Base | Solana | Ethereum | Optimism | Zora |
|---|---|---|---|---|---|---|
| One-member-one-vote | hosted [S1] | unverified | not_hosted | unverified | unverified | unverified |
| Token-weighted voting | unverified | hosted [B1,B2] | unverified [N3] | hosted [B1,B2] | hosted [B1,B2] | hosted [B1,B2] |
| NFT membership | unverified | hosted [B1] | unverified | hosted [B1] | hosted [B1] | hosted [B1] |
| NFT-weighted voting | unverified | hosted [B1,B2] | unverified | hosted [B1,B2] | hosted [B1,B2] | hosted [B1,B2] |
| Soulbound membership | unverified | unverified | unverified | unverified | unverified | unverified |
| Committee governance | unverified | unverified | unverified | unverified | unverified | unverified |
| Proposal creation | hosted [S2] | hosted [B3] | hosted [N1] | hosted [B3] | hosted [B3] | hosted [B3] |
| Proposal body read | hosted [S3] | unverified | unverified [N1,N2] | unverified | unverified | unverified |
| Multisig treasury | hosted [S4] | unverified | unverified | unverified | unverified | unverified |
| Milestone payouts | unverified | unverified | unverified | unverified | unverified | unverified |
| Recurring contributions | unverified | unverified | unverified | unverified | unverified | unverified |
| Mobile-money payout | unverified | not_hosted | unverified | not_hosted | not_hosted | not_hosted |
| Phone-number onboarding | unverified | unverified | unverified | unverified | unverified | unverified |
| NFT fundraising sale | not_hosted | hosted [B4] | unverified | hosted [B4] | hosted [B4] | hosted [B4] |
| Ticketing | not_hosted | not_hosted | unverified | not_hosted | not_hosted | not_hosted |
| Loyalty and rewards | unverified | unverified | unverified | unverified | unverified | unverified |
| Shared asset ownership | unverified | unverified | unverified | unverified | unverified | unverified |
| Officer roles and elections | unverified | unverified | unverified | unverified | unverified | unverified |
| Guarantor admission | unverified | unverified | unverified | unverified | unverified | unverified |
| Welfare payouts | unverified | unverified | unverified | unverified | unverified | unverified |
| Delayed exit settlement | unverified | unverified | unverified | unverified | unverified | unverified |

Base one-member-one-vote is a decided launch requirement, but it remains
`unverified` until one of the custom implementations scoped in
`BASE-ONE-MEMBER-ONE-VOTE-SCOPE.md` exists with tests.

Builder NFT ownership is marked hosted as current code behavior, not endorsed
domain modeling. `app/src/lib/adapters/evm.ts:70-91` currently equates a
positive token balance with membership; that is a known conflict with the
three-axis product decision.

## Future and research chains

No chain-specific implementation was found for Arbitrum, Polygon, Avalanche,
Hedera, BNB Chain, Sui, Aptos, XRPL, Cosmos, Polkadot, Internet Computer, or
Celo. Every feature cell for each of those chains is `unverified`. Registry or
UI labels are not feature implementations.

## Features with no verified host

The following have no `hosted` cell: soulbound membership, committee
governance, milestone payouts, recurring contributions, mobile-money payout,
phone-number onboarding, ticketing, loyalty and rewards, shared asset
ownership, officer roles and elections, guarantor admission, welfare payouts,
and delayed exit settlement.

These are genuine implementation gaps. Scope documents or UI copy must not be
used to mark them hosted.

## UI defects

- `app/src/pages/CreateCommunity.tsx:285-287` accepts a requested chain and
  otherwise defaults to Solana.
- Generic presets, including SACCO and welfare, are defined at
  `CreateCommunity.tsx:168-248` and applied without a feature-host
  intersection at `:289-302`.
- The flow can therefore present a community preset on a chain whose required
  features are `unverified` or `not_hosted`. This violates the decided
  feature-to-chain lock.

## Founding-template intersection

The required ROSCA, ASCA, SACCO-style, and Welfare society templates are not
encoded as four chain-aware template definitions:

- ROSCA and ASCA appear only as community-type labels in
  `app/src/lib/constants.ts:116-117`.
- The create page has generic savings, SACCO, and welfare presets, but they
  contain quorum, approval threshold, voting period, and treasury policy only
  (`app/src/pages/CreateCommunity.tsx:168-248`).
- No preset defines a governance-model default, allowed governance-model list,
  or supported-chain intersection.

| Template | Encoded default | Stellar option list | Base option list | Solana option list |
|---|---|---|---|---|
| ROSCA | unverified | unverified | unverified | unverified |
| ASCA | unverified | unverified | unverified | unverified |
| SACCO-style | unverified | unverified | unverified | unverified |
| Welfare society | unverified | unverified | unverified | unverified |

The lists cannot be populated without inventing each template's allowed-model
set. SACCO-style is not hard-locked to one-member-one-vote in current code; its
generic preset sets numeric thresholds only (`CreateCommunity.tsx:192-199`).
The maintainer's SACCO compliance choice remains open and no lock was changed.

## Pass 2 requirements

1. Define each template's default and allowed governance models.
2. Intersect template allowances with this evidence-backed host matrix.
3. Exclude non-hosted options rather than disabling or substituting them.
4. Add tests proving empty/single-option behavior and preventing deployment of
   an unsupported combination.
