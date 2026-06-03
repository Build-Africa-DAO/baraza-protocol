#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Symbol, Val, Vec,
};

fn require_member(env: &Env, community_id: &String, voter: &Address) {
    let membership: Address = env.storage().instance().get(&DataKey::Membership).unwrap();
    let args: Vec<Val> = soroban_sdk::vec![
        env,
        community_id.clone().into(),
        voter.clone().into(),
    ];
    let is_member: bool = env.invoke_contract(&membership, &Symbol::new(env, "is_member"), args);
    if !is_member {
        panic!("not a member");
    }
}

/// 7 days in seconds — default voting window.
const DEFAULT_VOTING_PERIOD: u64 = 7 * 24 * 60 * 60;

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Failed,
    Executed,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub id: u64,
    pub community_id: String,
    pub title: String,
    pub description: String,
    pub proposer: Address,
    pub for_votes: u32,
    pub against_votes: u32,
    pub status: ProposalStatus,
    pub deadline: u64,
    pub executed: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Membership,
    VotingPeriod,
    NextId,
    Proposal(u64),
    Voted(u64, Address),
}

#[contract]
pub struct GovernanceContract;

#[contractimpl]
impl GovernanceContract {
    /// One-time setup.
    /// `membership` is the address of the deployed membership contract.
    /// `voting_period` overrides the default 7-day window (in seconds).
    pub fn initialize(
        env: Env,
        admin: Address,
        membership: Address,
        voting_period: Option<u64>,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Membership, &membership);
        env.storage().instance().set(
            &DataKey::VotingPeriod,
            &voting_period.unwrap_or(DEFAULT_VOTING_PERIOD),
        );
        env.storage().instance().set(&DataKey::NextId, &0u64);
    }

    /// Create a governance proposal for a community.
    /// The proposer must authorize the call.
    pub fn create_proposal(
        env: Env,
        proposer: Address,
        community_id: String,
        title: String,
        description: String,
    ) -> u64 {
        proposer.require_auth();

        if title.len() == 0 {
            panic!("title required");
        }

        require_member(&env, &community_id, &proposer);

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap();
        let period: u64 = env.storage().instance().get(&DataKey::VotingPeriod).unwrap();
        let deadline = env.ledger().timestamp() + period;

        let proposal = Proposal {
            id,
            community_id: community_id.clone(),
            title,
            description,
            proposer: proposer.clone(),
            for_votes: 0,
            against_votes: 0,
            status: ProposalStatus::Active,
            deadline,
            executed: false,
        };

        env.storage().persistent().set(&DataKey::Proposal(id), &proposal);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));

        env.events()
            .publish((symbol_short!("proposed"), id), (proposer, community_id));
        id
    }

    /// Cast a vote on an active proposal.
    /// `support = true` is a FOR vote; `false` is AGAINST.
    pub fn vote(env: Env, voter: Address, proposal_id: u64, support: bool) {
        voter.require_auth();

        let voted_key = DataKey::Voted(proposal_id, voter.clone());
        if env
            .storage()
            .persistent()
            .get::<DataKey, bool>(&voted_key)
            .unwrap_or(false)
        {
            panic!("already voted");
        }

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("proposal not found"));

        require_member(&env, &proposal.community_id, &voter);

        if proposal.status != ProposalStatus::Active {
            panic!("proposal not active");
        }
        if env.ledger().timestamp() > proposal.deadline {
            panic!("voting period ended");
        }

        if support {
            proposal.for_votes += 1;
        } else {
            proposal.against_votes += 1;
        }

        env.storage().persistent().set(&DataKey::Proposal(proposal_id), &proposal);
        env.storage().persistent().set(&voted_key, &true);

        env.events()
            .publish((symbol_short!("voted"), proposal_id), (voter, support));
    }

    /// Finalize a proposal once its deadline has passed.
    /// Sets status to Passed or Failed based on vote totals. Anyone can call this.
    pub fn finalize(env: Env, proposal_id: u64) -> ProposalStatus {
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("proposal not found"));

        if proposal.status != ProposalStatus::Active {
            panic!("already finalized");
        }
        if env.ledger().timestamp() <= proposal.deadline {
            panic!("voting period not ended");
        }

        proposal.status = if proposal.for_votes > proposal.against_votes {
            ProposalStatus::Passed
        } else {
            ProposalStatus::Failed
        };

        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal.clone());

        env.events()
            .publish((symbol_short!("final"), proposal_id), proposal.for_votes);

        proposal.status
    }

    /// Mark a passed proposal as executed. Admin only.
    /// Call this after any on-chain or off-chain action the proposal authorized has been taken.
    pub fn mark_executed(env: Env, proposal_id: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("proposal not found"));

        if proposal.status != ProposalStatus::Passed {
            panic!("proposal has not passed");
        }

        proposal.status = ProposalStatus::Executed;
        proposal.executed = true;
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        env.events()
            .publish((symbol_short!("executed"), proposal_id), proposal_id);
    }

    /// Cancel an active proposal. Proposer or admin only.
    pub fn cancel(env: Env, caller: Address, proposal_id: u64) {
        caller.require_auth();

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("proposal not found"));

        if proposal.status != ProposalStatus::Active {
            panic!("can only cancel active proposals");
        }

        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != proposal.proposer && caller != admin {
            panic!("only the proposer or admin can cancel");
        }

        proposal.status = ProposalStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        env.events()
            .publish((symbol_short!("cancel"), proposal_id), caller);
    }

    pub fn get_proposal(env: Env, proposal_id: u64) -> Option<Proposal> {
        env.storage().persistent().get(&DataKey::Proposal(proposal_id))
    }

    pub fn has_voted(env: Env, proposal_id: u64, voter: Address) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, bool>(&DataKey::Voted(proposal_id, voter))
            .unwrap_or(false)
    }

    pub fn set_voting_period(env: Env, period: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        if period == 0 {
            panic!("voting period must be positive");
        }
        env.storage().instance().set(&DataKey::VotingPeriod, &period);
    }

    pub fn voting_period(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::VotingPeriod).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, GovernanceContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, GovernanceContract);
        let client = GovernanceContractClient::new(&env, &id);
        (env, client)
    }

    #[test]
    fn test_full_proposal_lifecycle() {
        let (env, client) = setup();
        let admin = Address::generate(&env);
        let membership = Address::generate(&env);
        client.initialize(&admin, &membership, &None);

        let proposer = Address::generate(&env);
        let community_id = String::from_str(&env, "baraza-dar");
        let title = String::from_str(&env, "Fund the well");
        let desc = String::from_str(&env, "Build a water well in the community centre.");

        let proposal_id = client.create_proposal(&proposer, &community_id, &title, &desc);
        assert_eq!(proposal_id, 0);

        let voter_a = Address::generate(&env);
        let voter_b = Address::generate(&env);
        let voter_c = Address::generate(&env);

        client.vote(&voter_a, &proposal_id, &true);
        client.vote(&voter_b, &proposal_id, &true);
        client.vote(&voter_c, &proposal_id, &false);

        assert!(client.has_voted(&proposal_id, &voter_a));

        // Advance ledger time past the voting deadline.
        let period = client.voting_period();
        env.ledger().with_mut(|l| l.timestamp += period + 1);

        let status = client.finalize(&proposal_id);
        assert_eq!(status, ProposalStatus::Passed);

        client.mark_executed(&proposal_id);
        let proposal = client.get_proposal(&proposal_id).unwrap();
        assert_eq!(proposal.status, ProposalStatus::Executed);
        assert!(proposal.executed);
    }

    #[test]
    #[should_panic(expected = "already voted")]
    fn test_double_vote_rejected() {
        let (env, client) = setup();
        let admin = Address::generate(&env);
        let membership = Address::generate(&env);
        client.initialize(&admin, &membership, &None);

        let proposer = Address::generate(&env);
        let community_id = String::from_str(&env, "baraza-kigali");
        let title = String::from_str(&env, "New rule");
        let desc = String::from_str(&env, "Proposal description.");

        let proposal_id = client.create_proposal(&proposer, &community_id, &title, &desc);
        let voter = Address::generate(&env);
        client.vote(&voter, &proposal_id, &true);
        client.vote(&voter, &proposal_id, &true);
    }

    #[test]
    fn test_failed_proposal_when_against_wins() {
        let (env, client) = setup();
        let admin = Address::generate(&env);
        let membership = Address::generate(&env);
        client.initialize(&admin, &membership, &None);

        let proposer = Address::generate(&env);
        let community_id = String::from_str(&env, "baraza-lusaka");
        let title = String::from_str(&env, "Rejected idea");
        let desc = String::from_str(&env, "This will not pass.");

        let proposal_id = client.create_proposal(&proposer, &community_id, &title, &desc);
        let voter_a = Address::generate(&env);
        let voter_b = Address::generate(&env);
        client.vote(&voter_a, &proposal_id, &false);
        client.vote(&voter_b, &proposal_id, &false);

        let period = client.voting_period();
        env.ledger().with_mut(|l| l.timestamp += period + 1);

        let status = client.finalize(&proposal_id);
        assert_eq!(status, ProposalStatus::Failed);
    }
}
