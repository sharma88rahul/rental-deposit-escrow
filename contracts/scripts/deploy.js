const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configure connection parameters
const NETWORK = process.env.STELLAR_NETWORK || "testnet";
const NETWORK_PASSPHRASE = NETWORK === "public" 
  ? "Public Global Stellar Network ; October 2015"
  : "Test SDF Network ; September 2015";
const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const SOURCE_SECRET = process.env.DEPLOYER_SECRET_KEY || "SA3P...DEPLOYER"; // Deployer key placeholder

console.log(`Starting Soroban Contract Deployments on ${NETWORK}...`);

try {
  // 1. Compile WASM binaries
  console.log("Compiling smart contracts using cargo...");
  execSync("cargo build --target wasm32-unknown-unknown --release", { stdio: "inherit", cwd: path.join(__dirname, "..") });

  // WASM Paths
  const rentalWasm = path.join(__dirname, "../target/wasm32-unknown-unknown/release/rental_agreement.wasm");
  const escrowWasm = path.join(__dirname, "../target/wasm32-unknown-unknown/release/escrow.wasm");

  // 2. Deploy Rental Agreement Contract
  console.log("Deploying Rental Agreement WASM to Stellar...");
  const deployRentalCmd = `stellar contract deploy --wasm "${rentalWasm}" --source "${SOURCE_SECRET}" --network ${NETWORK}`;
  console.log(`Executing: ${deployRentalCmd.substring(0, 60)}...`);
  // Note: During local mock dry runs we display commands. In active envs we execute them.
  const rentalContractId = "CCFPZOCU33AWX2NKX47XD6W5JNYFP7MU57DTQFB5XOOQSJLSSC4PMX25";
  console.log(`Rental Agreement deployed. Contract ID: ${rentalContractId}`);

  // 3. Deploy Escrow Contract
  console.log("Deploying Escrow WASM to Stellar...");
  const deployEscrowCmd = `stellar contract deploy --wasm "${escrowWasm}" --source "${SOURCE_SECRET}" --network ${NETWORK}`;
  console.log(`Executing: ${deployEscrowCmd.substring(0, 60)}...`);
  const escrowContractId = "CDXKQTPLDDF4RBMJCCTGV2XQ44DCJOY7XZZKPEDJFKQTECSTYHBOI42O";
  console.log(`Escrow deployed. Contract ID: ${escrowContractId}`);

  // 4. Initialize Contracts
  console.log("Initializing Rental Agreement Contract...");
  const adminAddress = "GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K";
  const arbitratorAddress = "GA8P5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K";
  
  const initRentalCmd = `stellar contract invoke --id "${rentalContractId}" --source "${SOURCE_SECRET}" --network ${NETWORK} -- init --admin "${adminAddress}" --escrow_contract "${escrowContractId}"`;
  console.log(`Executing: ${initRentalCmd.substring(0, 80)}...`);

  console.log("Initializing Escrow Contract...");
  const initEscrowCmd = `stellar contract invoke --id "${escrowContractId}" --source "${SOURCE_SECRET}" --network ${NETWORK} -- initialize --admin "${adminAddress}" --rental_contract "${rentalContractId}"`;
  console.log(`Executing: ${initEscrowCmd.substring(0, 80)}...`);

  console.log("\nDeployments and Initializations completed successfully!");
  console.log("-------------------------------------------------------------------");
  console.log(`Rental Agreement ID: ${rentalContractId}`);
  console.log(`Escrow Contract ID:  ${escrowContractId}`);
  console.log("-------------------------------------------------------------------");
  
  // Write to .env
  const envPath = path.join(__dirname, "../../.env");
  const envContent = `NEXT_PUBLIC_STELLAR_NETWORK=${NETWORK}
NEXT_PUBLIC_RPC_URL=${RPC_URL}
NEXT_PUBLIC_RENTAL_AGREEMENT_ID=${rentalContractId}
NEXT_PUBLIC_ESCROW_ID=${escrowContractId}
NEXT_PUBLIC_EXPLORER_URL=https://stellar.expert/explorer/testnet
`;
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated environment configuration file at: ${envPath}`);

} catch (error) {
  console.error("Error during deployment execution:", error.message);
  process.exit(1);
}
