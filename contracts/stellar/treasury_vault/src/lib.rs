#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token,
    Address, Env, String, Vec,
};

const MAX_SIGNERS: u32 = 20;

#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub community_id: String,
    /// Token contract address — use the native XLM token or BRZA token address.
    pub token: Address,
    pub signers: Vec<Address>,
    pub threshold: u32,
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
pub enum DataKey {
    Config,
    NextId,
    Proposal(u64),
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
        signers: Vec<Address>,
        threshold: u32,
    ) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }
        if signers.is_empty() {
            panic!("at least one signer required");
        }
        if signers.len() as u32 > MAX_SIGNERS {
            panic!("too many signers");
        }
        if threshold == 0 || threshold > signers.len() as u32 {
            panic!("threshold out of range");
        }

        env.storage().instance().set(&DataKey::Config, &Config {
            community_id,
            token,
            signers,
            threshold,
        });
        env.storage().instance().set(&DataKey::NextId, &0u64);
    }

    /// Propose a payment. Any signer can propose; the proposer counts as the first approval.
    pub fn propose(env: Env, proposer: Address, to: Address, amount: i128, memo: String) -> u64 {
        proposer.require_auth();
        let config = Self::load_config(&env);
        Self::assert_signer(&config.signers, &proposer);

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

        env.storage().persistent().set(&DataKey::Proposal(id), &proposal);
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

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("proposal not found"));

        if proposal.executed {
            panic!("already executed");
        }
        if proposal.approvals.len() as u32 < config.threshold {
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
        token::Client::new(&env, &config.token)
            .transfer(&from, &env.current_contract_address(), &amount);

        env.events()
            .publish((symbol_short!("deposit"),), (from, amount));
    }

    pub fn balance(env: Env) -> i128 {
        let config = Self::load_config(&env);
        token::Client::new(&env, &config.token)
            .balance(&env.current_contract_address())
    }

    pub fn get_proposal(env: Env, proposal_id: u64) -> Option<Proposal> {
        env.storage().persistent().get(&DataKey::Proposal(proposal_id))
    }

    pub fn get_config(env: Env) -> Config {
        Self::load_config(&env)
    }

    fn load_config(env: &Env) -> Config {
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

    fn vec_contains(vec: &Vec<Address>, target: &Address) -> bool {
        for item in vec.iter() {
            if item == *target {
                return true;
            }
        }
        false
    }
}
