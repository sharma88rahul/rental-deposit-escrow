#![no_std]

pub mod types;

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, BytesN, Env};
use types::{DataKey, Error, EscrowState};

// Bumping constants (TTL)
const DAY_IN_LEDGERS: u32 = 17280; // Assuming ~5s ledger close time
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS; // 30 days
const BUMP_LIMIT: u32 = 365 * DAY_IN_LEDGERS; // 1 year

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize the Escrow contract settings.
    pub fn initialize(env: Env, admin: Address, agreement_contract: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::AgreementContract, &agreement_contract);

        env.storage()
            .instance()
            .extend_ttl(BUMP_THRESHOLD, BUMP_LIMIT);
        Ok(())
    }

    /// Lock tenant funds into the escrow contract.
    /// Can only be called by the authorized Rental Agreement Contract.
    pub fn lock_deposit(
        env: Env,
        agreement_id: u64,
        tenant: Address,
        token: Address,
        amount: i128,
    ) -> Result<(), Error> {
        // Enforce contract authorization (caller must be the Agreement Contract)
        let agreement_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::AgreementContract)
            .ok_or(Error::NotInitialized)?;
        agreement_contract.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let key = DataKey::Escrow(agreement_id);
        if env.storage().persistent().has(&key) {
            let state: EscrowState = env.storage().persistent().get(&key).unwrap();
            if state.locked {
                return Err(Error::AlreadyLocked);
            }
        }

        // Lock funds by transferring from the tenant's wallet to this contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&tenant, &env.current_contract_address(), &amount);

        let escrow_state = EscrowState {
            agreement_id,
            amount,
            token_address: token.clone(),
            locked: true,
            disbursed: false,
        };

        // Store escrow state in persistent storage
        env.storage().persistent().set(&key, &escrow_state);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);
        env.storage()
            .instance()
            .extend_ttl(BUMP_THRESHOLD, BUMP_LIMIT);

        // Emit escrow deposit locked event
        env.events()
            .publish((symbol_short!("esc_lock"), agreement_id, token), amount);

        Ok(())
    }

    /// Release funds from escrow to the tenant (refund) and landlord (deductions).
    /// Can only be called by the authorized Rental Agreement Contract.
    pub fn release_deposit(
        env: Env,
        agreement_id: u64,
        tenant: Address,
        landlord: Address,
        token: Address,
        refund_amount: i128,
        deduction_amount: i128,
    ) -> Result<(), Error> {
        // Enforce contract authorization (caller must be the Agreement Contract)
        let agreement_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::AgreementContract)
            .ok_or(Error::NotInitialized)?;
        agreement_contract.require_auth();

        let key = DataKey::Escrow(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::EscrowNotFound);
        }

        let mut state: EscrowState = env.storage().persistent().get(&key).unwrap();
        if !state.locked {
            return Err(Error::EscrowNotFound);
        }
        if state.disbursed {
            return Err(Error::AlreadyDisbursed);
        }

        // Verify total release amounts match deposit amount locked
        if refund_amount + deduction_amount != state.amount {
            return Err(Error::InvalidAmount);
        }

        let token_client = token::Client::new(&env, &token);

        // Perform transfers
        if refund_amount > 0 {
            token_client.transfer(&env.current_contract_address(), &tenant, &refund_amount);
        }
        if deduction_amount > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &landlord,
                &deduction_amount,
            );
        }

        // Mark as disbursed
        state.disbursed = true;
        env.storage().persistent().set(&key, &state);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);
        env.storage()
            .instance()
            .extend_ttl(BUMP_THRESHOLD, BUMP_LIMIT);

        // Emit escrow funds released event
        env.events().publish(
            (symbol_short!("esc_rel"), agreement_id, token),
            (refund_amount, deduction_amount),
        );

        Ok(())
    }

    /// Retrieve the escrow state of an agreement.
    pub fn get_escrow(env: Env, agreement_id: u64) -> Result<EscrowState, Error> {
        let key = DataKey::Escrow(agreement_id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::EscrowNotFound);
        }
        let state: EscrowState = env.storage().persistent().get(&key).unwrap();
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_LIMIT);
        Ok(state)
    }

    /// Read global configurations.
    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_agreement_contract(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::AgreementContract)
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
