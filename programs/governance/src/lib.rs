//! Baraza governance program.
//!
//! Implements the proposal state machine, vote receipt accounts, and timelock
//! described in app/docs/MVP_ARCHITECTURE.md sections 6.2-6.4.
//!
//! Scope (MVP):
//!   - Initialize per-community governance config.
//!   - Create / activate / cancel / finalize / queue / execute / expire / veto proposals.
//!   - Cast vote receipts with atomic double-vote prevention via PDA seeds.
//!
//! Out of scope here (handled by sibling programs via CPI):
//!   - MemberAccount voting-weight snapshot reads (membership program).
//!   - Treasury release execution (treasury_vault program).
//!   - Payment attestation consumption (payment_attestation program).

use anchor_lang::prelude::*;

declare_id!("DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A");

pub const MEMBERSHIP_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    30, 147, 47, 230, 187, 54, 1, 75, 4, 119, 91, 36, 81, 222, 32, 243, 226, 244, 69, 60, 91,
    134, 195, 150, 88, 30, 91, 60, 90, 21, 102, 190,
]);
pub const MEMBER_ACCOUNT_DISCRIMINATOR: [u8; 8] = [173, 25, 100, 97, 192, 177, 84, 139];

#[program]
pub mod governance {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        params: InitializeConfigParams,
    ) -> Result<()> {
        params.validate()?;
        let cfg = &mut ctx.accounts.config;
        cfg.community = ctx.accounts.community.key();
        cfg.voting_delay_slots = params.voting_delay_slots;
        cfg.voting_period_slots = params.voting_period_slots;
        cfg.timelock_delay_slots = params.timelock_delay_slots;
        cfg.grace_period_slots = params.grace_period_slots;
        cfg.quorum_bps = params.quorum_bps;
        cfg.approval_threshold_bps = params.approval_threshold_bps;
        cfg.proposal_threshold_weight = params.proposal_threshold_weight;
        cfg.vetoer_authority = params.vetoer_authority;
        cfg.admin_authority = ctx.accounts.admin.key();
        cfg.paused = false;
        cfg.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        kind: ProposalKind,
        metadata_uri: String,
    ) -> Result<()> {
        require!(!ctx.accounts.config.paused, GovError::ProgramPaused);
        require!(
            metadata_uri.len() <= MAX_METADATA_URI_LEN,
            GovError::MetadataUriTooLong
        );
        if let ProposalKind::TreasuryRelease { amount, .. } = &kind {
            require!(*amount > 0, GovError::InvalidProposalPayload);
        }

        let cfg = &ctx.accounts.config;
        let now = Clock::get()?.slot;

        let creator_member = load_member_account(&ctx.accounts.creator_member)?;
        require!(creator_member.status == MembershipStatus::Active, GovError::MemberNotActive);
        require!(
            creator_member.community == ctx.accounts.community.key()
                && creator_member.wallet_address == ctx.accounts.creator.key(),
            GovError::MemberMismatch
        );
        require!(
            creator_member.voting_weight >= cfg.proposal_threshold_weight,
            GovError::ProposalThresholdNotMet
        );

        let prop = &mut ctx.accounts.proposal;
        prop.community = ctx.accounts.community.key();
        prop.proposal_id = proposal_id;
        prop.creator_member = ctx.accounts.creator_member.key();
        prop.kind = kind;
        prop.metadata_uri = metadata_uri;
        prop.status = ProposalStatus::Pending;
        prop.created_at_slot = now;
        prop.voting_starts_at_slot = now.saturating_add(cfg.voting_delay_slots);
        prop.voting_ends_at_slot = prop
            .voting_starts_at_slot
            .saturating_add(cfg.voting_period_slots);
        prop.snapshot_slot = prop.voting_starts_at_slot;
        prop.eligible_member_count = 0;
        prop.eligible_voting_weight = 0;
        prop.quorum_required = 0;
        prop.for_weight = 0;
        prop.against_weight = 0;
        prop.abstain_weight = 0;
        prop.voter_count = 0;
        prop.eta_slot = None;
        prop.executed_at_slot = None;
        prop.canceled_at_slot = None;
        prop.vetoed_at_slot = None;
        prop.bump = ctx.bumps.proposal;

        emit!(ProposalCreated {
            proposal: prop.key(),
            community: prop.community,
            proposer: prop.creator_member,
            voting_starts_at_slot: prop.voting_starts_at_slot,
            voting_ends_at_slot: prop.voting_ends_at_slot,
        });
        Ok(())
    }

    /// Admin-triggered snapshot placeholder. The membership program is the
    /// source of truth for `total_eligible_weight` / `total_eligible_members`;
    /// both are passed in by the admin and should be validated via CPI in a
    /// future revision.
    pub fn activate_proposal(
        ctx: Context<ActivateProposal>,
        total_eligible_weight: u64,
        total_eligible_members: u32,
    ) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let prop = &mut ctx.accounts.proposal;
        require!(
            prop.status == ProposalStatus::Pending,
            GovError::InvalidStateTransition
        );
        let now = Clock::get()?.slot;
        require!(now >= prop.voting_starts_at_slot, GovError::TooEarly);

        require!(total_eligible_weight >= 1, GovError::ParamOutOfBounds);
        prop.eligible_voting_weight = total_eligible_weight;
        prop.eligible_member_count = total_eligible_members;
        prop.quorum_required = bps_of(total_eligible_weight, cfg.quorum_bps)?.max(1);
        prop.status = ProposalStatus::Active;

        emit!(ProposalActivated {
            proposal: prop.key(),
            eligible_voting_weight: total_eligible_weight,
            quorum_required: prop.quorum_required,
        });
        Ok(())
    }

    pub fn cast_vote(
        ctx: Context<CastVote>,
        support: VoteSupport,
        reason_uri: Option<String>,
    ) -> Result<()> {
        if let Some(ref uri) = reason_uri {
            require!(
                uri.len() <= MAX_METADATA_URI_LEN,
                GovError::MetadataUriTooLong
            );
        }

        let voter_member = load_member_account(&ctx.accounts.voter_member)?;
        let weight = voter_member.voting_weight;
        require!(weight > 0, GovError::ZeroWeightVote);

        let prop = &mut ctx.accounts.proposal;
        require!(voter_member.status == MembershipStatus::Active, GovError::MemberNotActive);
        require!(
            voter_member.community == prop.community
                && voter_member.wallet_address == ctx.accounts.voter.key(),
            GovError::MemberMismatch
        );
        require!(
            prop.status == ProposalStatus::Active,
            GovError::ProposalNotActive
        );
        let now = Clock::get()?.slot;
        require!(
            now >= prop.voting_starts_at_slot && now < prop.voting_ends_at_slot,
            GovError::OutsideVotingWindow
        );

        let receipt = &mut ctx.accounts.receipt;
        receipt.proposal = prop.key();
        receipt.voter_member = ctx.accounts.voter_member.key();
        receipt.voter_wallet = ctx.accounts.voter.key();
        receipt.support = support;
        receipt.weight = weight;
        receipt.cast_at_slot = now;
        receipt.reason_uri = reason_uri;
        receipt.bump = ctx.bumps.receipt;

        match support {
            VoteSupport::For => prop.for_weight = prop.for_weight.saturating_add(weight),
            VoteSupport::Against => {
                prop.against_weight = prop.against_weight.saturating_add(weight)
            }
            VoteSupport::Abstain => {
                prop.abstain_weight = prop.abstain_weight.saturating_add(weight)
            }
        }
        prop.voter_count = prop.voter_count.saturating_add(1);

        emit!(VoteCast {
            proposal: prop.key(),
            voter: receipt.voter_member,
            support,
            weight,
        });
        Ok(())
    }

    /// Permissionless. After `voting_ends_at_slot`, transitions Active to either
    /// Defeated or Succeeded based on quorum + majority. Abstain weight counts
    /// toward quorum participation but is excluded from the majority denominator.
    pub fn finalize_proposal(ctx: Context<MutateProposal>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let prop = &mut ctx.accounts.proposal;
        require!(
            prop.status == ProposalStatus::Active,
            GovError::InvalidStateTransition
        );
        let now = Clock::get()?.slot;
        require!(now >= prop.voting_ends_at_slot, GovError::TooEarly);

        let participation = prop
            .for_weight
            .saturating_add(prop.against_weight)
            .saturating_add(prop.abstain_weight);
        let approval_basis = prop.for_weight.saturating_add(prop.against_weight);

        let approval_bps: u64 = if approval_basis == 0 {
            0
        } else {
            ((prop.for_weight as u128)
                .saturating_mul(10_000)
                .checked_div(approval_basis as u128)
                .ok_or(GovError::Overflow)?) as u64
        };

        let quorum_met = participation >= prop.quorum_required;
        let majority_met = approval_bps >= cfg.approval_threshold_bps as u64;

        prop.status = if quorum_met && majority_met {
            ProposalStatus::Succeeded
        } else {
            ProposalStatus::Defeated
        };

        emit!(ProposalFinalized {
            proposal: prop.key(),
            status: prop.status,
            for_weight: prop.for_weight,
            against_weight: prop.against_weight,
            abstain_weight: prop.abstain_weight,
        });
        Ok(())
    }

    pub fn queue_proposal(ctx: Context<MutateProposal>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let prop = &mut ctx.accounts.proposal;
        require!(
            prop.status == ProposalStatus::Succeeded,
            GovError::InvalidStateTransition
        );
        let now = Clock::get()?.slot;
        let eta = now.saturating_add(cfg.timelock_delay_slots);
        prop.eta_slot = Some(eta);
        prop.status = ProposalStatus::Queued;

        emit!(ProposalQueued {
            proposal: prop.key(),
            eta_slot: eta,
        });
        Ok(())
    }

    /// Execution after timelock. Treasury releases require the configured
    /// treasury release authority as executor plus four remaining accounts in
    /// order: treasury program, vault, release receipt, and recipient. Text
    /// proposals remain permissionless signaling-only no-ops.
    pub fn execute_proposal<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteProposal<'info>>,
    ) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let prop = &mut ctx.accounts.proposal;
        require!(
            prop.status == ProposalStatus::Queued,
            GovError::InvalidStateTransition
        );
        let eta = prop.eta_slot.ok_or(GovError::MissingEta)?;
        let now = Clock::get()?.slot;
        require!(now >= eta, GovError::TimelockNotElapsed);
        let grace_end = eta.saturating_add(cfg.grace_period_slots);
        require!(now <= grace_end, GovError::GraceExpired);

        // TODO(cpi): dispatch remaining ProposalKind variants:
        //   RuleChange         -> self::apply_rule_change
        //   MembershipAction   -> membership::apply_action
        //   Text               -> no-op (signaling)
        // Per MVP_ARCHITECTURE §6.1 "Treasury MVP policy", on-chain execution
        // remains gated behind audit + multisig until reconciliation lands.

        prop.executed_at_slot = Some(now);
        prop.status = ProposalStatus::Executed;
        if let ProposalKind::TreasuryRelease { amount, .. } = prop.kind {
            require!(
                ctx.remaining_accounts.len() == 4,
                GovError::MissingExecutionAccounts
            );
            let treasury_program = ctx.remaining_accounts[0].clone();
            require_keys_eq!(
                treasury_program.key(),
                treasury_vault::ID,
                GovError::InvalidExecutionProgram
            );

            // Treasury validates the newly Executed state, so persist the
            // proposal before invoking it. The transaction still rolls back
            // atomically if the CPI fails.
            prop.exit(ctx.program_id)?;
            treasury_vault::cpi::release_sol(
                CpiContext::new(
                    treasury_program,
                    treasury_vault::cpi::accounts::ReleaseSol {
                        vault: ctx.remaining_accounts[1].clone(),
                        proposal: prop.to_account_info(),
                        release_receipt: ctx.remaining_accounts[2].clone(),
                        recipient: ctx.remaining_accounts[3].clone(),
                        executor: ctx.accounts.executor.to_account_info(),
                        system_program: ctx.accounts.system_program.to_account_info(),
                    },
                ),
                amount,
            )?;
        }
        emit!(ProposalExecuted {
            proposal: prop.key()
        });
        Ok(())
    }

    pub fn expire_proposal(ctx: Context<MutateProposal>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let prop = &mut ctx.accounts.proposal;
        require!(
            prop.status == ProposalStatus::Queued,
            GovError::InvalidStateTransition
        );
        let eta = prop.eta_slot.ok_or(GovError::MissingEta)?;
        let grace_end = eta.saturating_add(cfg.grace_period_slots);
        let now = Clock::get()?.slot;
        require!(now > grace_end, GovError::TooEarly);
        prop.status = ProposalStatus::Expired;
        emit!(ProposalExpired {
            proposal: prop.key()
        });
        Ok(())
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let prop = &mut ctx.accounts.proposal;
        require!(
            matches!(
                prop.status,
                ProposalStatus::Pending | ProposalStatus::Active
            ),
            GovError::InvalidStateTransition
        );

        let signer = ctx.accounts.canceler.key();
        let is_admin = signer == cfg.admin_authority;
        let creator_member = load_member_account(&ctx.accounts.creator_member)?;
        let is_proposer_in_pending = prop.status == ProposalStatus::Pending
            && ctx.accounts.creator_member.key() == prop.creator_member
            && creator_member.wallet_address == signer;
        require!(is_admin || is_proposer_in_pending, GovError::Unauthorized);

        prop.canceled_at_slot = Some(Clock::get()?.slot);
        prop.status = ProposalStatus::Canceled;
        emit!(ProposalCanceled {
            proposal: prop.key()
        });
        Ok(())
    }

    pub fn veto_proposal(ctx: Context<VetoProposal>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let prop = &mut ctx.accounts.proposal;
        let vetoer = cfg.vetoer_authority.ok_or(GovError::VetoNotConfigured)?;
        require!(ctx.accounts.vetoer.key() == vetoer, GovError::Unauthorized);
        require!(
            !matches!(
                prop.status,
                ProposalStatus::Executed
                    | ProposalStatus::Expired
                    | ProposalStatus::Defeated
                    | ProposalStatus::Canceled
                    | ProposalStatus::Vetoed
            ),
            GovError::InvalidStateTransition
        );

        prop.vetoed_at_slot = Some(Clock::get()?.slot);
        prop.status = ProposalStatus::Vetoed;
        emit!(ProposalVetoed {
            proposal: prop.key()
        });
        Ok(())
    }
}

// ─────────────────────── Constants ───────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MembershipStatus {
    Pending,
    Active,
    Suspended,
    Revoked,
    Expired,
    Migrated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MemberAccount {
    pub member_id_hash: [u8; 32],
    pub community: Pubkey,
    pub user_id_hash: [u8; 32],
    pub wallet_address: Pubkey,
    pub tier: Pubkey,
    pub status: MembershipStatus,
    pub voting_weight: u64,
    pub joined_at_slot: u64,
    pub activated_at_slot: Option<u64>,
    pub expires_at_slot: Option<u64>,
    pub revoked_at_slot: Option<u64>,
    pub migrated_from_member: Option<Pubkey>,
    pub migrated_to_member: Option<Pubkey>,
    pub membership_mint: Option<Pubkey>,
    pub membership_token_account: Option<Pubkey>,
    pub payment_order_id_hash: [u8; 32],
    pub metadata_uri: String,
    pub bump: u8,
}

fn load_member_account(account: &UncheckedAccount) -> Result<MemberAccount> {
    require_keys_eq!(
        *account.owner,
        MEMBERSHIP_PROGRAM_ID,
        GovError::MemberMismatch
    );

    let data = account.try_borrow_data()?;
    require!(
        data.len() >= 8 && data[..8] == MEMBER_ACCOUNT_DISCRIMINATOR,
        GovError::MemberMismatch
    );
    let mut member_bytes: &[u8] = &data[8..];
    Ok(MemberAccount::deserialize(&mut member_bytes)?)
}

pub const MAX_METADATA_URI_LEN: usize = 256;

// Slot defaults (target ~0.4s/slot, 216_000 slots/day). See MVP_ARCHITECTURE §6.3.
pub const DEFAULT_VOTING_DELAY_SLOTS: u64 = 54_000; // 6h
pub const DEFAULT_VOTING_PERIOD_SLOTS: u64 = 648_000; // 3d
pub const DEFAULT_TIMELOCK_DELAY_SLOTS: u64 = 216_000; // 1d
pub const DEFAULT_GRACE_PERIOD_SLOTS: u64 = 1_512_000; // 7d

pub const MIN_VOTING_PERIOD_SLOTS: u64 = 108_000; // 12h
pub const MAX_VOTING_PERIOD_SLOTS: u64 = 6_480_000; // 30d
pub const MAX_VOTING_DELAY_SLOTS: u64 = 432_000; // 2d
pub const MAX_TIMELOCK_DELAY_SLOTS: u64 = 1_512_000; // 7d
pub const MIN_GRACE_PERIOD_SLOTS: u64 = 216_000; // 1d
pub const MAX_GRACE_PERIOD_SLOTS: u64 = 6_480_000; // 30d

pub const MIN_QUORUM_BPS: u16 = 500; // 5%
pub const MAX_BPS: u16 = 10_000;
pub const MIN_APPROVAL_BPS: u16 = 5_001; // strict majority

// ─────────────────────── Accounts ───────────────────────

#[account]
pub struct CommunityConfigAccount {
    pub community: Pubkey,
    pub voting_delay_slots: u64,
    pub voting_period_slots: u64,
    pub timelock_delay_slots: u64,
    pub grace_period_slots: u64,
    pub quorum_bps: u16,
    pub approval_threshold_bps: u16,
    pub proposal_threshold_weight: u64,
    pub vetoer_authority: Option<Pubkey>,
    pub admin_authority: Pubkey,
    pub paused: bool,
    pub bump: u8,
}

impl CommunityConfigAccount {
    // 32 + 8*4 + 2*2 + 8 + (1+32) + 32 + 1 + 1
    pub const SIZE: usize = 143;
}

#[account]
pub struct ProposalAccount {
    pub community: Pubkey,
    pub proposal_id: u64,
    pub creator_member: Pubkey,
    pub kind: ProposalKind,
    pub metadata_uri: String,

    pub status: ProposalStatus,
    pub created_at_slot: u64,
    pub voting_starts_at_slot: u64,
    pub voting_ends_at_slot: u64,
    pub eta_slot: Option<u64>,
    pub executed_at_slot: Option<u64>,
    pub canceled_at_slot: Option<u64>,
    pub vetoed_at_slot: Option<u64>,

    pub snapshot_slot: u64,
    pub eligible_member_count: u32,
    pub eligible_voting_weight: u64,
    pub quorum_required: u64,

    pub for_weight: u64,
    pub against_weight: u64,
    pub abstain_weight: u64,
    pub voter_count: u32,

    pub bump: u8,
}

impl ProposalAccount {
    // Worst-case sizing assumes ProposalKind::TreasuryRelease (74-byte payload)
    // and metadata_uri at MAX_METADATA_URI_LEN. Slight over-allocation is fine.
    pub const SIZE: usize = 32   // community
        + 8                       // proposal_id
        + 32                      // creator_member
        + (1 + 74)                // ProposalKind tag + worst-case payload
        + (4 + MAX_METADATA_URI_LEN) // metadata_uri (length prefix + bytes)
        + 1                       // status
        + 8 * 3                   // created_at + voting_starts + voting_ends
        + (1 + 8) * 4             // four Option<u64>
        + 8                       // snapshot_slot
        + 4 + 8 + 8               // eligible_member_count + weight + quorum_required
        + 8 * 3 + 4               // tallies + voter_count
        + 1; // bump
}

#[account]
pub struct VoteReceiptAccount {
    pub proposal: Pubkey,
    pub voter_member: Pubkey,
    pub voter_wallet: Pubkey,
    pub support: VoteSupport,
    pub weight: u64,
    pub cast_at_slot: u64,
    pub reason_uri: Option<String>,
    pub bump: u8,
}

impl VoteReceiptAccount {
    pub const SIZE: usize = 32 * 3 + 1 + 8 + 8 + (1 + 4 + MAX_METADATA_URI_LEN) + 1;
}

// ─────────────────────── Enums ───────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ProposalStatus {
    Pending,
    Active,
    Defeated,
    Succeeded,
    Queued,
    Executed,
    Expired,
    Canceled,
    Vetoed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum VoteSupport {
    Against,
    For,
    Abstain,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum ProposalKind {
    TreasuryRelease {
        recipient: Pubkey,
        amount: u64,
        token_mint: Option<Pubkey>,
        purpose_tag: u8,
    },
    RuleChange {
        target_field: ConfigField,
        new_value_raw: [u8; 32],
    },
    MembershipAction {
        target_member: Pubkey,
        action: MemberActionKind,
    },
    Text,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ConfigField {
    VotingDelay,
    VotingPeriod,
    TimelockDelay,
    GracePeriod,
    QuorumBps,
    ApprovalThresholdBps,
    ProposalThresholdWeight,
    VetoerAuthority,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MemberActionKind {
    Suspend,
    Reinstate,
    Revoke,
}

// ─────────────────────── Params ───────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeConfigParams {
    pub voting_delay_slots: u64,
    pub voting_period_slots: u64,
    pub timelock_delay_slots: u64,
    pub grace_period_slots: u64,
    pub quorum_bps: u16,
    pub approval_threshold_bps: u16,
    pub proposal_threshold_weight: u64,
    pub vetoer_authority: Option<Pubkey>,
}

impl InitializeConfigParams {
    pub fn validate(&self) -> Result<()> {
        require!(
            self.voting_delay_slots <= MAX_VOTING_DELAY_SLOTS,
            GovError::ParamOutOfBounds
        );
        require!(
            self.voting_period_slots >= MIN_VOTING_PERIOD_SLOTS
                && self.voting_period_slots <= MAX_VOTING_PERIOD_SLOTS,
            GovError::ParamOutOfBounds
        );
        require!(
            self.timelock_delay_slots <= MAX_TIMELOCK_DELAY_SLOTS,
            GovError::ParamOutOfBounds
        );
        require!(
            self.grace_period_slots >= MIN_GRACE_PERIOD_SLOTS
                && self.grace_period_slots <= MAX_GRACE_PERIOD_SLOTS,
            GovError::ParamOutOfBounds
        );
        require!(
            self.quorum_bps >= MIN_QUORUM_BPS && self.quorum_bps <= MAX_BPS,
            GovError::ParamOutOfBounds
        );
        require!(
            self.approval_threshold_bps >= MIN_APPROVAL_BPS
                && self.approval_threshold_bps <= MAX_BPS,
            GovError::ParamOutOfBounds
        );
        require!(
            self.proposal_threshold_weight >= 1,
            GovError::ParamOutOfBounds
        );
        Ok(())
    }
}

// ─────────────────────── Contexts ───────────────────────

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    /// CHECK: community PDA owned by community_registry program. The config PDA
    /// is derived from this key; later CPI hardens the trust boundary.
    pub community: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + CommunityConfigAccount::SIZE,
        seeds = [b"config", community.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, CommunityConfigAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    /// CHECK: community PDA; validated via config.community match
    pub community: UncheckedAccount<'info>,

    #[account(
        seeds = [b"config", community.key().as_ref()],
        bump = config.bump,
        constraint = config.community == community.key() @ GovError::CommunityMismatch,
    )]
    pub config: Account<'info, CommunityConfigAccount>,

    /// CHECK: manually validates owner, discriminator, and serialized fields.
    pub creator_member: UncheckedAccount<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + ProposalAccount::SIZE,
        seeds = [b"proposal", community.key().as_ref(), &proposal_id.to_le_bytes()],
        bump,
    )]
    pub proposal: Account<'info, ProposalAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MutateProposal<'info> {
    #[account(
        seeds = [b"config", proposal.community.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, CommunityConfigAccount>,

    #[account(mut)]
    pub proposal: Account<'info, ProposalAccount>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(
        seeds = [b"config", proposal.community.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, CommunityConfigAccount>,

    #[account(mut)]
    pub proposal: Account<'info, ProposalAccount>,

    #[account(mut)]
    pub executor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateProposal<'info> {
    #[account(
        seeds = [b"config", proposal.community.as_ref()],
        bump = config.bump,
        constraint = config.admin_authority == admin.key() @ GovError::Unauthorized,
    )]
    pub config: Account<'info, CommunityConfigAccount>,

    #[account(mut)]
    pub proposal: Account<'info, ProposalAccount>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, ProposalAccount>,

    /// CHECK: manually validates owner, discriminator, and serialized fields.
    pub voter_member: UncheckedAccount<'info>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteReceiptAccount::SIZE,
        seeds = [b"vote", proposal.key().as_ref(), voter_member.key().as_ref()],
        bump,
    )]
    pub receipt: Account<'info, VoteReceiptAccount>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        seeds = [b"config", proposal.community.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, CommunityConfigAccount>,

    #[account(mut)]
    pub proposal: Account<'info, ProposalAccount>,

    #[account(
        constraint = creator_member.key() == proposal.creator_member @ GovError::MemberMismatch,
    )]
    /// CHECK: manually validates owner, discriminator, and serialized fields.
    pub creator_member: UncheckedAccount<'info>,

    pub canceler: Signer<'info>,
}

#[derive(Accounts)]
pub struct VetoProposal<'info> {
    #[account(
        seeds = [b"config", proposal.community.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, CommunityConfigAccount>,

    #[account(mut)]
    pub proposal: Account<'info, ProposalAccount>,

    pub vetoer: Signer<'info>,
}

// ─────────────────────── Events ───────────────────────

#[event]
pub struct ProposalCreated {
    pub proposal: Pubkey,
    pub community: Pubkey,
    pub proposer: Pubkey,
    pub voting_starts_at_slot: u64,
    pub voting_ends_at_slot: u64,
}

#[event]
pub struct ProposalActivated {
    pub proposal: Pubkey,
    pub eligible_voting_weight: u64,
    pub quorum_required: u64,
}

#[event]
pub struct VoteCast {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub support: VoteSupport,
    pub weight: u64,
}

#[event]
pub struct ProposalFinalized {
    pub proposal: Pubkey,
    pub status: ProposalStatus,
    pub for_weight: u64,
    pub against_weight: u64,
    pub abstain_weight: u64,
}

#[event]
pub struct ProposalQueued {
    pub proposal: Pubkey,
    pub eta_slot: u64,
}

#[event]
pub struct ProposalExecuted {
    pub proposal: Pubkey,
}

#[event]
pub struct ProposalExpired {
    pub proposal: Pubkey,
}

#[event]
pub struct ProposalCanceled {
    pub proposal: Pubkey,
}

#[event]
pub struct ProposalVetoed {
    pub proposal: Pubkey,
}

// ─────────────────────── Errors ───────────────────────

#[error_code]
pub enum GovError {
    #[msg("Program is paused")]
    ProgramPaused,
    #[msg("Metadata URI exceeds maximum length")]
    MetadataUriTooLong,
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Invalid state transition for current proposal status")]
    InvalidStateTransition,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Action attempted outside the voting window")]
    OutsideVotingWindow,
    #[msg("Action attempted before required slot")]
    TooEarly,
    #[msg("Timelock has not elapsed")]
    TimelockNotElapsed,
    #[msg("Grace period has expired")]
    GraceExpired,
    #[msg("Proposal is missing ETA (queue first)")]
    MissingEta,
    #[msg("Vetoer authority is not configured for this community")]
    VetoNotConfigured,
    #[msg("Community key does not match config")]
    CommunityMismatch,
    #[msg("Parameter is out of allowed bounds")]
    ParamOutOfBounds,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Vote weight must be greater than zero")]
    ZeroWeightVote,
    #[msg("Proposal payload is invalid for its kind")]
    InvalidProposalPayload,
    #[msg("Member is not active")]
    MemberNotActive,
    #[msg("Member account does not match this community or signer")]
    MemberMismatch,
    #[msg("Proposal threshold not met")]
    ProposalThresholdNotMet,
    #[msg("Treasury execution requires treasury program, vault, release receipt, and recipient accounts")]
    MissingExecutionAccounts,
    #[msg("Execution target program does not match the proposal action")]
    InvalidExecutionProgram,
}

// ─────────────────────── Helpers ───────────────────────

fn bps_of(amount: u64, bps: u16) -> Result<u64> {
    Ok(((amount as u128)
        .saturating_mul(bps as u128)
        .checked_div(10_000)
        .ok_or(GovError::Overflow)?) as u64)
}
