// SPDX-License-Identifier: BUSL-1.1
#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String,
};

#[contracttype]
#[derive(Clone)]
pub struct Community {
    pub community_id: String,
    pub name: String,
    pub admin: Address,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Owner,
    Community(String),
}

#[contract]
pub struct CommunityRegistryContract;

#[contractimpl]
impl CommunityRegistryContract {
    /// One-time setup — caller becomes the protocol owner who can register communities.
    pub fn initialize(env: Env, owner: Address) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic!("already initialized");
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
    }

    /// Register a new community. Owner only.
    pub fn register(env: Env, community_id: String, name: String, admin: Address) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();

        if community_id.len() == 0 {
            panic!("community_id required");
        }
        if env
            .storage()
            .persistent()
            .has(&DataKey::Community(community_id.clone()))
        {
            panic!("community already registered");
        }

        let community = Community {
            community_id: community_id.clone(),
            name,
            admin,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Community(community_id.clone()), &community);

        env.events()
            .publish((symbol_short!("register"),), community_id);
    }

    pub fn get(env: Env, community_id: String) -> Option<Community> {
        env.storage()
            .persistent()
            .get(&DataKey::Community(community_id))
    }

    pub fn exists(env: Env, community_id: String) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Community(community_id))
    }

    /// Transfer community admin to a new address. Current admin only.
    pub fn update_admin(env: Env, community_id: String, new_admin: Address) {
        let mut community: Community = env
            .storage()
            .persistent()
            .get(&DataKey::Community(community_id.clone()))
            .unwrap_or_else(|| panic!("community not found"));

        community.admin.require_auth();
        community.admin = new_admin;

        env.storage()
            .persistent()
            .set(&DataKey::Community(community_id), &community);
    }

    pub fn set_owner(env: Env, new_owner: Address) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }

    pub fn owner(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Owner).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_register_and_get() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, CommunityRegistryContract);
        let client = CommunityRegistryContractClient::new(&env, &id);

        let owner = Address::generate(&env);
        let admin = Address::generate(&env);
        client.initialize(&owner);

        let community_id = String::from_str(&env, "baraza-nairobi");
        let name = String::from_str(&env, "Baraza Nairobi");
        client.register(&community_id, &name, &admin);

        assert!(client.exists(&community_id));
        let community = client.get(&community_id).unwrap();
        assert_eq!(community.name, name);
        assert_eq!(community.admin, admin);
    }

    #[test]
    #[should_panic(expected = "community already registered")]
    fn test_duplicate_registration_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, CommunityRegistryContract);
        let client = CommunityRegistryContractClient::new(&env, &id);

        let owner = Address::generate(&env);
        let admin = Address::generate(&env);
        client.initialize(&owner);

        let community_id = String::from_str(&env, "baraza-lagos");
        let name = String::from_str(&env, "Baraza Lagos");
        client.register(&community_id, &name, &admin);
        client.register(&community_id, &name, &admin);
    }
}


