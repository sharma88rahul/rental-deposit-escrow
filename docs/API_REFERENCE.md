# RentSure Frontend API Reference

This document catalogs the functions, hook structures, and store methods that power the RentSure user interface.

---

## 1. Agreement Service (`AgreementService`)
Handles transactions and simulations related to lease agreements.

### `createAgreement(params)`
Creates a draft agreement listing in the system.
- **Parameters**:
  - `params.title`: `string`
  - `params.propertyAddress`: `string`
  - `params.tenant`: `string` (56-char Stellar Address)
  - `params.depositAmount`: `string`
  - `params.duration`: `number` (seconds)
  - `params.token`: `string`
  - `params.metadataHash`: `string`
- **Returns**: `Promise<number>` (New Agreement ID)

### `acceptAgreement(id)`
Tenant signs the agreement, changing its status to `Accepted`.
- **Parameters**:
  - `id`: `number`
- **Returns**: `Promise<void>`

---

## 2. Escrow Service (`EscrowService`)
Handles security deposit custody vault lockups and payouts.

### `lockDeposit(agreementId)`
Locks the security deposit amount into the Escrow contract vault.
- **Parameters**:
  - `agreementId`: `number`
- **Returns**: `Promise<void>`

### `releaseDepositFully(agreementId)`
Landlord releases 100% of vaulted funds back to the tenant.
- **Parameters**:
  - `agreementId`: `number`
- **Returns**: `Promise<void>`

### `requestDeduction(agreementId, deductionAmount)`
Landlord requests a payout split (e.g. for damage repairs).
- **Parameters**:
  - `agreementId`: `number`
  - `deductionAmount`: `string`
- **Returns**: `Promise<void>`

---

## 3. Zustand Global Stores

### `useWalletStore`
Stores connected session wallet parameters.
- **State**:
  - `connected`: `boolean`
  - `walletAddress`: `string | null`
  - `activeWallet`: `string | null`
- **Actions**:
  - `setConnection(address, wallet)`: Logs in session.
  - `disconnect()`: Cleans credentials.

### `useStore`
Primary list data store.
- **State**:
  - `agreements`: `Agreement[]`
  - `transactions`: `Transaction[]`
  - `activities`: `ActivityEvent[]`
- **Actions**:
  - `addAgreement(agreement)`: Appends record.
  - `updateAgreementStatus(id, status)`: Transitions status.
