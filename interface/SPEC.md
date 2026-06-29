# Baraza Module Interface (chain-agnostic)

Every chain adapter implements these operations with identical observable
behavior. The community experience is the same on every chain; only the
implementation differs. The Stellar reference in `contracts/stellar` is canonical
where any ambiguity exists.

## Modules

Standard core (every community): Community Registry, Membership, Governance and
Proposals, Voting, Treasury (multisig), Contribution Tracking, basic reporting.
Type-unlocked or opt-in: Reputation, Token, Season Artifact, Asset Ownership,
Credit Flow (license-gated).

## Operations

`createCommunity(config) -> communityId`
  Registers a community with its governance and treasury configuration.
  Effect: a new community exists with the caller as initial admin.
  Emits: `CommunityCreated`.

`addMember(communityId, account, role)`
  Pre: caller authorized per community config.
  Effect: account is a member with the given role. `isMember` becomes true.
  Emits: `MemberAdded`.

`removeMember(communityId, account)`
  Pre: caller authorized.
  Effect: account is no longer a member.
  Emits: `MemberRemoved`.

`createProposal(communityId, proposal) -> proposalId`
  Pre: caller is a member.
  Effect: a proposal opens for voting per config.
  Emits: `ProposalCreated`.

`vote(communityId, proposalId, choice)`
  Pre: caller is a member, proposal open, caller has not already voted.
  Effect: vote recorded; tally updated.
  Emits: `VoteCast`.

`recordContribution(communityId, account, amount, ref)`
  Records a member contribution. Non-custodial: this records the contribution,
  it does not move money.
  Emits: `ContributionRecorded`.

`transferTreasury(communityId, to, amount)`
  Pre: an executed proposal authorizes the transfer; multisig threshold met.
  Effect: treasury transfer executes per the community multisig.
  Emits: `TreasuryTransferred`.

`mintSeasonArtifact(communityId, account, season)`
  Opt-in (fundraising). Records a voluntary season buy-in. The artifact is
  participation/access only, never an investment with a promised return.
  Emits: `SeasonArtifactMinted`.

`resolveAssetOwnership(communityId, season)`
  Opt-in. When the treasury goal threshold for a season is met, ownership of the
  season's shared assets resolves to that season's beneficiaries.
  Pre: threshold met.
  Emits: `AssetOwnershipResolved`.

## Reads

- `isMember(communityId, account) -> bool`
- `getProposal(communityId, proposalId) -> proposal`
- `getTreasury(communityId) -> balance/config`
- `getContribution(communityId, account) -> history`

## Behavior tests an adapter must pass

- A non-member cannot create a proposal or vote.
- A member cannot vote twice on one proposal.
- A treasury transfer fails unless an authorizing proposal passed and the
  multisig threshold is met.
- `recordContribution` never moves funds; it only records.
- `resolveAssetOwnership` fails before the threshold and succeeds at or after it.
- Every state-changing operation emits its event.
- All invariants hold identically to the Stellar reference.
