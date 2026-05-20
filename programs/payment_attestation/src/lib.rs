//! Baraza payment attestation program.
//!
//! Bridges off-chain payment reconciliation to on-chain membership activation.
//! It stores only hashes and public routing data; provider payloads, phone
//! numbers, receipts, and KYC data stay in the private application database.

use anchor_lang::prelude::*;

declare_id!("CxNwpwExBQedJDYeuspyUUtHjeNr52wy6BTFPFbXWSL7");

#[program]
pub mod payment_attestation {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        trusted_attester: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.trusted_attester = trusted_attester;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn transfer_trusted_attester(
        ctx: Context<MutateConfig>,
        trusted_attester: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(
            config.authority == ctx.accounts.authority.key(),
            PaymentAttestationError::Unauthorized
        );
        config.trusted_attester = trusted_attester;
        Ok(())
    }

    pub fn attest_payment(ctx: Context<AttestPayment>, params: AttestPaymentParams) -> Result<()> {
        params.validate()?;
        require!(
            ctx.accounts.config.trusted_attester == ctx.accounts.attester.key(),
            PaymentAttestationError::Unauthorized
        );

        let attestation = &mut ctx.accounts.attestation;
        attestation.order_id_hash = params.order_id_hash;
        attestation.community = params.community;
        attestation.tier = params.tier;
        attestation.member_id_hash = params.member_id_hash;
        attestation.recipient_wallet = params.recipient_wallet;
        attestation.amount_smallest_unit = params.amount_smallest_unit;
        attestation.currency_code = params.currency_code;
        attestation.provider_reference_hash = params.provider_reference_hash;
        attestation.provider_environment = params.provider_environment;
        attestation.attester = ctx.accounts.attester.key();
        attestation.expires_at_slot = params.expires_at_slot;
        attestation.consumed = false;
        attestation.consumed_at_slot = None;
        attestation.voided = false;
        attestation.voided_at_slot = None;
        attestation.bump = ctx.bumps.attestation;

        emit!(PaymentAttested {
            attestation: attestation.key(),
            community: attestation.community,
            tier: attestation.tier,
            recipient_wallet: attestation.recipient_wallet,
        });
        Ok(())
    }

    pub fn consume_payment_for_mint(ctx: Context<ConsumePaymentForMint>) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        require!(
            !attestation.voided,
            PaymentAttestationError::AttestationVoided
        );
        require!(
            !attestation.consumed,
            PaymentAttestationError::AlreadyConsumed
        );
        require!(
            Clock::get()?.slot <= attestation.expires_at_slot,
            PaymentAttestationError::AttestationExpired
        );
        require!(
            ctx.accounts.consumer.key() == attestation.attester,
            PaymentAttestationError::Unauthorized
        );
        require!(
            ctx.accounts.config.trusted_attester == ctx.accounts.consumer.key(),
            PaymentAttestationError::Unauthorized
        );

        attestation.consumed = true;
        attestation.consumed_at_slot = Some(Clock::get()?.slot);

        emit!(PaymentAttestationConsumed {
            attestation: attestation.key(),
            consumer: ctx.accounts.consumer.key(),
        });
        Ok(())
    }

    pub fn void_payment_attestation(ctx: Context<VoidPaymentAttestation>) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        require!(
            ctx.accounts.attester.key() == attestation.attester,
            PaymentAttestationError::Unauthorized
        );
        require!(
            ctx.accounts.config.trusted_attester == ctx.accounts.attester.key(),
            PaymentAttestationError::Unauthorized
        );
        require!(
            !attestation.voided,
            PaymentAttestationError::AlreadyVoided
        );
        require!(
            !attestation.consumed,
            PaymentAttestationError::AlreadyConsumed
        );

        attestation.voided = true;
        attestation.voided_at_slot = Some(Clock::get()?.slot);

        emit!(PaymentAttestationVoided {
            attestation: attestation.key(),
        });
        Ok(())
    }
}

pub const PROVIDER_ENVIRONMENT_MAX_LEN: usize = 16;

#[account]
pub struct PaymentConfigAccount {
    pub authority: Pubkey,
    pub trusted_attester: Pubkey,
    pub bump: u8,
}

impl PaymentConfigAccount {
    pub const SIZE: usize = 32 + 32 + 1;
}

#[account]
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

impl PaymentAttestationAccount {
    pub const SIZE: usize = 32
        + 32
        + 32
        + 32
        + 32
        + 8
        + 3
        + 32
        + (4 + PROVIDER_ENVIRONMENT_MAX_LEN)
        + 32
        + 8
        + 1
        + (1 + 8)
        + 1
        + (1 + 8)
        + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AttestPaymentParams {
    pub order_id_hash: [u8; 32],
    pub community: Pubkey,
    pub tier: Pubkey,
    pub member_id_hash: [u8; 32],
    pub recipient_wallet: Pubkey,
    pub amount_smallest_unit: u64,
    pub currency_code: [u8; 3],
    pub provider_reference_hash: [u8; 32],
    pub provider_environment: String,
    pub expires_at_slot: u64,
}

impl AttestPaymentParams {
    pub fn validate(&self) -> Result<()> {
        require!(
            self.amount_smallest_unit > 0,
            PaymentAttestationError::InvalidAmount
        );
        require!(
            !self.provider_environment.is_empty()
                && self.provider_environment.len() <= PROVIDER_ENVIRONMENT_MAX_LEN,
            PaymentAttestationError::InvalidProviderEnvironment
        );
        require!(
            self.expires_at_slot > Clock::get()?.slot,
            PaymentAttestationError::AttestationExpired
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PaymentConfigAccount::SIZE,
        seeds = [b"payment_config"],
        bump,
    )]
    pub config: Account<'info, PaymentConfigAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MutateConfig<'info> {
    #[account(
        mut,
        seeds = [b"payment_config"],
        bump = config.bump,
    )]
    pub config: Account<'info, PaymentConfigAccount>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(params: AttestPaymentParams)]
pub struct AttestPayment<'info> {
    #[account(
        seeds = [b"payment_config"],
        bump = config.bump,
    )]
    pub config: Account<'info, PaymentConfigAccount>,

    #[account(
        init,
        payer = attester,
        space = 8 + PaymentAttestationAccount::SIZE,
        seeds = [b"payment", params.order_id_hash.as_ref()],
        bump,
    )]
    pub attestation: Account<'info, PaymentAttestationAccount>,

    #[account(mut)]
    pub attester: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConsumePaymentForMint<'info> {
    #[account(
        seeds = [b"payment_config"],
        bump = config.bump,
    )]
    pub config: Account<'info, PaymentConfigAccount>,

    #[account(mut)]
    pub attestation: Account<'info, PaymentAttestationAccount>,

    pub consumer: Signer<'info>,
}

#[derive(Accounts)]
pub struct VoidPaymentAttestation<'info> {
    #[account(
        seeds = [b"payment_config"],
        bump = config.bump,
    )]
    pub config: Account<'info, PaymentConfigAccount>,

    #[account(mut)]
    pub attestation: Account<'info, PaymentAttestationAccount>,

    pub attester: Signer<'info>,
}

#[event]
pub struct PaymentAttested {
    pub attestation: Pubkey,
    pub community: Pubkey,
    pub tier: Pubkey,
    pub recipient_wallet: Pubkey,
}

#[event]
pub struct PaymentAttestationConsumed {
    pub attestation: Pubkey,
    pub consumer: Pubkey,
}

#[event]
pub struct PaymentAttestationVoided {
    pub attestation: Pubkey,
}

#[error_code]
pub enum PaymentAttestationError {
    #[msg("Caller is not authorized for this payment attestation")]
    Unauthorized,
    #[msg("Payment attestation has already been consumed")]
    AlreadyConsumed,
    #[msg("Payment attestation has expired")]
    AttestationExpired,
    #[msg("Payment attestation has been voided")]
    AttestationVoided,
    #[msg("Payment attestation has already been voided")]
    AlreadyVoided,
    #[msg("Payment amount must be greater than zero")]
    InvalidAmount,
    #[msg("Provider environment is invalid")]
    InvalidProviderEnvironment,
}
