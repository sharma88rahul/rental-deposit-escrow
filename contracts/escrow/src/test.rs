#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};
use types::Error;

#[test]
fn test_escrow_initialization() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let agreement_contract = Address::generate(&env);

    let escrow_id = env.register(EscrowContract, ());
    let escrow_client = EscrowContractClient::new(&env, &escrow_id);

    // Initialize Escrow Contract
    escrow_client.initialize(&admin, &agreement_contract);

    // Verify config parameters
    assert_eq!(escrow_client.get_admin(), admin);
    assert_eq!(escrow_client.get_agreement_contract(), agreement_contract);

    // Re-initialization should fail
    let result = escrow_client.try_initialize(&admin, &agreement_contract);
    assert_eq!(result.unwrap_err(), Ok(Error::AlreadyInitialized));
}

#[test]
fn test_escrow_uninitialized_calls() {
    let env = Env::default();
    env.mock_all_auths();

    let escrow_id = env.register(EscrowContract, ());
    let escrow_client = EscrowContractClient::new(&env, &escrow_id);

    // Calling before initialization should return NotInitialized error
    let tenant = Address::generate(&env);
    let token = Address::generate(&env);
    let result = escrow_client.try_lock_deposit(&1, &tenant, &token, &1000);
    assert_eq!(result.unwrap_err(), Ok(Error::NotInitialized));
}
