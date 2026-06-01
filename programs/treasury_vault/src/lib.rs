//! Baraza treasury_vault program.
//!
//! Per-community vault that holds SOL balances. Deposits are permissionless;
//! withdrawals are gated behind:
//!   1. `vault.withdrawals_enabled` (admin emergency control, default false).
//!   2. A successful (Executed) governance TreasuryRelease proposal.
//!   3. The configured release authority signer (handoff to Squads in production).
//!   4. A one-time release receipt PDA that prevents proposal replay.
//!
//! Per MVP_ARCHITECTURE.md §6.1 Treasury MVP policy:
//!   - Deposits + balance visibility are LIVE in MVP.
//!   - Withdrawals are DISABLED until audit + Squads multisig integration.
//!     `release_sol` exists for the path but `withdrawals_enabled` defaults
//!     to false; the admin must flip it only after audit completion.
//!
//! SPL token deposits/withdrawals are out of scope for this scaffold. The
//! event-only `record_spl_deposit` exists so the off-chain indexer/audit feed
//! can reflect SPL movement, while the actual transfer is done by the caller
//! against a vault-PDA-owned ATA. A future revision adds full SPL CPI.

use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy");

pub const GOVERNANCE_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    192, 253, 191, 73, 222, 225, 12, 97, 239, 22, 209, 87, 210, 136, 24, 251, 188, 107, 10, 222,
    115, 30, 212, 117, 232, 223, 66, 215, 177, 115, 99, 149,
]);
pub const PROPOSAL_ACCOUNT_DISCRIMINATOR: [u8; 8] = [164, 190, 4, 248, 203, 124, 243, 64];

#[program]
pub mod treasury_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.community = ctx.accounts.community.key();
        vault.admin_authority = ctx.accounts.admin.key();
        vault.pending_admin = None;
        vault.release_authority = ctx.accounts.admin.key();
        vault.pending_release_authority = None;
        vault.status = VaultStatus::Active;
        vault.withdrawals_enabled = false;
        vault.total_sol_deposited = 0;
        vault.total_sol_released = 0;
        vault.deposit_count = 0;
        vault.release_count = 0;
        vault.created_at_slot = Clock::get()?.slot;
        vault.bump = ctx.bumps.vault;

        emit!(VaultInitialized {
            vault: vault.key(),
            community: vault.community,
            admin: vault.admin_authority,
        });
        Ok(())
    }

    /// Permissionless. Transfers SOL from depositor into the vault PDA.
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        require!(amount > 0, TreasuryError::InvalidAmount);
        require!(
            ctx.accounts.vault.status == VaultStatus::Active,
            TreasuryError::VaultNotActive
        );

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.total_sol_deposited = vault.total_sol_deposited.saturating_add(amount);
        vault.deposit_count = vault.deposit_count.saturating_add(1);

        emit!(SolDeposited {
            vault: vault.key(),
            depositor: ctx.accounts.depositor.key(),
            amount,
            memo_tag: 0,
        });
        Ok(())
    }

    /// Records an SPL token deposit event. The token transfer itself is
    /// performed by the caller in the same transaction (SPL token program
    /// transfer to a vault-PDA-owned ATA). This instruction just emits the
    /// audit-trail event and bumps the counter.
    ///
    /// TODO: enforce on-chain by reading the vault's ATA balance before/after.
    pub fn record_spl_deposit(
        ctx: Context<RecordSplDeposit>,
        token_mint: Pubkey,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, TreasuryError::InvalidAmount);
        require!(
            ctx.accounts.vault.status == VaultStatus::Active,
            TreasuryError::VaultNotActive
        );
        let vault = &mut ctx.accounts.vault;
        vault.deposit_count = vault.deposit_count.saturating_add(1);

        emit!(SplDeposited {
            vault: vault.key(),
            depositor: ctx.accounts.depositor.key(),
            token_mint,
            amount,
        });
        Ok(())
    }

    /// Withdraws SOL from the vault. GATED by:
    ///   - vault.status == Active
    ///   - vault.withdrawals_enabled (admin emergency control, default false)
    ///   - the configured release authority signer (Squads vault in production)
    ///   - an Executed governance TreasuryRelease proposal with matching
    ///     community, native SOL recipient, and amount
    ///   - a one-time release receipt PDA, initialized by this instruction
    pub fn release_sol(ctx: Context<ReleaseSol>, amount: u64) -> Result<()> {
        require!(amount > 0, TreasuryError::InvalidAmount);
        let vault = &mut ctx.accounts.vault;
        require!(
            vault.status == VaultStatus::Active,
            TreasuryError::VaultNotActive
        );
        require!(
            vault.withdrawals_enabled,
            TreasuryError::WithdrawalsDisabled
        );
        require_keys_eq!(
            ctx.accounts.executor.key(),
            vault.release_authority,
            TreasuryError::UnauthorizedReleaseAuthority
        );
        let proposal = load_proposal_account(&ctx.accounts.proposal)?;
        require!(
            proposal.community == vault.community,
            TreasuryError::ProposalMismatch
        );
        require!(
            proposal.status == ProposalStatus::Executed,
            TreasuryError::ProposalNotExecuted
        );
        match proposal.kind {
            ProposalKind::TreasuryRelease {
                recipient,
                amount: proposal_amount,
                token_mint,
                ..
            } => {
                require!(token_mint.is_none(), TreasuryError::ProposalMismatch);
                require_keys_eq!(
                    recipient,
                    ctx.accounts.recipient.key(),
                    TreasuryError::ProposalMismatch
                );
                require!(proposal_amount == amount, TreasuryError::ProposalMismatch);
            }
            _ => return err!(TreasuryError::ProposalMismatch),
        }

        let vault_info = vault.to_account_info();
        let vault_lamports = vault_info.lamports();
        let rent_minimum = Rent::get()?.minimum_balance(vault_info.data_len());
        require!(
            vault_lamports >= amount && vault_lamports.saturating_sub(amount) >= rent_minimum,
            TreasuryError::InsufficientBalance
        );

        // Vault PDA owns its own lamports; mutate directly.
        **vault_info.try_borrow_mut_lamports()? = vault_lamports.saturating_sub(amount);
        **ctx
            .accounts
            .recipient
            .to_account_info()
            .try_borrow_mut_lamports()? = ctx.accounts.recipient.lamports().saturating_add(amount);

        vault.total_sol_released = vault.total_sol_released.saturating_add(amount);
        vault.release_count = vault.release_count.saturating_add(1);
        let receipt = &mut ctx.accounts.release_receipt;
        receipt.proposal = ctx.accounts.proposal.key();
        receipt.vault = vault.key();
        receipt.recipient = ctx.accounts.recipient.key();
        receipt.amount = amount;
        receipt.released_at_slot = Clock::get()?.slot;
        receipt.bump = ctx.bumps.release_receipt;

        emit!(SolReleased {
            vault: vault.key(),
            recipient: ctx.accounts.recipient.key(),
            amount,
            proposal: ctx.accounts.proposal.key(),
        });
        Ok(())
    }

    pub fn enable_withdrawals(ctx: Context<MutateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );
        vault.withdrawals_enabled = true;
        emit!(WithdrawalsToggled {
            vault: vault.key(),
            enabled: true,
        });
        Ok(())
    }

    pub fn disable_withdrawals(ctx: Context<MutateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );
        vault.withdrawals_enabled = false;
        emit!(WithdrawalsToggled {
            vault: vault.key(),
            enabled: false,
        });
        Ok(())
    }

    pub fn set_vault_status(ctx: Context<MutateVault>, status: VaultStatus) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );
        require!(
            vault.status != VaultStatus::Closed,
            TreasuryError::VaultClosed
        );
        vault.status = status;
        emit!(VaultStatusChanged {
            vault: vault.key(),
            status,
        });
        Ok(())
    }

    /// Step 1 of a safe two-step admin transfer. Nominates a successor without
    /// immediately relinquishing control. The nominee must call `accept_admin`
    /// to complete the handoff. Use `cancel_admin_nomination` to abort.
    pub fn nominate_admin(ctx: Context<MutateVault>, new_admin: Pubkey) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );
        vault.pending_admin = Some(new_admin);
        emit!(AdminNominated {
            vault: vault.key(),
            nominee: new_admin,
        });
        Ok(())
    }

    /// Clears a pending admin nomination. Callable only by the current admin.
    pub fn cancel_admin_nomination(ctx: Context<MutateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );
        vault.pending_admin = None;
        Ok(())
    }

    /// Step 2 of a safe admin transfer. Signed by the nominee; completes the
    /// handoff atomically. Prevents key-loss from a typo in `nominate_admin`.
    pub fn accept_admin(ctx: Context<AcceptAdmin>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let pending = vault.pending_admin.ok_or(TreasuryError::NoPendingAdmin)?;
        require!(
            ctx.accounts.nominee.key() == pending,
            TreasuryError::Unauthorized
        );
        let previous = vault.admin_authority;
        vault.admin_authority = ctx.accounts.nominee.key();
        vault.pending_admin = None;
        emit!(AdminTransferred {
            vault: vault.key(),
            previous,
            current: ctx.accounts.nominee.key(),
        });
        Ok(())
    }

    /// Step 1 of a two-step release-authority handoff. Production deployments
    /// nominate the Squads vault PDA, then accept through a Squads transaction.
    pub fn nominate_release_authority(
        ctx: Context<MutateVault>,
        new_release_authority: Pubkey,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );
        vault.pending_release_authority = Some(new_release_authority);
        emit!(ReleaseAuthorityNominated {
            vault: vault.key(),
            nominee: new_release_authority,
        });
        Ok(())
    }

    pub fn cancel_release_authority_nomination(ctx: Context<MutateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );
        vault.pending_release_authority = None;
        Ok(())
    }

    /// Step 2 of a two-step release-authority handoff. The nominee must sign,
    /// preventing an accidental or malicious one-sided authority replacement.
    pub fn accept_release_authority(ctx: Context<AcceptReleaseAuthority>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let pending = vault
            .pending_release_authority
            .ok_or(TreasuryError::NoPendingReleaseAuthority)?;
        require!(
            ctx.accounts.nominee.key() == pending,
            TreasuryError::Unauthorized
        );
        let previous = vault.release_authority;
        vault.release_authority = ctx.accounts.nominee.key();
        vault.pending_release_authority = None;
        emit!(ReleaseAuthorityTransferred {
            vault: vault.key(),
            previous,
            current: ctx.accounts.nominee.key(),
        });
        Ok(())
    }
}

// ─────────────────────── Accounts ───────────────────────

#[account]
pub struct TreasuryVaultAccount {
    pub community: Pubkey,
    pub admin_authority: Pubkey,
    /// Pending two-step admin transfer. Set by `nominate_admin`, cleared on
    /// `accept_admin` or `cancel_admin_nomination`.
    pub pending_admin: Option<Pubkey>,
    /// Signer required for proposal-authorized releases. Hand this off to a
    /// Squads vault PDA before enabling production withdrawals.
    pub release_authority: Pubkey,
    pub pending_release_authority: Option<Pubkey>,
    pub status: VaultStatus,
    pub withdrawals_enabled: bool,
    pub total_sol_deposited: u64,
    pub total_sol_released: u64,
    pub deposit_count: u64,
    pub release_count: u64,
    pub created_at_slot: u64,
    pub bump: u8,
}

impl TreasuryVaultAccount {
    pub const SIZE: usize = 32   // community
        + 32                      // admin_authority
        + (1 + 32)                // pending_admin Option<Pubkey>
        + 32                      // release_authority
        + (1 + 32)                // pending_release_authority Option<Pubkey>
        + 1                       // status
        + 1                       // withdrawals_enabled
        + 8 * 4                   // four u64 counters
        + 8                       // created_at_slot
        + 1; // bump
}

// ─────────────────────── Enums ───────────────────────

#[account]
pub struct ReleaseReceiptAccount {
    pub proposal: Pubkey,
    pub vault: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub released_at_slot: u64,
    pub bump: u8,
}

impl ReleaseReceiptAccount {
    pub const SIZE: usize = 32 * 3 + 8 * 2 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum VaultStatus {
    Active,
    Paused, // deposits + withdrawals temporarily blocked
    Closed, // terminal, no further state changes
}

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

// ─────────────────────── Contexts ───────────────────────

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    /// CHECK: CommunityAccount PDA from community_registry; validated by future CPI.
    pub community: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + TreasuryVaultAccount::SIZE,
        seeds = [b"treasury", community.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, TreasuryVaultAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub vault: Account<'info, TreasuryVaultAccount>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordSplDeposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, TreasuryVaultAccount>,

    pub depositor: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseSol<'info> {
    #[account(mut)]
    pub vault: Account<'info, TreasuryVaultAccount>,

    /// CHECK: owner, discriminator, status, community, and TreasuryRelease
    /// payload are validated manually.
    pub proposal: UncheckedAccount<'info>,

    #[account(
        init,
        payer = executor,
        space = 8 + ReleaseReceiptAccount::SIZE,
        seeds = [b"release", proposal.key().as_ref()],
        bump,
    )]
    pub release_receipt: Account<'info, ReleaseReceiptAccount>,

    /// CHECK: receives SOL and is validated against proposal.kind.recipient.
    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    #[account(mut)]
    pub executor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MutateVault<'info> {
    #[account(mut)]
    pub vault: Account<'info, TreasuryVaultAccount>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptAdmin<'info> {
    #[account(mut)]
    pub vault: Account<'info, TreasuryVaultAccount>,

    pub nominee: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptReleaseAuthority<'info> {
    #[account(mut)]
    pub vault: Account<'info, TreasuryVaultAccount>,

    pub nominee: Signer<'info>,
}

// ─────────────────────── Events ───────────────────────

#[event]
pub struct VaultInitialized {
    pub vault: Pubkey,
    pub community: Pubkey,
    pub admin: Pubkey,
}

#[event]
pub struct SolDeposited {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub memo_tag: u8,
}

#[event]
pub struct SplDeposited {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct SolReleased {
    pub vault: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub proposal: Pubkey,
}

#[event]
pub struct WithdrawalsToggled {
    pub vault: Pubkey,
    pub enabled: bool,
}

#[event]
pub struct VaultStatusChanged {
    pub vault: Pubkey,
    pub status: VaultStatus,
}

#[event]
pub struct AdminNominated {
    pub vault: Pubkey,
    pub nominee: Pubkey,
}

#[event]
pub struct AdminTransferred {
    pub vault: Pubkey,
    pub previous: Pubkey,
    pub current: Pubkey,
}

#[event]
pub struct ReleaseAuthorityNominated {
    pub vault: Pubkey,
    pub nominee: Pubkey,
}

#[event]
pub struct ReleaseAuthorityTransferred {
    pub vault: Pubkey,
    pub previous: Pubkey,
    pub current: Pubkey,
}

// ─────────────────────── Errors ───────────────────────

#[error_code]
pub enum TreasuryError {
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Vault is not in Active status")]
    VaultNotActive,
    #[msg("Vault is closed; no further actions allowed")]
    VaultClosed,
    #[msg("Withdrawals are disabled for this vault")]
    WithdrawalsDisabled,
    #[msg("Vault balance is insufficient (would breach rent minimum)")]
    InsufficientBalance,
    #[msg("No pending admin nomination to accept")]
    NoPendingAdmin,
    #[msg("Governance proposal is not executed")]
    ProposalNotExecuted,
    #[msg("Governance proposal does not authorize this SOL release")]
    ProposalMismatch,
    #[msg("Release executor is not the configured multisig authority")]
    UnauthorizedReleaseAuthority,
    #[msg("No pending release authority nomination to accept")]
    NoPendingReleaseAuthority,
}

fn load_proposal_account(account: &UncheckedAccount) -> Result<ProposalAccount> {
    require_keys_eq!(
        *account.owner,
        GOVERNANCE_PROGRAM_ID,
        TreasuryError::ProposalMismatch
    );

    let data = account.try_borrow_data()?;
    require!(
        data.len() >= 8 && data[..8] == PROPOSAL_ACCOUNT_DISCRIMINATOR,
        TreasuryError::ProposalMismatch
    );
    let mut proposal_bytes: &[u8] = &data[8..];
    Ok(ProposalAccount::deserialize(&mut proposal_bytes)?)
}
