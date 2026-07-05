# RentSure Platform User Guide

This guide walks you through using the RentSure platform to set up leases and manage security deposits on the blockchain.

---

## 1. Connecting Your Wallet
1. Open the RentSure platform in your browser.
2. Click the **Connect Wallet** button in the top navigation panel.
3. Select your preferred wallet browser extension:
   - **Freighter** (Recommended)
   - **xBull**
   - **Albedo**
4. Grant the connection permission in the wallet popup. Once connected, your public key and XLM balance will display in the header.

---

## 2. Creating a Rental Agreement
*Note: Agreements are initiated by Landlords.*
1. Navigate to the **Agreements** tab in the sidebar and click **Create Agreement**.
2. Fill out the form fields:
   - **Agreement Title**: (e.g. *Vanguard Heights - Apt 402*)
   - **Property Physical Address**: (e.g. *742 Evergreen Terrace*)
   - **Tenant Public Address**: The tenant's G... Stellar address.
   - **Security Deposit Size**: (e.g. *1200*)
   - **Lease Start & End Dates**: Select from the calendar widgets.
3. Select the payment asset (e.g., **USDC** or **Native XLM**).
4. Click **Create Agreement** and approve the transaction signature popup.

---

## 3. Locking the Security Deposit
*Note: Locked deposits are performed by Tenants.*
1. Log in as the Tenant and navigate to the **Escrow Center**.
2. Find the agreement in the list showing status `Accepted`.
3. Click the **Lock Deposit** action button.
4. Confirm the transaction signature popup. The funds will be transferred from your wallet to the Escrow contract vault, and status will update to `LeaseActive`.

---

## 4. Refund Releases & Claims
- **Full Payout**: The Landlord clicks **Release Deposit** at lease termination to return 100% of funds.
- **Deduction Split**: The Landlord can propose a partial claim (e.g., $200 for damage repairs, returning $1000 to tenant). The Tenant must review and approve this split inside their dashboard to release the funds.
