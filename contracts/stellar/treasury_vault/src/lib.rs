// SPDX-License-Identifier: BUSL-1.1
#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, BytesN, Env, String, Vec,
};

const MAX_SIGNERS: u32 = 20;
const MAX_PAYOUT_LIFETIME_SECS: u64 = 30 * 24 * 60 * 60;
const TTL_RENEWAL_THRESHOLD: u32 = 1_000_000;
const TTL_RENEWAL_TARGET: u32 = 5_000_000;

#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub community_id: String,
    /// Token contract address. Deploy the first production vault with Circle USDC.
    pub token: Address,
    /// May propose payouts but has no transfer authority.
    pub coordinator: Address,
    pub signers: Vec<Address>,
    pub threshold: u32,
    pub paused: bool,
    pub config_nonce: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub id: u64,
    pub to: Address,
    pub amount: i128,
    pub memo: String,
    pub approvals: Vec<Address>,
    pub executed: bool,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum PayoutStatus {
    AwaitingApproval,
    Ready,
    Executed,
    Cancelled,
    Expired,
}

#[contracttype]
#[derive(Clone)]
pub struct BountyPayout {
    pub payout_ref: BytesN<32>,
    pub bounty_ref: BytesN<32>,
    pub recipient: Address,
    pub amount: i128,
    pub memo_hash: BytesN<32>,
    pub approvals: Vec<Address>,
    pub cancellation_approvals: Vec<Address>,
    pub status: PayoutStatus,
    pub created_at: u64,
    pub expires_at: u64,
    pub executed_at: Option<u64>,
}

#[contracttype]
#[derive(Clone)]
pub enum ConfigActionKind {
    Update(Address, Vec<Address>, u32),
    Pause(bool),
}

#[contracttype]
#[derive(Clone)]
pub struct ConfigAction {
    pub action_ref: BytesN<32>,
    pub kind: ConfigActionKind,
    pub approvals: Vec<Address>,
    pub executed: bool,
    pub created_at: u64,
    pub config_nonce: u64,
}

#[contracttype]
pub enum DataKey {
    Config,
    NextId,
    Proposal(u64),
    Payout(BytesN<32>),
    PayoutReference(BytesN<32>),
    ConfigAction(BytesN<32>),
}

#[contract]
pub struct TreasuryVaultContract;

#[contractimpl]
impl TreasuryVaultContract {
    /// Initialize the vault. `signers` are the multisig participants; `threshold` is
    /// the minimum number of approvals required to execute a payment proposal.
    pub fn initialize(
        env: Env,
        community_id: String,
        token: Address,
        coordinator: Address,
        signers: Vec<Address>,
        threshold: u32,
    ) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }
        Self::validate_signer_config(&signers, threshold);
        if coordinator == env.current_contract_address() {
            panic!("invalid coordinator");
        }

        env.storage().instance().set(
            &DataKey::Config,
            &Config {
                community_id,
                token,
                coordinator,
                signers,
                threshold,
                paused: false,
                config_nonce: 0,
            },
        );
        env.storage().instance().set(&DataKey::NextId, &0u64);
        Self::bump_instance_ttl(&env);
    }

    /// Propose a payment. Any signer can propose; the proposer counts as the first approval.
    pub fn propose(env: Env, proposer: Address, to: Address, amount: i128, memo: String) -> u64 {
        proposer.require_auth();
        let config = Self::load_config(&env);
        Self::assert_signer(&config.signers, &proposer);
        if config.paused {
            panic!("vault paused");
        }

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap();
        let mut approvals: Vec<Address> = Vec::new(&env);
        approvals.push_back(proposer.clone());

        let proposal = Proposal {
            id,
            to: to.clone(),
            amount,
            memo,
            approvals,
            executed: false,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Proposal(id), &proposal);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        env.events()
            .publish((symbol_short!("proposed"), id), (proposer, to, amount));
        id
    }

    /// Approve an open proposal. Each signer may approve at most once.
    pub fn approve(env: Env, signer: Address, proposal_id: u64) {
        signer.require_auth();
        let config = Self::load_config(&env);
        Self::assert_signer(&config.signers, &signer);

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("proposal not found"));

        if proposal.executed {
            panic!("already executed");
        }
        if Self::vec_contains(&proposal.approvals, &signer) {
            panic!("already approved");
        }

        proposal.approvals.push_back(signer.clone());
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        env.events()
            .publish((symbol_short!("approved"), proposal_id), signer);
    }

    /// Execute a proposal once it has reached the approval threshold.
    /// Anyone can call this after enough approvals are in.
    pub fn execute(env: Env, proposal_id: u64) {
        let config = Self::load_config(&env);
        if config.paused {
            panic!("vault paused");
        }

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("proposal not found"));

        if proposal.executed {
            panic!("already executed");
        }
        if proposal.approvals.len() < config.threshold {
            panic!("insufficient approvals");
        }

        proposal.executed = true;
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        token::Client::new(&env, &config.token).transfer(
            &env.current_contract_address(),
            &proposal.to,
            &proposal.amount,
        );

        env.events()
            .publish((symbol_short!("executed"), proposal_id), proposal.amount);
    }

    /// Deposit tokens into the treasury. Any address can fund it.
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let config = Self::load_config(&env);
        token::Client::new(&env, &config.token).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );

        env.events()
            .publish((symbol_short!("deposit"),), (from, amount));
    }

    /// Create a payout from an approved off-chain bounty record. The coordinator
    /// can propose, but community signers remain the only approval authority.
    pub fn propose_payout(
        env: Env,
        coordinator: Address,
        payout_ref: BytesN<32>,
        bounty_ref: BytesN<32>,
        recipient: Address,
        amount: i128,
        memo_hash: BytesN<32>,
        expires_at: u64,
    ) {
        coordinator.require_auth();
        let config = Self::load_config(&env);
        if config.paused {
            panic!("vault paused");
        }
        if coordinator != config.coordinator {
            panic!("unauthorized coordinator");
        }
        if recipient == env.current_contract_address() {
            panic!("invalid recipient");
        }
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let now = env.ledger().timestamp();
        if expires_at <= now || expires_at > now.saturating_add(MAX_PAYOUT_LIFETIME_SECS) {
            panic!("invalid expiry");
        }
        if env
            .storage()
            .persistent()
            .has(&DataKey::PayoutReference(payout_ref.clone()))
            || env
                .storage()
                .persistent()
                .has(&DataKey::Payout(payout_ref.clone()))
        {
            panic!("duplicate payout reference");
        }

        let payout = BountyPayout {
            payout_ref: payout_ref.clone(),
            bounty_ref: bounty_ref.clone(),
            recipient: recipient.clone(),
            amount,
            memo_hash,
            approvals: Vec::new(&env),
            cancellation_approvals: Vec::new(&env),
            status: PayoutStatus::AwaitingApproval,
            created_at: now,
            expires_at,
            executed_at: None,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Payout(payout_ref.clone()), &payout);
        env.storage()
            .persistent()
            .set(&DataKey::PayoutReference(payout_ref.clone()), &true);
        Self::bump_persistent_ttl(&env, &DataKey::Payout(payout_ref.clone()));
        Self::bump_persistent_ttl(&env, &DataKey::PayoutReference(payout_ref.clone()));
        env.events().publish(
            (symbol_short!("payprop"), payout_ref),
            (bounty_ref, recipient, amount, expires_at),
        );
    }

    pub fn approve_payout(env: Env, signer: Address, payout_ref: BytesN<32>) {
        signer.require_auth();
        let config = Self::load_config(&env);
        Self::assert_signer(&config.signers, &signer);
        let mut payout = Self::load_payout(&env, &payout_ref);
        Self::assert_payout_open(&env, &payout);
        if Self::vec_contains(&payout.approvals, &signer) {
            panic!("already approved");
        }
        payout.approvals.push_back(signer.clone());
        if payout.approvals.len() >= config.threshold {
            payout.status = PayoutStatus::Ready;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Payout(payout_ref.clone()), &payout);
        env.events().publish(
            (symbol_short!("payappr"), payout_ref.clone()),
            (signer, payout.approvals.len(), config.threshold),
        );
        if payout.status == PayoutStatus::Ready {
            env.events().publish(
                (symbol_short!("payready"), payout_ref),
                payout.approvals.len(),
            );
        }
    }

    pub fn revoke_approval(env: Env, signer: Address, payout_ref: BytesN<32>) {
        signer.require_auth();
        let config = Self::load_config(&env);
        Self::assert_signer(&config.signers, &signer);
        let mut payout = Self::load_payout(&env, &payout_ref);
        Self::assert_payout_open(&env, &payout);
        if !Self::vec_contains(&payout.approvals, &signer) {
            panic!("approval not found");
        }
        payout.approvals = Self::vec_without(&env, &payout.approvals, &signer);
        payout.status = if payout.approvals.len() >= config.threshold {
            PayoutStatus::Ready
        } else {
            PayoutStatus::AwaitingApproval
        };
        env.storage()
            .persistent()
            .set(&DataKey::Payout(payout_ref.clone()), &payout);
        env.events().publish(
            (symbol_short!("payrev"), payout_ref),
            (signer, payout.approvals.len()),
        );
    }

    /// Execution is permissionless after threshold so a relayer cannot hold funds hostage.
    pub fn execute_payout(env: Env, payout_ref: BytesN<32>) {
        let config = Self::load_config(&env);
        if config.paused {
            panic!("vault paused");
        }
        let mut payout = Self::load_payout(&env, &payout_ref);
        if payout.status != PayoutStatus::Ready {
            panic!("payout not ready");
        }
        if env.ledger().timestamp() > payout.expires_at {
            panic!("payout expired");
        }
        if payout.approvals.len() < config.threshold {
            panic!("insufficient approvals");
        }
        let client = token::Client::new(&env, &config.token);
        if client.balance(&env.current_contract_address()) < payout.amount {
            panic!("insufficient balance");
        }

        payout.status = PayoutStatus::Executed;
        payout.executed_at = Some(env.ledger().timestamp());
        env.storage()
            .persistent()
            .set(&DataKey::Payout(payout_ref.clone()), &payout);
        client.transfer(
            &env.current_contract_address(),
            &payout.recipient,
            &payout.amount,
        );
        env.events().publish(
            (symbol_short!("payexec"), payout_ref),
            (
                payout.bounty_ref,
                payout.recipient,
                payout.amount,
                config.token,
            ),
        );
    }

    /// Cancellation requires the same threshold as payment execution.
    pub fn cancel_payout(env: Env, signer: Address, payout_ref: BytesN<32>) {
        signer.require_auth();
        let config = Self::load_config(&env);
        Self::assert_signer(&config.signers, &signer);
        let mut payout = Self::load_payout(&env, &payout_ref);
        Self::assert_payout_open(&env, &payout);
        if Self::vec_contains(&payout.cancellation_approvals, &signer) {
            panic!("already approved cancellation");
        }
        payout.cancellation_approvals.push_back(signer.clone());
        if payout.cancellation_approvals.len() >= config.threshold {
            payout.status = PayoutStatus::Cancelled;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Payout(payout_ref.clone()), &payout);
        env.events().publish(
            (symbol_short!("paycancel"), payout_ref),
            (
                signer,
                payout.cancellation_approvals.len(),
                payout.status.clone(),
            ),
        );
    }

    pub fn mark_expired(env: Env, payout_ref: BytesN<32>) {
        let mut payout = Self::load_payout(&env, &payout_ref);
        if payout.status == PayoutStatus::Executed || payout.status == PayoutStatus::Cancelled {
            panic!("payout closed");
        }
        if env.ledger().timestamp() <= payout.expires_at {
            panic!("payout not expired");
        }
        payout.status = PayoutStatus::Expired;
        env.storage()
            .persistent()
            .set(&DataKey::Payout(payout_ref.clone()), &payout);
        env.events()
            .publish((symbol_short!("payexpire"), payout_ref), ());
    }

    pub fn propose_config_change(
        env: Env,
        signer: Address,
        action_ref: BytesN<32>,
        coordinator: Address,
        signers: Vec<Address>,
        threshold: u32,
    ) {
        Self::propose_action(
            &env,
            signer,
            action_ref,
            ConfigActionKind::Update(coordinator, signers, threshold),
        );
    }

    pub fn approve_config_change(env: Env, signer: Address, action_ref: BytesN<32>) {
        let action = Self::load_action(&env, &action_ref);
        match action.kind {
            ConfigActionKind::Update(..) => Self::approve_action(&env, signer, action_ref),
            _ => panic!("wrong action type"),
        }
    }

    pub fn execute_config_change(env: Env, action_ref: BytesN<32>) {
        let mut action = Self::load_action(&env, &action_ref);
        if action.executed {
            panic!("action already executed");
        }
        let mut config = Self::load_config(&env);
        if action.config_nonce != config.config_nonce {
            panic!("stale config action");
        }
        if action.approvals.len() < config.threshold {
            panic!("insufficient approvals");
        }
        match action.kind.clone() {
            ConfigActionKind::Update(coordinator, signers, threshold) => {
                Self::validate_signer_config(&signers, threshold);
                if coordinator == env.current_contract_address() {
                    panic!("invalid coordinator");
                }
                config.coordinator = coordinator;
                config.signers = signers;
                config.threshold = threshold;
                config.config_nonce = config.config_nonce.saturating_add(1);
            }
            _ => panic!("wrong action type"),
        }
        action.executed = true;
        env.storage().instance().set(&DataKey::Config, &config);
        env.storage()
            .persistent()
            .set(&DataKey::ConfigAction(action_ref.clone()), &action);
        env.events()
            .publish((symbol_short!("cfgexec"), action_ref), config.config_nonce);
    }

    pub fn propose_pause(env: Env, signer: Address, action_ref: BytesN<32>, paused: bool) {
        Self::propose_action(&env, signer, action_ref, ConfigActionKind::Pause(paused));
    }

    pub fn approve_pause(env: Env, signer: Address, action_ref: BytesN<32>) {
        let action = Self::load_action(&env, &action_ref);
        match action.kind {
            ConfigActionKind::Pause(..) => Self::approve_action(&env, signer, action_ref),
            _ => panic!("wrong action type"),
        }
    }

    pub fn execute_pause(env: Env, action_ref: BytesN<32>) {
        let mut action = Self::load_action(&env, &action_ref);
        if action.executed {
            panic!("action already executed");
        }
        let mut config = Self::load_config(&env);
        if action.config_nonce != config.config_nonce {
            panic!("stale config action");
        }
        if action.approvals.len() < config.threshold {
            panic!("insufficient approvals");
        }
        match action.kind.clone() {
            ConfigActionKind::Pause(paused) => config.paused = paused,
            _ => panic!("wrong action type"),
        }
        action.executed = true;
        env.storage().instance().set(&DataKey::Config, &config);
        env.storage()
            .persistent()
            .set(&DataKey::ConfigAction(action_ref.clone()), &action);
        env.events()
            .publish((symbol_short!("pause"), action_ref), config.paused);
    }

    pub fn balance(env: Env) -> i128 {
        let config = Self::load_config(&env);
        token::Client::new(&env, &config.token).balance(&env.current_contract_address())
    }

    pub fn get_proposal(env: Env, proposal_id: u64) -> Option<Proposal> {
        env.storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
    }

    pub fn get_payout(env: Env, payout_ref: BytesN<32>) -> Option<BountyPayout> {
        let key = DataKey::Payout(payout_ref);
        if !env.storage().persistent().has(&key) {
            return None;
        }
        Self::bump_persistent_ttl(&env, &key);
        env.storage().persistent().get(&key)
    }

    pub fn get_config(env: Env) -> Config {
        Self::load_config(&env)
    }

    fn load_config(env: &Env) -> Config {
        Self::bump_instance_ttl(env);
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    fn assert_signer(signers: &Vec<Address>, address: &Address) {
        if !Self::vec_contains(signers, address) {
            panic!("not a signer");
        }
    }

    fn validate_signer_config(signers: &Vec<Address>, threshold: u32) {
        if signers.is_empty() || signers.len() > MAX_SIGNERS {
            panic!("signer count out of range");
        }
        if threshold == 0 || threshold > signers.len() {
            panic!("threshold out of range");
        }
        for i in 0..signers.len() {
            let signer = signers.get(i).unwrap();
            for j in (i + 1)..signers.len() {
                if signer == signers.get(j).unwrap() {
                    panic!("duplicate signer");
                }
            }
        }
    }

    fn load_payout(env: &Env, payout_ref: &BytesN<32>) -> BountyPayout {
        let key = DataKey::Payout(payout_ref.clone());
        Self::bump_persistent_ttl(env, &key);
        Self::bump_persistent_ttl(env, &DataKey::PayoutReference(payout_ref.clone()));
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("payout not found"))
    }

    fn assert_payout_open(env: &Env, payout: &BountyPayout) {
        if payout.status == PayoutStatus::Executed
            || payout.status == PayoutStatus::Cancelled
            || payout.status == PayoutStatus::Expired
        {
            panic!("payout closed");
        }
        if env.ledger().timestamp() > payout.expires_at {
            panic!("payout expired");
        }
    }

    fn vec_without(env: &Env, values: &Vec<Address>, target: &Address) -> Vec<Address> {
        let mut next = Vec::new(env);
        for value in values.iter() {
            if value != *target {
                next.push_back(value);
            }
        }
        next
    }

    fn propose_action(env: &Env, signer: Address, action_ref: BytesN<32>, kind: ConfigActionKind) {
        signer.require_auth();
        let config = Self::load_config(env);
        Self::assert_signer(&config.signers, &signer);
        if env
            .storage()
            .persistent()
            .has(&DataKey::ConfigAction(action_ref.clone()))
        {
            panic!("duplicate action reference");
        }
        if let ConfigActionKind::Update(coordinator, signers, threshold) = &kind {
            if *coordinator == env.current_contract_address() {
                panic!("invalid coordinator");
            }
            Self::validate_signer_config(signers, *threshold);
        }
        let mut approvals = Vec::new(env);
        approvals.push_back(signer);
        let action = ConfigAction {
            action_ref: action_ref.clone(),
            kind,
            approvals,
            executed: false,
            created_at: env.ledger().timestamp(),
            config_nonce: config.config_nonce,
        };
        env.storage()
            .persistent()
            .set(&DataKey::ConfigAction(action_ref.clone()), &action);
        Self::bump_persistent_ttl(env, &DataKey::ConfigAction(action_ref.clone()));
        env.events()
            .publish((symbol_short!("cfgprop"), action_ref), ());
    }

    fn approve_action(env: &Env, signer: Address, action_ref: BytesN<32>) {
        signer.require_auth();
        let config = Self::load_config(env);
        Self::assert_signer(&config.signers, &signer);
        let mut action = Self::load_action(env, &action_ref);
        if action.executed {
            panic!("action already executed");
        }
        if Self::vec_contains(&action.approvals, &signer) {
            panic!("already approved");
        }
        action.approvals.push_back(signer.clone());
        env.storage()
            .persistent()
            .set(&DataKey::ConfigAction(action_ref.clone()), &action);
        env.events().publish(
            (symbol_short!("cfgappr"), action_ref),
            (signer, action.approvals.len()),
        );
    }

    fn load_action(env: &Env, action_ref: &BytesN<32>) -> ConfigAction {
        let key = DataKey::ConfigAction(action_ref.clone());
        Self::bump_persistent_ttl(env, &key);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("action not found"))
    }

    fn bump_instance_ttl(env: &Env) {
        env.storage()
            .instance()
            .extend_ttl(TTL_RENEWAL_THRESHOLD, TTL_RENEWAL_TARGET);
    }

    fn bump_persistent_ttl(env: &Env, key: &DataKey) {
        if env.storage().persistent().has(key) {
            env.storage()
                .persistent()
                .extend_ttl(key, TTL_RENEWAL_THRESHOLD, TTL_RENEWAL_TARGET);
        }
    }

    fn vec_contains(vec: &Vec<Address>, target: &Address) -> bool {
        for item in vec.iter() {
            if item == *target {
                return true;
            }
        }
        false
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token::{Client as TokenClient, StellarAssetClient},
        vec, Env,
    };

    struct Harness<'a> {
        env: Env,
        client: TreasuryVaultContractClient<'a>,
        token: Address,
        token_admin_client: StellarAssetClient<'a>,
        vault_address: Address,
        coordinator: Address,
        signers: Vec<Address>,
    }

    fn setup(threshold: u32, signer_count: u32) -> Harness<'static> {
        let env = Env::default();
        env.mock_all_auths();

        let token_admin = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(token_admin);
        let token = sac.address();
        let token_admin_client = StellarAssetClient::new(&env, &token);

        let vault_address = env.register_contract(None, TreasuryVaultContract);
        let client = TreasuryVaultContractClient::new(&env, &vault_address);
        let coordinator = Address::generate(&env);

        let mut signers: Vec<Address> = Vec::new(&env);
        for _ in 0..signer_count {
            signers.push_back(Address::generate(&env));
        }

        client.initialize(
            &String::from_str(&env, "baraza-kisumu"),
            &token,
            &coordinator,
            &signers,
            &threshold,
        );

        Harness {
            env,
            client,
            token,
            token_admin_client,
            vault_address,
            coordinator,
            signers,
        }
    }

    fn reference(env: &Env, byte: u8) -> BytesN<32> {
        BytesN::from_array(env, &[byte; 32])
    }

    fn propose_bounty_payout(
        h: &Harness<'_>,
        payout_byte: u8,
        amount: i128,
    ) -> (BytesN<32>, Address) {
        let payout_ref = reference(&h.env, payout_byte);
        let recipient = Address::generate(&h.env);
        h.client.propose_payout(
            &h.coordinator,
            &payout_ref,
            &reference(&h.env, payout_byte.saturating_add(1)),
            &recipient,
            &amount,
            &reference(&h.env, payout_byte.saturating_add(2)),
            &(h.env.ledger().timestamp() + 3_600),
        );
        (payout_ref, recipient)
    }

    #[test]
    fn test_full_multisig_flow_executes_token_transfer() {
        let h = setup(2, 3);

        // Fund the vault so it can pay out.
        h.token_admin_client.mint(&h.vault_address, &1_000);

        let recipient = Address::generate(&h.env);
        let memo = String::from_str(&h.env, "operational payout");

        let proposal_id = h
            .client
            .propose(&h.signers.get(0).unwrap(), &recipient, &400, &memo);
        // Proposer counts as the first approval; one more reaches threshold=2.
        h.client.approve(&h.signers.get(1).unwrap(), &proposal_id);

        h.client.execute(&proposal_id);

        let token_client = TokenClient::new(&h.env, &h.token);
        assert_eq!(token_client.balance(&recipient), 400);
        assert_eq!(token_client.balance(&h.vault_address), 600);

        let proposal = h.client.get_proposal(&proposal_id).unwrap();
        assert!(proposal.executed);
    }

    #[test]
    #[should_panic(expected = "insufficient approvals")]
    fn test_execute_below_threshold_rejected() {
        let h = setup(3, 3);
        h.token_admin_client.mint(&h.vault_address, &500);

        let recipient = Address::generate(&h.env);
        let proposal_id = h.client.propose(
            &h.signers.get(0).unwrap(),
            &recipient,
            &100,
            &String::from_str(&h.env, "early"),
        );
        // Only 1 approval (proposer) — threshold is 3.
        h.client.execute(&proposal_id);
    }

    #[test]
    #[should_panic(expected = "already approved")]
    fn test_double_approval_by_same_signer_rejected() {
        let h = setup(2, 3);
        let recipient = Address::generate(&h.env);
        let proposal_id = h.client.propose(
            &h.signers.get(0).unwrap(),
            &recipient,
            &50,
            &String::from_str(&h.env, "dup"),
        );
        // Proposer already counts as approval 1 — re-approving must fail.
        h.client.approve(&h.signers.get(0).unwrap(), &proposal_id);
    }

    #[test]
    #[should_panic(expected = "not a signer")]
    fn test_propose_by_non_signer_rejected() {
        let h = setup(2, 3);
        let outsider = Address::generate(&h.env);
        let recipient = Address::generate(&h.env);
        h.client.propose(
            &outsider,
            &recipient,
            &10,
            &String::from_str(&h.env, "outsider"),
        );
    }

    #[test]
    #[should_panic(expected = "not a signer")]
    fn test_approve_by_non_signer_rejected() {
        let h = setup(2, 3);
        let recipient = Address::generate(&h.env);
        let proposal_id = h.client.propose(
            &h.signers.get(0).unwrap(),
            &recipient,
            &10,
            &String::from_str(&h.env, "p"),
        );
        let outsider = Address::generate(&h.env);
        h.client.approve(&outsider, &proposal_id);
    }

    #[test]
    #[should_panic(expected = "already executed")]
    fn test_execute_twice_rejected() {
        let h = setup(2, 2);
        h.token_admin_client.mint(&h.vault_address, &500);
        let recipient = Address::generate(&h.env);
        let proposal_id = h.client.propose(
            &h.signers.get(0).unwrap(),
            &recipient,
            &50,
            &String::from_str(&h.env, "once"),
        );
        h.client.approve(&h.signers.get(1).unwrap(), &proposal_id);
        h.client.execute(&proposal_id);
        // Second execute must trip the executed flag.
        h.client.execute(&proposal_id);
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_propose_non_positive_amount_rejected() {
        let h = setup(2, 2);
        let recipient = Address::generate(&h.env);
        h.client.propose(
            &h.signers.get(0).unwrap(),
            &recipient,
            &0,
            &String::from_str(&h.env, "zero"),
        );
    }

    #[test]
    fn test_deposit_increases_balance() {
        let h = setup(2, 2);
        let depositor = Address::generate(&h.env);
        h.token_admin_client.mint(&depositor, &900);

        h.client.deposit(&depositor, &900);
        assert_eq!(h.client.balance(), 900);

        let token_client = TokenClient::new(&h.env, &h.token);
        assert_eq!(token_client.balance(&depositor), 0);
    }

    #[test]
    #[should_panic(expected = "threshold out of range")]
    fn test_initialize_threshold_above_signer_count_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let token_admin = Address::generate(&env);
        let token = env
            .register_stellar_asset_contract_v2(token_admin)
            .address();

        let vault = env.register_contract(None, TreasuryVaultContract);
        let client = TreasuryVaultContractClient::new(&env, &vault);

        let signers = vec![&env, Address::generate(&env), Address::generate(&env)];
        let coordinator = Address::generate(&env);
        client.initialize(
            &String::from_str(&env, "x"),
            &token,
            &coordinator,
            &signers,
            &4, // threshold > signers.len()
        );
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice_rejected() {
        let h = setup(1, 1);
        h.client.initialize(
            &String::from_str(&h.env, "y"),
            &h.token,
            &h.coordinator,
            &h.signers,
            &1,
        );
    }

    #[test]
    fn test_bounty_payout_executes_after_threshold() {
        let h = setup(2, 3);
        h.token_admin_client.mint(&h.vault_address, &1_000);
        let (payout_ref, recipient) = propose_bounty_payout(&h, 10, 425);

        h.client
            .approve_payout(&h.signers.get(0).unwrap(), &payout_ref);
        h.client
            .approve_payout(&h.signers.get(1).unwrap(), &payout_ref);
        assert_eq!(
            h.client.get_payout(&payout_ref).unwrap().status,
            PayoutStatus::Ready
        );

        h.client.execute_payout(&payout_ref);

        let token_client = TokenClient::new(&h.env, &h.token);
        assert_eq!(token_client.balance(&recipient), 425);
        assert_eq!(token_client.balance(&h.vault_address), 575);
        assert_eq!(
            h.client.get_payout(&payout_ref).unwrap().status,
            PayoutStatus::Executed
        );
    }

    #[test]
    #[should_panic(expected = "duplicate payout reference")]
    fn test_duplicate_payout_reference_rejected() {
        let h = setup(2, 3);
        let payout_ref = reference(&h.env, 20);
        let recipient = Address::generate(&h.env);
        let expires_at = h.env.ledger().timestamp() + 3_600;
        h.client.propose_payout(
            &h.coordinator,
            &payout_ref,
            &reference(&h.env, 21),
            &recipient,
            &100,
            &reference(&h.env, 22),
            &expires_at,
        );
        h.client.propose_payout(
            &h.coordinator,
            &payout_ref,
            &reference(&h.env, 23),
            &recipient,
            &100,
            &reference(&h.env, 24),
            &expires_at,
        );
    }

    #[test]
    #[should_panic(expected = "already approved")]
    fn test_duplicate_payout_approval_rejected() {
        let h = setup(2, 3);
        let (payout_ref, _) = propose_bounty_payout(&h, 25, 100);
        let signer = h.signers.get(0).unwrap();
        h.client.approve_payout(&signer, &payout_ref);
        h.client.approve_payout(&signer, &payout_ref);
    }

    #[test]
    #[should_panic(expected = "unauthorized coordinator")]
    fn test_payout_requires_configured_coordinator() {
        let h = setup(2, 3);
        h.client.propose_payout(
            &Address::generate(&h.env),
            &reference(&h.env, 30),
            &reference(&h.env, 31),
            &Address::generate(&h.env),
            &100,
            &reference(&h.env, 32),
            &(h.env.ledger().timestamp() + 3_600),
        );
    }

    #[test]
    fn test_revocation_removes_ready_status() {
        let h = setup(2, 3);
        let (payout_ref, _) = propose_bounty_payout(&h, 40, 100);
        let first = h.signers.get(0).unwrap();
        h.client.approve_payout(&first, &payout_ref);
        h.client
            .approve_payout(&h.signers.get(1).unwrap(), &payout_ref);
        h.client.revoke_approval(&first, &payout_ref);

        let payout = h.client.get_payout(&payout_ref).unwrap();
        assert_eq!(payout.status, PayoutStatus::AwaitingApproval);
        assert_eq!(payout.approvals.len(), 1);
    }

    #[test]
    fn test_insufficient_balance_rolls_back_execution_state() {
        let h = setup(2, 3);
        let (payout_ref, _) = propose_bounty_payout(&h, 45, 100);
        h.client
            .approve_payout(&h.signers.get(0).unwrap(), &payout_ref);
        h.client
            .approve_payout(&h.signers.get(1).unwrap(), &payout_ref);

        assert!(h.client.try_execute_payout(&payout_ref).is_err());
        assert_eq!(
            h.client.get_payout(&payout_ref).unwrap().status,
            PayoutStatus::Ready
        );
    }

    #[test]
    fn test_cancellation_requires_threshold() {
        let h = setup(2, 3);
        let (payout_ref, _) = propose_bounty_payout(&h, 50, 100);
        h.client
            .cancel_payout(&h.signers.get(0).unwrap(), &payout_ref);
        assert_eq!(
            h.client.get_payout(&payout_ref).unwrap().status,
            PayoutStatus::AwaitingApproval
        );
        h.client
            .cancel_payout(&h.signers.get(1).unwrap(), &payout_ref);
        assert_eq!(
            h.client.get_payout(&payout_ref).unwrap().status,
            PayoutStatus::Cancelled
        );
    }

    #[test]
    fn test_expired_payout_can_be_closed() {
        let h = setup(2, 3);
        let (payout_ref, _) = propose_bounty_payout(&h, 60, 100);
        h.env
            .ledger()
            .set_timestamp(h.env.ledger().timestamp() + 3_601);
        h.client.mark_expired(&payout_ref);
        assert_eq!(
            h.client.get_payout(&payout_ref).unwrap().status,
            PayoutStatus::Expired
        );
    }

    #[test]
    #[should_panic(expected = "vault paused")]
    fn test_threshold_pause_blocks_payout_execution() {
        let h = setup(2, 3);
        h.token_admin_client.mint(&h.vault_address, &500);
        let (payout_ref, _) = propose_bounty_payout(&h, 70, 100);
        h.client
            .approve_payout(&h.signers.get(0).unwrap(), &payout_ref);
        h.client
            .approve_payout(&h.signers.get(1).unwrap(), &payout_ref);

        let action_ref = reference(&h.env, 73);
        h.client
            .propose_pause(&h.signers.get(0).unwrap(), &action_ref, &true);
        h.client
            .approve_pause(&h.signers.get(1).unwrap(), &action_ref);
        h.client.execute_pause(&action_ref);
        h.client.execute_payout(&payout_ref);
    }

    #[test]
    fn test_signer_rotation_requires_old_threshold() {
        let h = setup(2, 3);
        let action_ref = reference(&h.env, 80);
        let new_signers = vec![
            &h.env,
            Address::generate(&h.env),
            Address::generate(&h.env),
            Address::generate(&h.env),
        ];
        h.client.propose_config_change(
            &h.signers.get(0).unwrap(),
            &action_ref,
            &h.coordinator,
            &new_signers,
            &2,
        );
        assert!(h.client.try_execute_config_change(&action_ref).is_err());
        h.client
            .approve_config_change(&h.signers.get(1).unwrap(), &action_ref);
        h.client.execute_config_change(&action_ref);

        let config = h.client.get_config();
        assert_eq!(config.signers, new_signers);
        assert_eq!(config.threshold, 2);
        assert_eq!(config.config_nonce, 1);
    }

    #[test]
    #[should_panic(expected = "stale config action")]
    fn test_pre_rotation_action_cannot_execute_after_rotation() {
        let h = setup(2, 3);
        let stale_ref = reference(&h.env, 85);
        h.client
            .propose_pause(&h.signers.get(0).unwrap(), &stale_ref, &true);
        h.client
            .approve_pause(&h.signers.get(1).unwrap(), &stale_ref);

        let rotate_ref = reference(&h.env, 86);
        let new_signers = vec![&h.env, Address::generate(&h.env), Address::generate(&h.env)];
        h.client.propose_config_change(
            &h.signers.get(0).unwrap(),
            &rotate_ref,
            &h.coordinator,
            &new_signers,
            &2,
        );
        h.client
            .approve_config_change(&h.signers.get(1).unwrap(), &rotate_ref);
        h.client.execute_config_change(&rotate_ref);

        h.client.execute_pause(&stale_ref);
    }
}
