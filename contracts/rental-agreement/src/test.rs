#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, BytesN, Env};
use types::AgreementStatus;

// Escrow contract registration helper
mod escrow_contract {
    soroban_sdk::contractimport!(file = "../target/wasm32-unknown-unknown/release/escrow.wasm");
}

#[test]
fn test_rental_lifecycle_success() {
    let env = Env::default();
    env.mock_all_auths();

    // Generate test addresses
    let admin = Address::generate(&env);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);
    let arbitrator = Address::generate(&env);

    // Deploy Rental Agreement Contract
    let agreement_contract_id = env.register(RentalAgreementContract, ());
    let agreement_client = RentalAgreementContractClient::new(&env, &agreement_contract_id);

    // Deploy Escrow Contract
    let escrow_contract_id = env.register(escrow_contract::WASM, ());
    let escrow_client = escrow_contract::Client::new(&env, &escrow_contract_id);

    // Initialize both contracts
    agreement_client.initialize(&admin, &escrow_contract_id, &arbitrator);
    escrow_client.initialize(&admin, &agreement_contract_id);

    // Register a mock token
    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin)
        .address();
    let token_client = token::Client::new(&env, &token_id);
    let sac_client = token::StellarAssetClient::new(&env, &token_id);

    // Fund tenant with tokens using StellarAssetClient
    let deposit_amount = 1000i128;
    sac_client.mint(&tenant, &deposit_amount);
    assert_eq!(token_client.balance(&tenant), deposit_amount);

    // 1. Create Agreement
    let duration = 30 * 24 * 3600; // 30 days
    let metadata_hash = BytesN::from_array(&env, &[0; 32]);
    let agreement_id = agreement_client.create_agreement(
        &landlord,
        &tenant,
        &token_id,
        &deposit_amount,
        &duration,
        &metadata_hash,
    );

    assert_eq!(agreement_id, 1);

    // Verify stored agreement details
    let agreement = agreement_client.get_agreement(&agreement_id);
    assert_eq!(agreement.landlord, landlord);
    assert_eq!(agreement.tenant, tenant);
    assert_eq!(agreement.deposit_amount, deposit_amount);
    assert_eq!(agreement.status, AgreementStatus::Created);

    // 2. Accept Agreement
    agreement_client.accept_agreement(&tenant, &agreement_id);
    let agreement = agreement_client.get_agreement(&agreement_id);
    assert_eq!(agreement.status, AgreementStatus::Accepted);

    // 3. Lock Deposit
    agreement_client.lock_deposit(&tenant, &agreement_id);

    // Verify funds were transferred to Escrow
    assert_eq!(token_client.balance(&tenant), 0);
    assert_eq!(token_client.balance(&escrow_contract_id), deposit_amount);

    let agreement = agreement_client.get_agreement(&agreement_id);
    assert_eq!(agreement.status, AgreementStatus::LeaseActive);

    // 4. Request Refund (Landlord proposes 800 refund to tenant, 200 deduction for landlord)
    let refund_amount = 800i128;
    agreement_client.request_refund(&landlord, &agreement_id, &refund_amount);

    let agreement = agreement_client.get_agreement(&agreement_id);
    assert_eq!(agreement.status, AgreementStatus::RefundRequested);
    assert_eq!(agreement.refund_requested_amount, refund_amount);

    // 5. Tenant Approves Refund
    agreement_client.approve_refund(&tenant, &agreement_id);

    // Verify funds distribution
    assert_eq!(token_client.balance(&tenant), refund_amount); // 800 USDC
    assert_eq!(
        token_client.balance(&landlord),
        deposit_amount - refund_amount
    ); // 200 USDC
    assert_eq!(token_client.balance(&escrow_contract_id), 0);

    let agreement = agreement_client.get_agreement(&agreement_id);
    assert_eq!(agreement.status, AgreementStatus::FundsReleased);
}

#[test]
fn test_rental_lifecycle_dispute_resolved() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);
    let arbitrator = Address::generate(&env);

    let agreement_contract_id = env.register(RentalAgreementContract, ());
    let agreement_client = RentalAgreementContractClient::new(&env, &agreement_contract_id);

    let escrow_contract_id = env.register(escrow_contract::WASM, ());
    let escrow_client = escrow_contract::Client::new(&env, &escrow_contract_id);

    agreement_client.initialize(&admin, &escrow_contract_id, &arbitrator);
    escrow_client.initialize(&admin, &agreement_contract_id);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin)
        .address();
    let token_client = token::Client::new(&env, &token_id);
    let sac_client = token::StellarAssetClient::new(&env, &token_id);

    let deposit_amount = 2000i128;
    sac_client.mint(&tenant, &deposit_amount);

    let duration = 30 * 24 * 3600;
    let metadata_hash = BytesN::from_array(&env, &[1; 32]);
    let agreement_id = agreement_client.create_agreement(
        &landlord,
        &tenant,
        &token_id,
        &deposit_amount,
        &duration,
        &metadata_hash,
    );

    agreement_client.accept_agreement(&tenant, &agreement_id);
    agreement_client.lock_deposit(&tenant, &agreement_id);

    // Landlord proposes full deduction (0 refund to tenant)
    agreement_client.request_refund(&landlord, &agreement_id, &0);

    // Tenant disputes it
    agreement_client.dispute_refund(&tenant, &agreement_id);
    let agreement = agreement_client.get_agreement(&agreement_id);
    assert_eq!(agreement.status, AgreementStatus::DisputeRaised);

    // Arbitrator resolves the dispute (1200 refund to tenant, 800 deduction to landlord)
    let resolve_refund = 1200i128;
    agreement_client.resolve_dispute(&arbitrator, &agreement_id, &resolve_refund);

    // Verify token transfers
    assert_eq!(token_client.balance(&tenant), resolve_refund); // 1200
    assert_eq!(
        token_client.balance(&landlord),
        deposit_amount - resolve_refund
    ); // 800
    assert_eq!(token_client.balance(&escrow_contract_id), 0);

    let agreement = agreement_client.get_agreement(&agreement_id);
    assert_eq!(agreement.status, AgreementStatus::FundsReleased);
}

#[test]
fn test_unauthorized_actions() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let attacker = Address::generate(&env);

    let agreement_contract_id = env.register(RentalAgreementContract, ());
    let agreement_client = RentalAgreementContractClient::new(&env, &agreement_contract_id);

    let escrow_contract_id = env.register(escrow_contract::WASM, ());
    let escrow_client = escrow_contract::Client::new(&env, &escrow_contract_id);

    agreement_client.initialize(&admin, &escrow_contract_id, &arbitrator);
    escrow_client.initialize(&admin, &agreement_contract_id);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin)
        .address();
    let sac_client = token::StellarAssetClient::new(&env, &token_id);

    let deposit_amount = 1500i128;
    sac_client.mint(&tenant, &deposit_amount);
    let duration = 30 * 24 * 3600;
    let metadata_hash = BytesN::from_array(&env, &[2; 32]);
    let agreement_id = agreement_client.create_agreement(
        &landlord,
        &tenant,
        &token_id,
        &deposit_amount,
        &duration,
        &metadata_hash,
    );

    // 1. Attacker tries to accept agreement
    let result = agreement_client.try_accept_agreement(&attacker, &agreement_id);
    assert!(result.is_err());

    // 2. Accept agreement as tenant
    agreement_client.accept_agreement(&tenant, &agreement_id);

    // 3. Attacker tries to lock deposit
    let result = agreement_client.try_lock_deposit(&attacker, &agreement_id);
    assert!(result.is_err());

    agreement_client.lock_deposit(&tenant, &agreement_id);

    // 4. Attacker tries to request refund
    let result = agreement_client.try_request_refund(&attacker, &agreement_id, &1000);
    assert!(result.is_err());

    // Request refund as landlord
    agreement_client.request_refund(&landlord, &agreement_id, &1000);

    // 5. Attacker tries to approve refund
    let result = agreement_client.try_approve_refund(&attacker, &agreement_id);
    assert!(result.is_err());

    // 6. Attacker tries to dispute refund
    let result = agreement_client.try_dispute_refund(&attacker, &agreement_id);
    assert!(result.is_err());

    // Dispute as tenant
    agreement_client.dispute_refund(&tenant, &agreement_id);

    // 7. Attacker tries to resolve dispute
    let result = agreement_client.try_resolve_dispute(&attacker, &agreement_id, &1000);
    assert!(result.is_err());
}

#[test]
fn test_escrow_access_control() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let agreement_contract_id = Address::generate(&env);
    let attacker = Address::generate(&env);

    let escrow_contract_id = env.register(escrow_contract::WASM, ());
    let escrow_client = escrow_contract::Client::new(&env, &escrow_contract_id);

    // Initialize escrow
    escrow_client.initialize(&admin, &agreement_contract_id);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin)
        .address();

    // Try calling Escrow lock_deposit directly from attacker (not the registered agreement contract)
    let result = escrow_client.try_lock_deposit(&1, &attacker, &token_id, &1000);
    assert!(result.is_err());
}
