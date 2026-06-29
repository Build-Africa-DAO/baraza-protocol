// SPDX-License-Identifier: BUSL-1.1
#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, BytesN, Env, String,
};

/// On-chain record of a verified Stellar XLM payment.
/// The admin (a trusted server key) calls `attest` after the off-chain
/// verify-payment API confirms the Horizon transaction.
#[contracttype]
#[derive(Clone)]
pub struct PaymentRecord {
    pub tx_hash: BytesN<32>,
    pub community_id: String,
    /// Amount in stroops (1 XLM = 10_000_000 stroops).
    pub amount: i128,
    pub payer: Address,
    pub ledger: u32,
    pub attested_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Payment(BytesN<32>),
}

#[contract]
pub struct PaymentAttestationContract;

#[contractimpl]
impl PaymentAttestationContract {
    /// One-time setup — caller becomes the attestation admin.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Record a verified off-chain Stellar payment on-chain. Admin only.
    /// `tx_hash` is the 32-byte raw hash of the Stellar transaction.
    pub fn attest(
        env: Env,
        tx_hash: BytesN<32>,
        community_id: String,
        amount: i128,
        payer: Address,
        ledger: u32,
    ) -> PaymentRecord {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }
        if env.storage().persistent().has(&DataKey::Payment(tx_hash.clone())) {
            panic!("tx_hash already attested");
        }

        let record = PaymentRecord {
            tx_hash: tx_hash.clone(),
            community_id,
            amount,
            payer,
            ledger,
            attested_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Payment(tx_hash.clone()), &record);

        env.events()
            .publish((symbol_short!("attested"), tx_hash), record.clone());

        record
    }

    pub fn get_payment(env: Env, tx_hash: BytesN<32>) -> Option<PaymentRecord> {
        env.storage().persistent().get(&DataKey::Payment(tx_hash))
    }

    pub fn has_payment(env: Env, tx_hash: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Payment(tx_hash))
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_attest_and_lookup() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, PaymentAttestationContract);
        let client = PaymentAttestationContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let tx_hash = BytesN::from_array(&env, &[1u8; 32]);
        let community_id = String::from_str(&env, "community-abc");
        let payer = Address::generate(&env);

        let record = client.attest(&tx_hash, &community_id, &100_000_000, &payer, &1000);
        assert_eq!(record.amount, 100_000_000);
        assert_eq!(record.ledger, 1000);
        assert!(client.has_payment(&tx_hash));

        let fetched = client.get_payment(&tx_hash).unwrap();
        assert_eq!(fetched.community_id, community_id);
    }

    #[test]
    #[should_panic(expected = "tx_hash already attested")]
    fn test_duplicate_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, PaymentAttestationContract);
        let client = PaymentAttestationContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let tx_hash = BytesN::from_array(&env, &[2u8; 32]);
        let community_id = String::from_str(&env, "community-xyz");
        let payer = Address::generate(&env);

        client.attest(&tx_hash, &community_id, &50_000_000, &payer, &101);
        client.attest(&tx_hash, &community_id, &50_000_000, &payer, &101);
    }
}


