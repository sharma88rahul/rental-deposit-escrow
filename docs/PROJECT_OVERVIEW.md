# RentSure Project Overview

## 1. Product Mission & Vision
RentSure aims to bring absolute financial transparency and cryptographic trust to the long-term residential rental market. By removing intermediaries and storing funds in trustless on-chain Soroban escrow vaults, RentSure guarantees that deposit funds cannot be accessed by landlords unilaterally, and tenant security deposit returns are governed strictly by mutual signatures or arbitrator rulings.

---

## 2. Problem Statement
The custody of rental security deposits is a major source of friction:
- **Renters** have no visibility into how their security deposit is being held and often suffer from arbitrary deposit withholding at lease termination.
- **Landlords** must manage security deposits across separate physical escrow accounts, adhering to complex local banking regulations manually.
- **Settlement disputes** require costly legal representation or long waits in small claims court, frustrating both parties.

---

## 3. The RentSure Architecture
RentSure resolves this friction by moving custody and agreements to the Stellar blockchain:
1. **Decentralized Escrow Custody**: When a tenant accepts an agreement, they lock their deposit directly inside a smart contract vault.
2. **Double-Signature Release**: Releasing funds requires mutual agreement between the tenant and the landlord on the deduction splits.
3. **Decentralized Dispute Resolution**: If parties fail to align on splits, the agreement shifts into a "Disputed" status, which locks the vault and opens arbitrator access to resolve the dispute.

---

## 4. Key Target Personas
- **Tenants**: Renters seeking trust that their deposit will be returned promptly if no property damage has occurred.
- **Landlords**: Property managers seeking streamlined, compliant escrow accounting tools.
- **Arbitrators**: Registered third-party legal agents tasked with reviewing dispute inputs and executing split settlements.
