# Bounty Payout Contract Specification

Status: Draft v0.1  
Target: Stellar Soroban testnet  
Primary asset: Circle USDC  
Source contract: `contracts/stellar/treasury_vault`

## 1. Objective

Extend the existing community treasury vault so approved bounty work can produce a multisig-controlled
USDC payout. Work approval creates a payout proposal; it never transfers funds directly. The contract
transfers funds only after the configured signer threshold is reached.

The contract is the authorization and settlement record. Supabase remains the operational ledger and
indexes contract events for search, reconciliation, notifications, and public receipts.

## 2. Scope

The MVP supports:

- One vault contract per community and payout asset.
- Circle USDC as the first settlement asset.
- Automated proposal creation by a restricted coordinator account.
- Community multisig approval with unique signer counting.
- Permissionless execution after the approval threshold.
- Payout expiry, cancellation, pause, and replay protection.
- Signer and threshold rotation through multisig authorization.
- Public contract events for reconciliation and receipts.

The MVP does not support:

- Automatic payment from a single work-approval click.
- BRZA or a new Baraza-issued token.
- Cross-chain swaps or bridges.
- Fiat conversion inside the contract.
- Private contributor or work-submission data on-chain.
- G$ represented as a stablecoin.

## 3. Roles

| Role | Authority |
|---|---|
| Coordinator | Creates a payout proposal from an approved off-chain payout record. Cannot move funds. |
| Signer | Approves or revokes approval before execution. |
| Executor | Calls execution after threshold. May be any account or a Baraza relayer. |
| Emergency signer set | Pauses, unpauses, cancels, or changes configuration through threshold approval. |
| Indexer | Reads events and verifies final settlement. Has no contract authority. |

The coordinator must not count as a signer unless the community explicitly assigns the same address to
both roles. Production should use separate addresses.

## 4. Contract State

### Config

```rust
pub struct Config {
    pub community_id_hash: BytesN<32>,
    pub asset: Address,
    pub coordinator: Address,
    pub signers: Vec<Address>,
    pub threshold: u32,
    pub paused: bool,
    pub config_nonce: u64,
}
```

### Payout

```rust
pub struct Payout {
    pub payout_ref: BytesN<32>,
    pub bounty_ref: BytesN<32>,
    pub recipient: Address,
    pub amount: i128,
    pub memo_hash: BytesN<32>,
    pub approvals: Vec<Address>,
    pub status: PayoutStatus,
    pub created_at: u64,
    pub expires_at: u64,
    pub executed_at: Option<u64>,
}
```

```rust
pub enum PayoutStatus {
    AwaitingApproval,
    Ready,
    Executed,
    Cancelled,
    Expired,
}
```

`payout_ref` is the SHA-256 hash of the server payout ID. `bounty_ref` is the hash of the bounty ID.
No names, phone numbers, email addresses, work URLs, or review notes are stored on-chain.

## 5. Public Interface

```rust
initialize(
    community_id_hash: BytesN<32>,
    asset: Address,
    coordinator: Address,
    signers: Vec<Address>,
    threshold: u32,
)

propose_payout(
    coordinator: Address,
    payout_ref: BytesN<32>,
    bounty_ref: BytesN<32>,
    recipient: Address,
    amount: i128,
    memo_hash: BytesN<32>,
    expires_at: u64,
)

approve_payout(signer: Address, payout_ref: BytesN<32>)
revoke_approval(signer: Address, payout_ref: BytesN<32>)
execute_payout(payout_ref: BytesN<32>)
cancel_payout(signer: Address, payout_ref: BytesN<32>)
mark_expired(payout_ref: BytesN<32>)

propose_config_change(
    signer: Address,
    change_ref: BytesN<32>,
    next_coordinator: Address,
    next_signers: Vec<Address>,
    next_threshold: u32,
)

approve_config_change(signer: Address, change_ref: BytesN<32>)
execute_config_change(change_ref: BytesN<32>)

propose_pause(signer: Address, action_ref: BytesN<32>, paused: bool)
approve_pause(signer: Address, action_ref: BytesN<32>)
execute_pause(action_ref: BytesN<32>)

deposit(from: Address, amount: i128)
balance() -> i128
get_config() -> Config
get_payout(payout_ref: BytesN<32>) -> Option<Payout>
```

Configuration changes and pause actions use the same threshold discipline as payouts. No single admin
address can replace signers, lower the threshold, or enable transfers.

## 6. Payout Lifecycle

```text
Contributor submits work and wallet
  -> Community reviewer approves work
  -> Server creates bounty_payouts row with idempotency key
  -> Coordinator calls propose_payout with hashed references
  -> Contract emits payout_proposed
  -> Signers call approve_payout
  -> Contract marks Ready when threshold is reached
  -> Relayer or any account calls execute_payout
  -> Contract checks status, expiry, pause, balance, and reference uniqueness
  -> Contract transfers USDC to recipient
  -> Contract marks Executed before external token transfer
  -> Contract emits payout_executed
  -> Indexer verifies event and token movement
  -> API marks bounty payout Paid and publishes receipt
```

The contract follows checks-effects-interactions: validate, mark executed, persist, then call the token
contract. Soroban transaction atomicity rolls back state if the token transfer fails.

## 7. Required Validation

`initialize` must reject:

- Empty, duplicate, or more than 20 signers.
- Threshold zero or above signer count.
- Coordinator equal to the vault contract address.
- Reinitialization.

`propose_payout` must reject:

- Unauthorized coordinator.
- Duplicate `payout_ref`, including executed or cancelled references.
- Non-positive amount.
- Empty recipient.
- Expiry at or before the current ledger timestamp.
- Expiry beyond the configured maximum lifetime.
- Proposals while paused.

`approve_payout` must reject:

- Non-signers.
- Duplicate approvals.
- Executed, cancelled, or expired payouts.
- Approval after expiry.

`execute_payout` must reject:

- Paused vaults.
- Approval count below threshold.
- Expired, executed, or cancelled payouts.
- Insufficient vault balance.
- Asset mismatch.

## 8. Events

| Event | Fields |
|---|---|
| `payout_proposed` | payout reference, bounty reference, recipient, amount, expiry |
| `payout_approved` | payout reference, signer, approval count, threshold |
| `approval_revoked` | payout reference, signer, approval count |
| `payout_ready` | payout reference, approval count |
| `payout_executed` | payout reference, bounty reference, recipient, amount, asset |
| `payout_cancelled` | payout reference, action reference |
| `payout_expired` | payout reference |
| `config_changed` | change reference, config nonce, threshold |
| `pause_changed` | action reference, paused state |
| `deposit` | sender, amount, asset |

Events never contain private profile or submission data.

## 9. Off-Chain Integration

The payout coordinator API maps database state to contract state:

| Supabase | Contract |
|---|---|
| `awaiting_approval` | payout proposed |
| `ready` | signer threshold reached |
| `processing` | execution submitted |
| `paid` | execution event and token transfer verified |
| `failed` | submission or reconciliation failed; contract state remains authoritative |
| `cancelled` | cancellation confirmed |

The API must never mark a payout paid from a submitted transaction alone. It verifies:

- Contract address and network.
- `payout_ref` and `bounty_ref`.
- Asset contract is the configured Circle USDC asset.
- Recipient and amount match the database record.
- Execution succeeded and reached finality.
- The matching `payout_executed` event exists.

## 10. Stable Asset Policy

- USDC is the default and first deployed vault asset.
- The verified Circle asset contract address is supplied at deployment and recorded in the deployment manifest.
- USDT requires a separate supported-rail deployment and security review.
- G$ requires a separate vault and must be labeled as a non-stable community asset.
- A vault never changes its payout asset through an ordinary payout proposal.

## 11. Security Requirements

- External audit before mainnet funding.
- Testnet signer rotation, pause, cancellation, expiry, and recovery exercises.
- Contract TTL bumping for config, payouts, and action records.
- Maximum payout amount or daily limit approved before mainnet.
- No coordinator private key in the browser or repository.
- No community signer key held by Baraza.
- Idempotent coordinator jobs and event reconciliation.
- Alert on coordinator changes, threshold reductions, signer removal, failed execution, and low balance.

## 12. Required Tests

1. Full proposal, threshold approval, and USDC transfer.
2. Duplicate payout reference rejected before and after execution.
3. Duplicate signer approval rejected.
4. Non-signer approval rejected.
5. Unauthorized coordinator rejected.
6. Execution below threshold rejected.
7. Execution while paused rejected.
8. Expired payout rejected and markable as expired.
9. Cancelled payout cannot execute.
10. Insufficient balance rolls back the execution state.
11. Token transfer failure rolls back the execution state.
12. Signer rotation requires the old threshold.
13. Threshold cannot become zero or exceed signer count.
14. Pause and unpause require threshold approval.
15. Public events contain no private contributor data.
16. Fuzz tests cover amount, threshold, signer count, expiry, and repeated execution boundaries.

## 13. Deployment Gates

Implementation status: the contract extension and focused unit tests are complete locally. It has not
been deployed, funded, independently audited, or connected to the production coordinator.

1. Implement as an extension of `contracts/stellar/treasury_vault`. **Complete locally.**
2. Generate and review the contract WASM hash.
3. Deploy a new testnet contract; do not mutate recorded deployed addresses.
4. Record contract and Circle USDC asset addresses in the deployment manifest.
5. Initialize a 2-of-3 test community signer set with a separate coordinator.
6. Fund with testnet USDC and execute the full bounty flow.
7. Verify Supabase reconciliation and the public receipt.
8. Run independent security review and resolve all critical/high findings.
9. Repeat with real community-controlled test signers.
10. Approve a capped mainnet pilot before depositing production USDC.

## 14. Definition of Done

- Work approval creates one idempotent payout proposal.
- No payout occurs before the multisig threshold.
- USDC reaches the exact approved recipient and amount.
- The same payout reference can never execute twice.
- Paid status appears only after verified final settlement.
- Community signers can pause, cancel, and rotate authority without Baraza custody.
- The public receipt is verifiable and contains no private identity data.
