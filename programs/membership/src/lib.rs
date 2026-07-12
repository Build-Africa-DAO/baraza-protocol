//! Baraza membership program.
//!
//! Owns per-community `MembershipTierAccount` and per-member `MemberAccount`.
//! Implements the membership lifecycle from MVP_ARCHITECTURE.md §6.1:
//!   Pending -> Active -> {Suspended -> Active | Revoked | Migrated | Expired}
//!
//! Critical privacy rules (per §6.1):
//!   - Phone, email, KYC, M-Pesa receipts NEVER stored on-chain.
//!   - user_id stored only as HMAC/peppered hash.
//!   - payment_order_id stored only as hash.
//!   - member_id_hash is stable across wallet migration; PDA is NOT derived
//!     from the wallet alone.

use anchor_lang::prelude::*;

declare_id!("ANra85R8oRawbSQu4z9yKjC8z7dcCyqeDJ5LzK4sonsa");

pub const PAYMENT_ATTESTATION_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    166, 80, 31, 41, 145, 125, 236, 135, 175, 106, 28, 21, 32, 180, 183, 25, 204, 253, 117, 17, 164,
    62, 240, 66, 221, 199, 44, 52, 128, 244, 105, 148,
]);
pub const PAYMENT_ATTESTATION_DISCRIMINATOR: [u8; 8] = [62, 247, 19, 32, 195, 26, 7, 197];

#[program]
pub mod membership {
    use super::*;

    // ──────────── Tier management ────────────

    pub fn create_tier(ctx: Context<CreateTier>, params: CreateTierParams) -> Result<()> {
        params.validate()?;
        let tier = &mut ctx.accounts.tier;
        tier.community = ctx.accounts.community.key();
        tier.tier_id = params.tier_id;
        tier.name = params.name;
        tier.description_uri = params.description_uri;
        tier.voting_weight = params.voting_weight;
        tier.dues_smallest_unit = params.dues_smallest_unit;
        tier.join_fee_smallest_unit = params.join_fee_smallest_unit;
        tier.currency_code = params.currency_code;
        tier.max_seats = params.max_seats;
        tier.used_seats = 0;
        tier.admin_authority = ctx.accounts.admin.key();
        tier.status = TierStatus::Open;
        tier.bump = ctx.bumps.tier;

        emit!(TierCreated {
            tier: tier.key(),
            community: tier.community,
            tier_id: tier.tier_id,
        });
        Ok(())
    }

    pub fn update_tier(ctx: Context<MutateTier>, params: UpdateTierParams) -> Result<()> {
        let tier = &mut ctx.accounts.tier;
        require!(
            tier.status != TierStatus::Closed,
            MembershipError::TierClosed
        );
        if let Some(name) = params.name {
            require!(
                !name.is_empty() && name.len() <= MAX_NAME_LEN,
                MembershipError::InvalidName
            );
            tier.name = name;
        }
        if let Some(uri) = params.description_uri {
            require!(
                uri.len() <= MAX_METADATA_URI_LEN,
                MembershipError::MetadataUriTooLong
            );
            tier.description_uri = uri;
        }
        if let Some(weight) = params.voting_weight {
            tier.voting_weight = weight;
        }
        if let Some(dues) = params.dues_smallest_unit {
            tier.dues_smallest_unit = dues;
        }
        if let Some(fee) = params.join_fee_smallest_unit {
            tier.join_fee_smallest_unit = fee;
        }
        if let Some(seats) = params.max_seats {
            require!(
                seats >= tier.used_seats,
                MembershipError::TierSeatsBelowUsed
            );
            tier.max_seats = seats;
        }
        Ok(())
    }

    pub fn set_tier_status(ctx: Context<MutateTier>, status: TierStatus) -> Result<()> {
        let tier = &mut ctx.accounts.tier;
        require!(
            tier.status != TierStatus::Closed,
            MembershipError::TierClosed
        );
        tier.status = status;
        Ok(())
    }

    // ──────────── Member lifecycle ────────────

    /// Creates a Pending MemberAccount. No mint, no voting rights yet.
    /// Called by the Baraza backend after a phone-verified user starts a join
    /// flow. The mint + Active transition happens later via `activate_member`
    /// once payment is reconciled.
    pub fn register_member(
        ctx: Context<RegisterMember>,
        params: RegisterMemberParams,
    ) -> Result<()> {
        require!(
            params.metadata_uri.len() <= MAX_METADATA_URI_LEN,
            MembershipError::MetadataUriTooLong
        );

        let tier = &mut ctx.accounts.tier;
        require!(
            tier.status == TierStatus::Open,
            MembershipError::TierNotOpen
        );
        require!(tier.used_seats < tier.max_seats, MembershipError::TierFull);
        tier.used_seats = tier.used_seats.saturating_add(1);

        let member = &mut ctx.accounts.member;
        member.member_id_hash = params.member_id_hash;
        member.community = ctx.accounts.community.key();
        member.user_id_hash = params.user_id_hash;
        member.wallet_address = ctx.accounts.wallet.key();
        member.tier = tier.key();
        member.status = MembershipStatus::Pending;
        member.voting_weight = 0; // assigned at activation, snapshot of tier.voting_weight
        member.joined_at_slot = Clock::get()?.slot;
        member.activated_at_slot = None;
        member.expires_at_slot = params.expires_at_slot;
        member.revoked_at_slot = None;
        member.migrated_from_member = None;
        member.migrated_to_member = None;
        member.membership_mint = None;
        member.membership_token_account = None;
        member.payment_order_id_hash = params.payment_order_id_hash;
        member.metadata_uri = params.metadata_uri;
        member.bump = ctx.bumps.member;

        emit!(MemberRegistered {
            member: member.key(),
            community: member.community,
            tier: member.tier,
        });
        Ok(())
    }

    /// Pending -> Active. The off-chain caller MUST present a consumed
    /// PaymentAttestationAccount; on-chain validation of that consumption is
    /// deferred to CPI into payment_attestation program.
    pub fn activate_member(
        ctx: Context<ActivateMember>,
        membership_mint: Option<Pubkey>,
        membership_token_account: Option<Pubkey>,
    ) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let tier = &ctx.accounts.tier;
        require_keys_eq!(
            *ctx.accounts.payment_attestation.owner,
            PAYMENT_ATTESTATION_PROGRAM_ID,
            MembershipError::PaymentAttestationMismatch
        );

        let attestation_data = ctx.accounts.payment_attestation.try_borrow_data()?;
        require!(
            attestation_data.len() >= 8
                && attestation_data[..8] == PAYMENT_ATTESTATION_DISCRIMINATOR,
            MembershipError::PaymentAttestationMismatch
        );
        let mut attestation_bytes: &[u8] = &attestation_data[8..];
        let attestation = PaymentAttestationAccount::deserialize(&mut attestation_bytes)?;

        require!(
            member.status == MembershipStatus::Pending,
            MembershipError::InvalidStateTransition
        );
        require!(member.tier == tier.key(), MembershipError::TierMismatch);
        require!(
            attestation.consumed && !attestation.voided,
            MembershipError::PaymentAttestationNotConsumed
        );
        require!(
            attestation.community == member.community
                && attestation.tier == tier.key()
                && attestation.member_id_hash == member.member_id_hash
                && attestation.recipient_wallet == member.wallet_address
                && attestation.order_id_hash == member.payment_order_id_hash
                && attestation.attester == ctx.accounts.minter.key(),
            MembershipError::PaymentAttestationMismatch
        );

        member.membership_mint = membership_mint;
        member.membership_token_account = membership_token_account;
        member.voting_weight = tier.voting_weight;
        member.activated_at_slot = Some(Clock::get()?.slot);
        member.status = MembershipStatus::Active;

        emit!(MemberActivated {
            member: member.key(),
            voting_weight: member.voting_weight,
        });
        Ok(())
    }

    pub fn suspend_member(ctx: Context<AdminMutateMember>) -> Result<()> {
        let member = &mut ctx.accounts.member;
        require!(
            member.status == MembershipStatus::Active,
            MembershipError::InvalidStateTransition
        );
        member.status = MembershipStatus::Suspended;
        emit!(MemberStatusChanged {
            member: member.key(),
            status: member.status,
        });
        Ok(())
    }

    pub fn reinstate_member(ctx: Context<AdminMutateMember>) -> Result<()> {
        let member = &mut ctx.accounts.member;
        require!(
            member.status == MembershipStatus::Suspended,
            MembershipError::InvalidStateTransition
        );
        member.status = MembershipStatus::Active;
        emit!(MemberStatusChanged {
            member: member.key(),
            status: member.status,
        });
        Ok(())
    }

    pub fn revoke_member(ctx: Context<AdminMutateMember>) -> Result<()> {
        let member = &mut ctx.accounts.member;
        require!(
            matches!(
                member.status,
                MembershipStatus::Active | MembershipStatus::Suspended | MembershipStatus::Pending
            ),
            MembershipError::InvalidStateTransition
        );
        let tier = &mut ctx.accounts.tier;
        require!(member.tier == tier.key(), MembershipError::TierMismatch);

        tier.used_seats = tier.used_seats.saturating_sub(1);
        member.status = MembershipStatus::Revoked;
        member.revoked_at_slot = Some(Clock::get()?.slot);
        emit!(MemberStatusChanged {
            member: member.key(),
            status: member.status,
        });
        Ok(())
    }

    /// Permissionless once `expires_at_slot` has passed. Anyone can mark.
    pub fn mark_expired(ctx: Context<MarkExpired>) -> Result<()> {
        let member = &mut ctx.accounts.member;
        require!(
            matches!(
                member.status,
                MembershipStatus::Active | MembershipStatus::Suspended
            ),
            MembershipError::InvalidStateTransition
        );
        let expiry = member
            .expires_at_slot
            .ok_or(MembershipError::MemberHasNoExpiry)?;
        require!(Clock::get()?.slot >= expiry, MembershipError::TooEarly);
        member.status = MembershipStatus::Expired;
        emit!(MemberStatusChanged {
            member: member.key(),
            status: member.status,
        });
        Ok(())
    }

    /// Wallet migration: the old MemberAccount transitions to Migrated and a
    /// NEW MemberAccount is created with the same `member_id_hash` linked to
    /// the new wallet. The off-chain identity (user_id_hash) is preserved.
    ///
    /// Signed by both the admin authority AND the new wallet (proves possession).
    pub fn migrate_wallet(ctx: Context<MigrateWallet>) -> Result<()> {
        let old = &mut ctx.accounts.old_member;
        require!(
            old.status == MembershipStatus::Active,
            MembershipError::InvalidStateTransition
        );
        require!(
            old.community == ctx.accounts.new_member.community,
            MembershipError::CommunityMismatch
        );

        let new = &mut ctx.accounts.new_member;
        new.member_id_hash = old.member_id_hash;
        new.community = old.community;
        new.user_id_hash = old.user_id_hash;
        new.wallet_address = ctx.accounts.new_wallet.key();
        new.tier = old.tier;
        new.status = MembershipStatus::Active;
        new.voting_weight = old.voting_weight;
        new.joined_at_slot = old.joined_at_slot;
        new.activated_at_slot = old.activated_at_slot;
        new.expires_at_slot = old.expires_at_slot;
        new.revoked_at_slot = None;
        new.migrated_from_member = Some(old.key());
        new.migrated_to_member = None;
        new.membership_mint = None;
        new.membership_token_account = None;
        new.payment_order_id_hash = old.payment_order_id_hash;
        new.metadata_uri = old.metadata_uri.clone();
        new.bump = ctx.bumps.new_member;

        old.status = MembershipStatus::Migrated;
        old.migrated_to_member = Some(new.key());

        emit!(MemberMigrated {
            from: old.key(),
            to: new.key(),
            new_wallet: new.wallet_address,
        });
        Ok(())
    }

    pub fn update_member_tier(ctx: Context<UpdateMemberTier>) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let new_tier = &mut ctx.accounts.new_tier;
        let old_tier = &mut ctx.accounts.old_tier;
        require!(
            member.status == MembershipStatus::Active,
            MembershipError::InvalidStateTransition
        );
        require!(member.tier == old_tier.key(), MembershipError::TierMismatch);
        require!(
            new_tier.status == TierStatus::Open,
            MembershipError::TierNotOpen
        );
        require!(
            new_tier.used_seats < new_tier.max_seats,
            MembershipError::TierFull
        );

        old_tier.used_seats = old_tier.used_seats.saturating_sub(1);
        new_tier.used_seats = new_tier.used_seats.saturating_add(1);
        member.tier = new_tier.key();
        member.voting_weight = new_tier.voting_weight;

        emit!(MemberTierChanged {
            member: member.key(),
            new_tier: new_tier.key(),
            new_voting_weight: member.voting_weight,
        });
        Ok(())
    }
}

// ─────────────────────── Constants ───────────────────────

pub const MAX_NAME_LEN: usize = 48;
pub const MAX_METADATA_URI_LEN: usize = 256;

// ─────────────────────── Accounts ───────────────────────

#[account]
pub struct MembershipTierAccount {
    pub community: Pubkey,
    pub tier_id: u16,
    pub name: String,
    pub description_uri: String,
    pub voting_weight: u64,
    pub dues_smallest_unit: u64,
    pub join_fee_smallest_unit: u64,
    pub currency_code: [u8; 3], // "KES", "USD", "USDC"
    pub max_seats: u32,
    pub used_seats: u32,
    pub admin_authority: Pubkey,
    pub status: TierStatus,
    pub bump: u8,
}

impl MembershipTierAccount {
    pub const SIZE: usize = 32              // community
        + 2                                  // tier_id
        + (4 + MAX_NAME_LEN)                 // name
        + (4 + MAX_METADATA_URI_LEN)         // description_uri
        + 8 + 8 + 8                          // weight + dues + join_fee
        + 3                                  // currency_code
        + 4 + 4                              // max_seats + used_seats
        + 32                                 // admin_authority
        + 1                                  // status
        + 1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PaymentAttestationAccount {
    pub order_id_hash: [u8; 32],
    pub community: Pubkey,
    pub tier: Pubkey,
    pub member_id_hash: [u8; 32],
    pub recipient_wallet: Pubkey,
    pub amount_smallest_unit: u64,
    pub currency_code: [u8; 3],
    pub provider_reference_hash: [u8; 32],
    pub provider_environment: String,
    pub attester: Pubkey,
    pub expires_at_slot: u64,
    pub consumed: bool,
    pub consumed_at_slot: Option<u64>,
    pub voided: bool,
    pub voided_at_slot: Option<u64>,
    pub bump: u8,
}

#[account]
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

impl MemberAccount {
    pub const SIZE: usize = 32   // member_id_hash
        + 32                      // community
        + 32                      // user_id_hash
        + 32                      // wallet_address
        + 32                      // tier
        + 1                       // status
        + 8                       // voting_weight
        + 8                       // joined_at_slot
        + (1 + 8) * 3             // three Option<u64>
        + (1 + 32) * 4            // four Option<Pubkey>
        + 32                      // payment_order_id_hash
        + (4 + MAX_METADATA_URI_LEN) // metadata_uri
        + 1; // bump
}

// ─────────────────────── Enums ───────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MembershipStatus {
    Pending,
    Active,
    Suspended,
    Revoked,
    Expired,
    Migrated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum TierStatus {
    Open,
    Paused, // existing members keep status; no new registrations
    Closed, // terminal
}

// ─────────────────────── Params ───────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateTierParams {
    pub tier_id: u16,
    pub name: String,
    pub description_uri: String,
    pub voting_weight: u64,
    pub dues_smallest_unit: u64,
    pub join_fee_smallest_unit: u64,
    pub currency_code: [u8; 3],
    pub max_seats: u32,
}

impl CreateTierParams {
    pub fn validate(&self) -> Result<()> {
        require!(
            !self.name.is_empty() && self.name.len() <= MAX_NAME_LEN,
            MembershipError::InvalidName
        );
        require!(
            self.description_uri.len() <= MAX_METADATA_URI_LEN,
            MembershipError::MetadataUriTooLong
        );
        require!(self.max_seats > 0, MembershipError::InvalidTierConfig);
        require!(self.voting_weight > 0, MembershipError::InvalidTierConfig);
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateTierParams {
    pub name: Option<String>,
    pub description_uri: Option<String>,
    pub voting_weight: Option<u64>,
    pub dues_smallest_unit: Option<u64>,
    pub join_fee_smallest_unit: Option<u64>,
    pub max_seats: Option<u32>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RegisterMemberParams {
    pub member_id_hash: [u8; 32],
    pub user_id_hash: [u8; 32],
    pub payment_order_id_hash: [u8; 32],
    pub expires_at_slot: Option<u64>,
    pub metadata_uri: String,
}

// ─────────────────────── Contexts ───────────────────────

#[derive(Accounts)]
#[instruction(params: CreateTierParams)]
pub struct CreateTier<'info> {
    /// CHECK: CommunityAccount PDA owned by community_registry; validated by future CPI.
    pub community: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + MembershipTierAccount::SIZE,
        seeds = [b"membership_tier", community.key().as_ref(), &params.tier_id.to_le_bytes()],
        bump,
    )]
    pub tier: Account<'info, MembershipTierAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MutateTier<'info> {
    #[account(
        mut,
        constraint = tier.admin_authority == admin.key() @ MembershipError::Unauthorized,
    )]
    pub tier: Account<'info, MembershipTierAccount>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(params: RegisterMemberParams)]
pub struct RegisterMember<'info> {
    /// CHECK: CommunityAccount; validated by PDA derivation match against tier.community.
    pub community: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = tier.community == community.key() @ MembershipError::CommunityMismatch,
        constraint = tier.admin_authority == registrar.key() @ MembershipError::Unauthorized,
    )]
    pub tier: Account<'info, MembershipTierAccount>,

    #[account(
        init,
        payer = registrar,
        space = 8 + MemberAccount::SIZE,
        seeds = [b"member", community.key().as_ref(), &params.member_id_hash],
        bump,
    )]
    pub member: Account<'info, MemberAccount>,

    /// CHECK: wallet that will own the membership; recorded on MemberAccount.
    pub wallet: UncheckedAccount<'info>,

    /// Baraza backend/admin signer paying for account creation.
    #[account(mut)]
    pub registrar: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateMember<'info> {
    #[account(mut)]
    pub member: Account<'info, MemberAccount>,

    #[account(
        constraint = tier.community == member.community @ MembershipError::CommunityMismatch,
    )]
    pub tier: Account<'info, MembershipTierAccount>,

    /// CHECK: manually validates owner, discriminator, and serialized fields.
    pub payment_attestation: UncheckedAccount<'info>,

    /// Baraza backend signer authorized to mint.
    pub minter: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminMutateMember<'info> {
    #[account(mut)]
    pub member: Account<'info, MemberAccount>,

    #[account(
        mut,
        constraint = tier.key() == member.tier @ MembershipError::TierMismatch,
        constraint = tier.admin_authority == admin.key() @ MembershipError::Unauthorized,
    )]
    pub tier: Account<'info, MembershipTierAccount>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct MarkExpired<'info> {
    #[account(mut)]
    pub member: Account<'info, MemberAccount>,
}

#[derive(Accounts)]
pub struct MigrateWallet<'info> {
    #[account(mut)]
    pub old_member: Account<'info, MemberAccount>,

    #[account(
        constraint = tier.key() == old_member.tier @ MembershipError::TierMismatch,
        constraint = tier.admin_authority == admin.key() @ MembershipError::Unauthorized,
    )]
    pub tier: Account<'info, MembershipTierAccount>,

    #[account(
        init,
        payer = registrar,
        space = 8 + MemberAccount::SIZE,
        seeds = [
            b"member",
            old_member.community.as_ref(),
            &old_member.member_id_hash,
            new_wallet.key().as_ref(),
        ],
        bump,
    )]
    pub new_member: Account<'info, MemberAccount>,

    /// CHECK: new wallet that will own the membership; signs to prove possession.
    pub new_wallet: Signer<'info>,

    pub admin: Signer<'info>,

    #[account(mut)]
    pub registrar: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMemberTier<'info> {
    #[account(mut)]
    pub member: Account<'info, MemberAccount>,

    #[account(
        mut,
        constraint = old_tier.key() == member.tier @ MembershipError::TierMismatch,
        constraint = old_tier.admin_authority == admin.key() @ MembershipError::Unauthorized,
    )]
    pub old_tier: Account<'info, MembershipTierAccount>,

    #[account(
        mut,
        constraint = new_tier.community == old_tier.community @ MembershipError::CommunityMismatch,
        constraint = new_tier.admin_authority == old_tier.admin_authority @ MembershipError::Unauthorized,
    )]
    pub new_tier: Account<'info, MembershipTierAccount>,

    pub admin: Signer<'info>,
}

// ─────────────────────── Events ───────────────────────

#[event]
pub struct TierCreated {
    pub tier: Pubkey,
    pub community: Pubkey,
    pub tier_id: u16,
}

#[event]
pub struct MemberRegistered {
    pub member: Pubkey,
    pub community: Pubkey,
    pub tier: Pubkey,
}

#[event]
pub struct MemberActivated {
    pub member: Pubkey,
    pub voting_weight: u64,
}

#[event]
pub struct MemberStatusChanged {
    pub member: Pubkey,
    pub status: MembershipStatus,
}

#[event]
pub struct MemberMigrated {
    pub from: Pubkey,
    pub to: Pubkey,
    pub new_wallet: Pubkey,
}

#[event]
pub struct MemberTierChanged {
    pub member: Pubkey,
    pub new_tier: Pubkey,
    pub new_voting_weight: u64,
}

// ─────────────────────── Errors ───────────────────────

#[error_code]
pub enum MembershipError {
    #[msg("Name must be 1-48 chars")]
    InvalidName,
    #[msg("Metadata URI exceeds maximum length")]
    MetadataUriTooLong,
    #[msg("Invalid tier configuration")]
    InvalidTierConfig,
    #[msg("Tier is not open for registration")]
    TierNotOpen,
    #[msg("Tier has reached its seat cap")]
    TierFull,
    #[msg("Tier is closed; no further mutations")]
    TierClosed,
    #[msg("Tier max_seats cannot fall below used_seats")]
    TierSeatsBelowUsed,
    #[msg("Tier does not belong to this community")]
    CommunityMismatch,
    #[msg("Provided tier does not match member.tier")]
    TierMismatch,
    #[msg("Invalid state transition for current member status")]
    InvalidStateTransition,
    #[msg("Member has no expiry configured")]
    MemberHasNoExpiry,
    #[msg("Action attempted before required slot")]
    TooEarly,
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Payment attestation has not been consumed or was voided")]
    PaymentAttestationNotConsumed,
    #[msg("Payment attestation does not match this member activation")]
    PaymentAttestationMismatch,
}
