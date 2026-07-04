#![no_std]

pub mod types;

use soroban_sdk::{contract, contractclient, contractimpl, symbol_short, Address, BytesN, Env};
use types::{Agreement, AgreementStatus, DataKey, Error};

// Bumping constants (TTL)
const DAY_IN_LEDGERS: u32 = 17280; // Assuming ~5s ledger close time
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS; // 30 days
const BUMP_LIMIT: u32 = 365 * DAY_IN_LEDGERS; // 1 year

#[contractclient(name = "EscrowClient")]
pub trait EscrowInterface {
    fn lock_deposit(env: Env, agreement_id: u64, tenant: Address, token: Address, amount: i128);

    fn release_deposit(
        env: Env,
        agreement_id: u64,
        tenant: Address,
        landlord: Address,
        token: Address,
        refund_amount: i128,
        deduction_amount: i128,
    );
}

#[contract]
pub struct RentalAgreementContract;

#[contractimpl]
impl RentalAgreementContract {
    /// Initialize the contract configuration.
    pub fn initialize(
        env: Env,
        admin: Address,
        escrow: Address,
        arbitrator: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::EscrowContract, &escrow);
        env.storage()
            .instance()
            .set(&DataKey::Arbitrator, &arbitrator);
        env.storage()
            .instance()
            .set(&DataKey::AgreementCounter, &0u64);

        env.storage()
            .instance()
            .extend_ttl(BUMP_THRESHOLD, BUMP_LIMIT);
        Ok(())
    }

    /// Create a new rental agreement.
    pub fn create_agreement(
        env: Env,
        landlord: Address,
        tenant: Address,
        token: Address,
        deposit_amount: i128,
        duration: u64,
        metadata_hash: BytesN<32>,
    ) -> Result<u64, Error> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        // Validate permissions and inputs
        landlord.require_auth();
        if deposit_amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if duration == 0 {
            return Err(Error::InvalidDuration);
        }
        if landlord == tenant {
            return Err(Error::InvalidParticipant);
        }

        // Get and increment agreement ID counter
        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AgreementCounter)
            .unwrap();
        counter = counter.checked_add(1).ok_or(Error::Overflow)?;
        env.storage()
            .instance()
            .set(&DataKey::AgreementCounter, &counter);

        let agreement = Agreement {
            id: counter,
            landlord: landlord.clone(),
            tenant: tenant.clone(),
            token: token.clone(),
            deposit_amount,
            duration,
            status: AgreementStatus::Created,
            metadata_hash,
            refund_requested_amount: 0,
        };

        // Save agreement in persistent storage
        let key = DataKey::Agreement(counter);
        env.storage().persistent().set(&key, &agreement);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);
        env.storage()
            .instance()
            .extend_ttl(BUMP_THRESHOLD, BUMP_LIMIT);

        // Emit creation event
        env.events().publish(
            (symbol_short!("created"), counter, landlord, tenant),
            deposit_amount,
        );

        Ok(counter)
    }

    /// Accept the agreement terms (Tenant accepts).
    pub fn accept_agreement(env: Env, tenant: Address, agreement_id: u64) -> Result<(), Error> {
        tenant.require_auth();
        let key = DataKey::Agreement(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::AgreementNotFound);
        }

        let mut agreement: Agreement = env.storage().persistent().get(&key).unwrap();
        if agreement.tenant != tenant {
            return Err(Error::Unauthorized);
        }
        if agreement.status != AgreementStatus::Created {
            return Err(Error::InvalidStatus);
        }

        agreement.status = AgreementStatus::Accepted;
        env.storage().persistent().set(&key, &agreement);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);

        // Emit accepted event
        env.events()
            .publish((symbol_short!("accepted"), agreement_id), tenant);

        Ok(())
    }

    /// Locks the deposit from the tenant's wallet into the Escrow contract.
    pub fn lock_deposit(env: Env, tenant: Address, agreement_id: u64) -> Result<(), Error> {
        tenant.require_auth();
        let key = DataKey::Agreement(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::AgreementNotFound);
        }

        let mut agreement: Agreement = env.storage().persistent().get(&key).unwrap();
        if agreement.tenant != tenant {
            return Err(Error::Unauthorized);
        }
        if agreement.status != AgreementStatus::Accepted {
            return Err(Error::InvalidStatus);
        }

        // Call the Escrow Contract via C2C
        let escrow_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .unwrap();
        let escrow_client = EscrowClient::new(&env, &escrow_address);

        escrow_client.lock_deposit(
            &agreement_id,
            &tenant,
            &agreement.token,
            &agreement.deposit_amount,
        );

        // Transition states
        agreement.status = AgreementStatus::DepositLocked;
        env.storage().persistent().set(&key, &agreement);

        // Emit locked event
        env.events().publish(
            (symbol_short!("locked"), agreement_id),
            agreement.deposit_amount,
        );

        // Set state to Active Lease
        agreement.status = AgreementStatus::LeaseActive;
        env.storage().persistent().set(&key, &agreement);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);

        // Emit lease activated event
        env.events().publish(
            (symbol_short!("activated"), agreement_id),
            agreement.duration,
        );

        Ok(())
    }

    /// Landlord proposes a release distribution (refund to tenant, the rest is deduction).
    pub fn request_refund(
        env: Env,
        landlord: Address,
        agreement_id: u64,
        refund_amount: i128,
    ) -> Result<(), Error> {
        landlord.require_auth();
        let key = DataKey::Agreement(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::AgreementNotFound);
        }

        let mut agreement: Agreement = env.storage().persistent().get(&key).unwrap();
        if agreement.landlord != landlord {
            return Err(Error::Unauthorized);
        }
        if agreement.status != AgreementStatus::LeaseActive {
            return Err(Error::InvalidStatus);
        }
        if refund_amount < 0 || refund_amount > agreement.deposit_amount {
            return Err(Error::InvalidAmount);
        }

        agreement.status = AgreementStatus::RefundRequested;
        agreement.refund_requested_amount = refund_amount;
        env.storage().persistent().set(&key, &agreement);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);

        let deduction_amount = agreement.deposit_amount - refund_amount;

        // Emit refund requested & deduction requested events
        env.events()
            .publish((symbol_short!("ref_req"), agreement_id), refund_amount);
        env.events()
            .publish((symbol_short!("ded_req"), agreement_id), deduction_amount);

        Ok(())
    }

    /// Tenant approves the landlord's release proposal.
    pub fn approve_refund(env: Env, tenant: Address, agreement_id: u64) -> Result<(), Error> {
        tenant.require_auth();
        let key = DataKey::Agreement(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::AgreementNotFound);
        }

        let mut agreement: Agreement = env.storage().persistent().get(&key).unwrap();
        if agreement.tenant != tenant {
            return Err(Error::Unauthorized);
        }
        if agreement.status != AgreementStatus::RefundRequested {
            return Err(Error::InvalidStatus);
        }

        agreement.status = AgreementStatus::Approved;
        env.storage().persistent().set(&key, &agreement);

        let escrow_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .unwrap();
        let escrow_client = EscrowClient::new(&env, &escrow_address);

        let refund_amount = agreement.refund_requested_amount;
        let deduction_amount = agreement.deposit_amount - refund_amount;

        // Call the Escrow Contract via C2C to release the locked funds
        escrow_client.release_deposit(
            &agreement_id,
            &agreement.tenant,
            &agreement.landlord,
            &agreement.token,
            &refund_amount,
            &deduction_amount,
        );

        agreement.status = AgreementStatus::FundsReleased;
        env.storage().persistent().set(&key, &agreement);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);

        // Emit approval & release events
        env.events()
            .publish((symbol_short!("ref_app"), agreement_id), refund_amount);
        if deduction_amount > 0 {
            env.events()
                .publish((symbol_short!("ded_app"), agreement_id), deduction_amount);
        }
        env.events()
            .publish((symbol_short!("released"), agreement_id), refund_amount);
        env.events()
            .publish((symbol_short!("completed"), agreement_id), ());

        Ok(())
    }

    /// Tenant rejects the proposed refund and raises a formal dispute.
    pub fn dispute_refund(env: Env, tenant: Address, agreement_id: u64) -> Result<(), Error> {
        tenant.require_auth();
        let key = DataKey::Agreement(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::AgreementNotFound);
        }

        let mut agreement: Agreement = env.storage().persistent().get(&key).unwrap();
        if agreement.tenant != tenant {
            return Err(Error::Unauthorized);
        }
        if agreement.status != AgreementStatus::RefundRequested {
            return Err(Error::InvalidStatus);
        }

        agreement.status = AgreementStatus::DisputeRaised;
        env.storage().persistent().set(&key, &agreement);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);

        // Emit dispute and refund rejected events
        env.events()
            .publish((symbol_short!("disputed"), agreement_id), tenant);
        env.events().publish(
            (symbol_short!("ref_rej"), agreement_id),
            agreement.refund_requested_amount,
        );

        Ok(())
    }

    /// Arbitrator resolves the raised dispute, choosing the final split.
    pub fn resolve_dispute(
        env: Env,
        arbitrator: Address,
        agreement_id: u64,
        refund_amount: i128,
    ) -> Result<(), Error> {
        arbitrator.require_auth();
        let registered_arbitrator: Address =
            env.storage().instance().get(&DataKey::Arbitrator).unwrap();
        if arbitrator != registered_arbitrator {
            return Err(Error::Unauthorized);
        }

        let key = DataKey::Agreement(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::AgreementNotFound);
        }

        let mut agreement: Agreement = env.storage().persistent().get(&key).unwrap();
        if agreement.status != AgreementStatus::DisputeRaised {
            return Err(Error::InvalidStatus);
        }
        if refund_amount < 0 || refund_amount > agreement.deposit_amount {
            return Err(Error::InvalidAmount);
        }

        agreement.status = AgreementStatus::Resolved;
        env.storage().persistent().set(&key, &agreement);

        let escrow_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .unwrap();
        let escrow_client = EscrowClient::new(&env, &escrow_address);

        let deduction_amount = agreement.deposit_amount - refund_amount;

        // Call Escrow Contract via C2C
        escrow_client.release_deposit(
            &agreement_id,
            &agreement.tenant,
            &agreement.landlord,
            &agreement.token,
            &refund_amount,
            &deduction_amount,
        );

        agreement.status = AgreementStatus::FundsReleased;
        env.storage().persistent().set(&key, &agreement);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);

        // Emit resolution & release events
        env.events()
            .publish((symbol_short!("resolved"), agreement_id), refund_amount);
        env.events()
            .publish((symbol_short!("released"), agreement_id), refund_amount);
        env.events()
            .publish((symbol_short!("completed"), agreement_id), ());

        Ok(())
    }

    /// Read an agreement's current state.
    pub fn get_agreement(env: Env, agreement_id: u64) -> Result<Agreement, Error> {
        let key = DataKey::Agreement(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::AgreementNotFound);
        }
        let agreement: Agreement = env.storage().persistent().get(&key).unwrap();
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);
        Ok(agreement)
    }

    /// Read global configurations.
    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_arbitrator(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Arbitrator)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_escrow(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .ok_or(Error::NotInitialized)
    }

    /// Upgrades WASM code. Only admin is allowed.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
        env.storage()
            .instance()
            .extend_ttl(BUMP_THRESHOLD, BUMP_LIMIT);
        Ok(())
    }
}

#[cfg(test)]
mod test;
