//! Baraza community registry program.
//!
//! Owns the root `CommunityAccount` PDA per Baraza community. Other programs
//! (governance, membership, treasury_vault, payment_attestation) derive their
//! own PDAs from `community.key()`; this account is the identity anchor.
//!
//! Per MVP_ARCHITECTURE.md §6, PDA seeds: ["community", slug_bytes].
//!
//! Private data (phone, email, KYC, M-Pesa receipts) stays off-chain in
//! Supabase. This account stores only the public, on-chain-safe identity.

use anchor_lang::prelude::*;

declare_id!("Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD");

#[program]
pub mod community_registry {
    use super::*;

    pub fn create_community(
        ctx: Context<CreateCommunity>,
        slug: String,
        name: String,
        metadata_uri: String,
    ) -> Result<()> {
        require!(
            !slug.is_empty() && slug.len() <= MAX_SLUG_LEN,
            CommunityError::InvalidSlug
        );
        require!(slug_is_valid(&slug), CommunityError::InvalidSlug);
        require!(
            !name.is_empty() && name.len() <= MAX_NAME_LEN,
            CommunityError::InvalidName
        );
        require!(
            metadata_uri.len() <= MAX_METADATA_URI_LEN,
            CommunityError::MetadataUriTooLong
        );

        let community = &mut ctx.accounts.community;
        community.slug = slug;
        community.name = name;
        community.metadata_uri = metadata_uri;
        community.admin_authority = ctx.accounts.admin.key();
        community.pending_admin = None;
        community.status = CommunityStatus::Active;
        community.created_at_slot = Clock::get()?.slot;
        community.member_count = 0;
        community.bump = ctx.bumps.community;

        emit!(CommunityCreated {
            community: community.key(),
            admin: community.admin_authority,
            slug: community.slug.clone(),
        });
        Ok(())
    }

    pub fn update_metadata(
        ctx: Context<MutateCommunity>,
        new_name: Option<String>,
        new_metadata_uri: Option<String>,
    ) -> Result<()> {
        let signer = ctx.accounts.admin.key();
        let community = &mut ctx.accounts.community;
        require!(
            signer == community.admin_authority,
            CommunityError::Unauthorized
        );
        require!(
            community.status == CommunityStatus::Active,
            CommunityError::CommunityNotActive
        );

        if let Some(name) = new_name {
            require!(
                !name.is_empty() && name.len() <= MAX_NAME_LEN,
                CommunityError::InvalidName
            );
            community.name = name;
        }
        if let Some(uri) = new_metadata_uri {
            require!(
                uri.len() <= MAX_METADATA_URI_LEN,
                CommunityError::MetadataUriTooLong
            );
            community.metadata_uri = uri;
        }

        emit!(CommunityMetadataUpdated {
            community: community.key(),
        });
        Ok(())
    }

    /// Two-step admin handoff. Current admin nominates a successor.
    pub fn nominate_admin(ctx: Context<MutateCommunity>, new_admin: Pubkey) -> Result<()> {
        let signer = ctx.accounts.admin.key();
        let community = &mut ctx.accounts.community;
        require!(
            signer == community.admin_authority,
            CommunityError::Unauthorized
        );
        require!(
            community.status == CommunityStatus::Active,
            CommunityError::CommunityNotActive
        );
        community.pending_admin = Some(new_admin);
        emit!(AdminNominated {
            community: community.key(),
            nominee: new_admin,
        });
        Ok(())
    }

    /// Nominee accepts the handoff. Signed by the nominee, not the outgoing admin.
    pub fn accept_admin(ctx: Context<AcceptAdmin>) -> Result<()> {
        let signer = ctx.accounts.nominee.key();
        let community = &mut ctx.accounts.community;
        let pending = community
            .pending_admin
            .ok_or(CommunityError::NoPendingAdmin)?;
        require!(signer == pending, CommunityError::Unauthorized);
        let previous = community.admin_authority;
        community.admin_authority = signer;
        community.pending_admin = None;
        emit!(AdminTransferred {
            community: community.key(),
            previous,
            current: signer,
        });
        Ok(())
    }

    pub fn cancel_admin_nomination(ctx: Context<MutateCommunity>) -> Result<()> {
        let signer = ctx.accounts.admin.key();
        let community = &mut ctx.accounts.community;
        require!(
            signer == community.admin_authority,
            CommunityError::Unauthorized
        );
        community.pending_admin = None;
        emit!(AdminNominationCanceled {
            community: community.key(),
        });
        Ok(())
    }

    pub fn set_status(ctx: Context<MutateCommunity>, status: CommunityStatus) -> Result<()> {
        let signer = ctx.accounts.admin.key();
        let community = &mut ctx.accounts.community;
        require!(
            signer == community.admin_authority,
            CommunityError::Unauthorized
        );
        // Once Closed the community is terminal — no status change is allowed,
        // including attempts to re-open it.
        require!(
            community.status != CommunityStatus::Closed,
            CommunityError::CommunityClosed
        );
        community.status = status;
        emit!(CommunityStatusChanged {
            community: community.key(),
            status,
        });
        Ok(())
    }

    /// Incremented by membership program via CPI when an Active MemberAccount is created.
    /// Decremented on revoke. Membership program must hold mint authority.
    pub fn bump_member_count(ctx: Context<MutateCommunity>, delta: i32) -> Result<()> {
        // TODO(cpi): restrict to membership program ID once that program is deployed.
        // For now this is admin-only as a placeholder.
        let signer = ctx.accounts.admin.key();
        let community = &mut ctx.accounts.community;
        require!(
            signer == community.admin_authority,
            CommunityError::Unauthorized
        );
        let next = (community.member_count as i64).saturating_add(delta as i64);
        require!(next >= 0, CommunityError::MemberCountUnderflow);
        community.member_count = next as u32;
        Ok(())
    }
}

// ─────────────────────── Constants ───────────────────────

pub const MAX_SLUG_LEN: usize = 48;
pub const MAX_NAME_LEN: usize = 96;
pub const MAX_METADATA_URI_LEN: usize = 256;

// ─────────────────────── Accounts ───────────────────────

#[account]
pub struct CommunityAccount {
    pub slug: String,
    pub name: String,
    pub metadata_uri: String,
    pub admin_authority: Pubkey,
    pub pending_admin: Option<Pubkey>,
    pub status: CommunityStatus,
    pub created_at_slot: u64,
    pub member_count: u32,
    pub bump: u8,
}

impl CommunityAccount {
    pub const SIZE: usize = (4 + MAX_SLUG_LEN)         // slug
        + (4 + MAX_NAME_LEN)                            // name
        + (4 + MAX_METADATA_URI_LEN)                    // metadata_uri
        + 32                                            // admin_authority
        + (1 + 32)                                      // pending_admin Option
        + 1                                             // status
        + 8                                             // created_at_slot
        + 4                                             // member_count
        + 1; // bump
}

// ─────────────────────── Enums ───────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum CommunityStatus {
    Active,
    Paused, // admin temporarily disabled new joins / votes
    Closed, // terminal: no further activity, treasury wind-down only
}

// ─────────────────────── Contexts ───────────────────────

#[derive(Accounts)]
#[instruction(slug: String)]
pub struct CreateCommunity<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + CommunityAccount::SIZE,
        seeds = [b"community", slug.as_bytes()],
        bump,
    )]
    pub community: Account<'info, CommunityAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MutateCommunity<'info> {
    #[account(mut)]
    pub community: Account<'info, CommunityAccount>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptAdmin<'info> {
    #[account(mut)]
    pub community: Account<'info, CommunityAccount>,

    pub nominee: Signer<'info>,
}

// ─────────────────────── Events ───────────────────────

#[event]
pub struct CommunityCreated {
    pub community: Pubkey,
    pub admin: Pubkey,
    pub slug: String,
}

#[event]
pub struct CommunityMetadataUpdated {
    pub community: Pubkey,
}

#[event]
pub struct AdminNominated {
    pub community: Pubkey,
    pub nominee: Pubkey,
}

#[event]
pub struct AdminTransferred {
    pub community: Pubkey,
    pub previous: Pubkey,
    pub current: Pubkey,
}

#[event]
pub struct AdminNominationCanceled {
    pub community: Pubkey,
}

#[event]
pub struct CommunityStatusChanged {
    pub community: Pubkey,
    pub status: CommunityStatus,
}

// ─────────────────────── Errors ───────────────────────

#[error_code]
pub enum CommunityError {
    #[msg("Slug must be 1-48 chars of lowercase a-z, 0-9, or hyphen")]
    InvalidSlug,
    #[msg("Name must be 1-96 chars")]
    InvalidName,
    #[msg("Metadata URI exceeds maximum length")]
    MetadataUriTooLong,
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Community is not in Active status")]
    CommunityNotActive,
    #[msg("Community is closed; status change rejected")]
    CommunityClosed,
    #[msg("No pending admin nomination")]
    NoPendingAdmin,
    #[msg("Member count would underflow")]
    MemberCountUnderflow,
}

// ─────────────────────── Helpers ───────────────────────

fn slug_is_valid(slug: &str) -> bool {
    // No leading/trailing hyphen, no consecutive hyphens, only a-z 0-9 -
    !slug.starts_with('-')
        && !slug.ends_with('-')
        && !slug.contains("--")
        && slug.bytes().all(|b| matches!(b, b'a'..=b'z' | b'0'..=b'9' | b'-'))
}
