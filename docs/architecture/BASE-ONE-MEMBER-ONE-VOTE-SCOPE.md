# Base One-Member-One-Vote Scope

**Classification: INTERNAL**

**Decision already made:** Base must host `one_member_one_vote`. This document
scopes the required change; it does not implement or select an approach.

## Native Builder behavior

- `Governor.castVote` reads a historical weight from `getVotes` and adds the
  full value to the selected tally
  (`contracts/evm/src/governance/governor/Governor.sol:298-319`).
- `Governor.getVotes` directly calls the configured token's
  `getPastVotes` (`Governor.sol:489-494`). The function is not declared
  `virtual`, and there is no configured strategy/cap hook.
- Proposal threshold and quorum are percentages of token supply
  (`Governor.sol:496-505`), so changing only vote casting would leave other
  token-weighted assumptions in place.
- `ERC721Votes` states that token supply is the total vote count and tokens
  self-delegate by default
  (`contracts/evm/src/lib/token/ERC721Votes.sol:10-15`).
- Public `delegate` and `delegateBySig` paths exist
  (`ERC721Votes.sol:124-174`), and transfer hooks move one vote with each NFT
  (`ERC721Votes.sol:308-320`).

**Finding:** the fork has no voting-weight override, cap, or custom strategy
configuration. Implementing a different source of voting power requires a new
Governor implementation or a modification of the existing implementation.

## Token and auction constraints

- `Token` inherits the transferable `ERC721Votes` implementation
  (`contracts/evm/src/token/Token.sol:22`).
- Minting is limited to the auction or an approved minter
  (`Token.sol:44`, `:201-211`), but no one-token-per-identity or
  non-transferability check exists.
- `Manager.deploy` always deploys Token, Metadata, Auction, Treasury, and
  Governor proxies (`contracts/evm/src/manager/Manager.sol:114-129`) and
  initializes all five (`Manager.sol:132-160`).
- Auction initializes paused (`contracts/evm/src/auction/Auction.sol:98-123`),
  so it can remain disabled operationally.
- Starting the first auction mints the first token and transfers Token
  ownership from founder to Treasury (`Auction.sol:343-362`;
  `Token.sol:106-115`). If auction never starts, that ownership handoff does
  not occur automatically.
- Auction settlement transfers the NFT to the buyer and deposits proceeds in
  Treasury (`Auction.sol:262-282`), directly conflicting with a
  non-transferable verified-member token if the same token is reused.

**Finding:** auction can remain paused without preventing Governor or Treasury
initialization, but Manager still deploys it and the Token ownership handoff
must be replaced. A fundraising auction cannot share a soulbound membership
token; fundraising and membership assets must remain separate.

## Privy identity binding

The current application has part of the required off-chain mapping:

- The canonical identity is a peppered `phone_hash`, with linked wallet
  addresses (`app/src/lib/identity/resolver.ts:19-25`).
- The resolver accepts a wallet or phone identity, resolves the common hash,
  and returns all linked wallets (`resolver.ts:42-49`, `:62-83`, `:95-115`).

This is not an on-chain eligibility registry and the resolver explicitly falls
back when Supabase is unavailable (`resolver.ts:46-59`). Base OMOV therefore
needs an authoritative contract mapping from a non-public internal identity
commitment to one active voting address, written only after Privy-backed phone
verification. Raw phone numbers must never be written on-chain.

Wallet rotation needs an atomic revoke-old/activate-new operation so two linked
wallets cannot vote as the same member in one snapshot. Proposal snapshots must
bind eligibility and the active voting address at proposal creation.

## Viable approaches

| Approach | Required changes | Advantages | Blocking tradeoffs |
|---|---|---|---|
| Cap existing token weight at one | New Governor implementation that replaces vote, threshold, and quorum weight reads; verified-member eligibility registry; delegation disabled | Preserves most Builder deployment shape | A wallet with one transferable NFT is not necessarily a verified member; token transfer and multiple linked wallets remain identity defects; still a custom Governor |
| Soulbound one-token-per-verified-member | New Token implementation enforcing non-transferability, one active token per identity, controlled mint/revoke/rotation; Governor changes to disable delegation and use member supply; separate fundraising token/auction | Token checkpoints can represent one active member | Requires custom Token and Governor; auction cannot use that token; ownership handoff and Manager initialization need modification |
| Dedicated verified-membership Governor | New membership registry and Governor variant that snapshots active verified identities directly; keep Builder Token/Auction separate for fundraising | Cleanly separates membership, voting weight, and fundraising; explicit wallet rotation and one-person cap | Largest contract change; proposal threshold/quorum and upgrade/deployment tests must be rebuilt |

## Recommendation for maintainer decision

The dedicated verified-membership Governor is the only approach that directly
models the decided three-axis separation and phone/Privy identity mapping.
The soulbound-token approach is viable only if counsel/product accept a
separate fundraising NFT and the additional custom Token work. A cap wrapper is
not recommended because it still treats possession and identity as equivalent.

This recommendation is not an implementation decision. All viable approaches
require a custom Governor variant; therefore the directive's stop condition is
met for Base one-member-one-vote.

## Required maintainer decision

⚠️ PUBLIC-FACING — NEEDS APPROVAL TO CREATE: Base OMOV architecture decision
record — select dedicated verified-membership Governor, soulbound membership
token plus separate fundraising asset, or remove Base OMOV from launch scope.

