# Soroban Smart Contract Reference

This document documents all public entrypoint endpoints of the RentSure Soroban smart contracts.

---

## 1. Rental Agreement Contract

### `init(admin: Address, escrow_contract: Address)`
Sets up core parameters.
- **Authorization**: Invoker must sign. Can only be initialized once.

### `create_agreement(landlord: Address, tenant: Address, token: Address, deposit_amount: i128, duration: u64, metadata_hash: String) -> u64`
Creates an agreement index. Returns the generated `id`.
- **Authorization**: Landlord invoker signature required.

### `accept_agreement(agreement_id: u64)`
Signs agreement as a tenant.
- **Authorization**: Tenant address signature required.

### `lock_deposit(tenant: Address, agreement_id: u64)`
Transfers deposit amount from tenant to Escrow vault and shifts state to `DepositLocked`.
- **Authorization**: Tenant signature required.
- **Events Emitted**: `AgreementStatus::DepositLocked`

---

## 2. Escrow Contract

### `initialize(admin: Address, rental_contract: Address)`
Configures administrative mappings.
- **Authorization**: Invoker must sign. Can only be initialized once.

### `lock_deposit(agreement_id: u64, tenant: Address, token: Address, amount: i128)`
Transfers `amount` of SAC `token` from `tenant` to Escrow contract vault.
- **Authorization**: Can **only** be invoked by the registered Rental Agreement Contract (cross-contract invocation check).

### `release_deposit(agreement_id: u64, landlord: Address, tenant: Address, tenant_refund: i128, landlord_deduction: i128)`
Distributes vaulted assets to landlord and tenant based on refund amounts.
- **Authorization**: Can **only** be invoked by the registered Rental Agreement Contract.
