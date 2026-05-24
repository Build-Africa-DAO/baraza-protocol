//! Baraza treasury_vault program.
//!
//! Per-community vault that holds SOL balances. Deposits are permissionless;
//! withdrawals are gated behind:
//!   1. `vault.withdrawals_enabled` (admin emergency control, default false).
//!   2. A successful (Executed) governance TreasuryRelease proposal — TODO(cpi).
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

#[program]
pub mod treasury_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.community = ctx.accounts.community.key();
        vault.admin_authority = ctx.accounts.admin.key();
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
    ///   - signer == vault.admin_authority (placeholder; production gates via
    ///     CPI from governance::execute_proposal verifying an Executed
    ///     TreasuryRelease proposal)
    ///
    /// TODO(cpi): replace admin signer check with proof of an Executed
    /// TreasuryRelease proposal. Use instruction-sysvar introspection to
    /// confirm caller is the governance program, OR pass the proposal account
    /// and verify status == Executed + recipient + amount match.
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
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );

        let vault_info = vault.to_account_info();
        let vault_lamports = vault_info.lamports();
        let rent_minimum = Rent::get()?.minimum_balance(vault_info.data_len());
        require!(
            vault_lamports >= amount
                && vault_lamports.saturating_sub(amount) >= rent_minimum,
            TreasuryError::InsufficientBalance
        );

        // Vault PDA owns its own lamports; mutate directly.
        **vault_info.try_borrow_mut_lamports()? = vault_lamports.saturating_sub(amount);
        **ctx
            .accounts
            .recipient
            .to_account_info()
            .try_borrow_mut_lamports()? = ctx
            .accounts
            .recipient
            .lamports()
            .saturating_add(amount);

        vault.total_sol_released = vault.total_sol_released.saturating_add(amount);
        vault.release_count = vault.release_count.saturating_add(1);

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

    pub fn transfer_admin(ctx: Context<MutateVault>, new_admin: Pubkey) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.admin.key() == vault.admin_authority,
            TreasuryError::Unauthorized
        );
        let previous = vault.admin_authority;
        vault.admin_authority = new_admin;
        emit!(AdminTransferred {
            vault: vault.key(),
            previous,
            current: new_admin,
        });
        Ok(())
    }
}

// ─────────────────────── Accounts ───────────────────────

#[account]
pub struct TreasuryVaultAccount {
    pub community: Pubkey,
    pub admin_authority: Pubkey,
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
        + 1                       // status
        + 1                       // withdrawals_enabled
        + 8 * 4                   // four u64 counters
        + 8                       // created_at_slot
        + 1; // bump
}

// ─────────────────────── Enums ───────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum VaultStatus {
    Active,
    Paused, // deposits + withdrawals temporarily blocked
    Closed, // terminal, no further state changes
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

    /// CHECK: ProposalAccount from governance program; status must be Executed
    /// and kind must be TreasuryRelease with matching recipient + amount.
    /// TODO(cpi): deserialize and validate here once governance crate is wired.
    pub proposal: UncheckedAccount<'info>,

    /// CHECK: receives the SOL. Validated against proposal.kind.recipient in TODO(cpi).
    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct MutateVault<'info> {
    #[account(mut)]
    pub vault: Account<'info, TreasuryVaultAccount>,

    pub admin: Signer<'info>,
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
pub struct AdminTransferred {
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
}
