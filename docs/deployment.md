# RentSure Stellar Testnet Deployment Guide

This guide details compilation, deployment, initialization, and verification operations for **RentSure** smart contracts on the Stellar Testnet.

---

## 1. Prerequisites Setup

Before deploying, ensure you have:
1. **Rust Stable Toolchain**: Set up targeting WASM compiler blocks:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
2. **Stellar CLI**: Install using Cargo:
   ```bash
   cargo install --locked stellar-cli
   ```
3. **Funded Testnet Wallet Key**:
   Create a new deployer address using Stellar CLI or Freighter and fund it with testnet XLM via Friendbot.
   - Deployer address: `GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K`
   - Friendbot funding: `curl "https://friendbot.stellar.org?addr=GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K"`

---

## 2. Smart Contract Compilation

To compile smart contracts to clean target WASM binaries, run from `contracts/` folder:
```bash
cargo build --target wasm32-unknown-unknown --release
```
Optimized WASM files will compile to:
- `contracts/target/wasm32-unknown-unknown/release/rental_agreement.wasm`
- `contracts/target/wasm32-unknown-unknown/release/escrow.wasm`

---

## 3. Testnet Deployments

Use Stellar CLI command inputs to upload WASM binaries and fetch deployed contract IDs:

```bash
# 1. Upload Rental Agreement
stellar contract deploy \
  --wasm "../target/wasm32-unknown-unknown/release/rental_agreement.wasm" \
  --source YOUR_DEPLOYER_SECRET_KEY \
  --network testnet
# Returns Contract ID: CCFPZOCU33AWX2NKX47XD6W5JNYFP7MU57DTQFB5XOOQSJLSSC4PMX25

# 2. Upload Escrow Vault Contract
stellar contract deploy \
  --wasm "../target/wasm32-unknown-unknown/release/escrow.wasm" \
  --source YOUR_DEPLOYER_SECRET_KEY \
  --network testnet
# Returns Contract ID: CDXKQTPLDDF4RBMJCCTGV2XQ44DCJOY7XZZKPEDJFKQTECSTYHBOI42O
```

---

## 4. Initialization (Invokes Initialize Calls)

Initialize deployed contract configuration mappings immediately:

```bash
# 1. Initialize Rental Agreement
stellar contract invoke \
  --id CCFPZOCU33AWX2NKX47XD6W5JNYFP7MU57DTQFB5XOOQSJLSSC4PMX25 \
  --source YOUR_DEPLOYER_SECRET_KEY \
  --network testnet \
  -- init \
  --admin GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K \
  --escrow_contract CDXKQTPLDDF4RBMJCCTGV2XQ44DCJOY7XZZKPEDJFKQTECSTYHBOI42O

# 2. Initialize Escrow Vault
stellar contract invoke \
  --id CDXKQTPLDDF4RBMJCCTGV2XQ44DCJOY7XZZKPEDJFKQTECSTYHBOI42O \
  --source YOUR_DEPLOYER_SECRET_KEY \
  --network testnet \
  -- initialize \
  --admin GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K \
  --rental_contract CCFPZOCU33AWX2NKX47XD6W5JNYFP7MU57DTQFB5XOOQSJLSSC4PMX25
```

---

## 5. Verification Checks

Confirm that the contracts behave as expected by invoking test query calls:

```bash
# Query Contract Admin Address
stellar contract invoke \
  --id CCFPZOCU33AWX2NKX47XD6W5JNYFP7MU57DTQFB5XOOQSJLSSC4PMX25 \
  --source YOUR_DEPLOYER_SECRET_KEY \
  --network testnet \
  -- admin
```

---

## 6. Runtime Troubleshooting

### Error: `HostError: Error(Value, InvalidInput)`
- **Cause**: Initializing a contract twice, or passing invalid address formatting parameters.
- **Solution**: Confirm contract state values using explorer mappings.

### Error: `Transaction aborted: Out of funds`
- **Cause**: Deployed key contains zero XLM balance.
- **Solution**: Re-fund the account using Friendbot tool.
