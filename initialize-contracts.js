/**
 * RentSure — Contract Initialization Script
 *
 * Run this ONCE to initialize the deployed Rental Agreement and Escrow contracts.
 * Requires: Stellar CLI installed  (stellar --version)
 *
 * Usage:
 *   1. Set your deployer secret key below (or via env var DEPLOYER_SECRET_KEY)
 *   2. Run: node initialize-contracts.js
 */

const { execSync } = require("child_process");

// ─── CONFIGURATION ─────────────────────────────────────────────────────────────
// These match the contract IDs in frontend/.env.local
const RENTAL_CONTRACT_ID = "CC32FLXF5AQUBFRFRQBBUAXUDFXUSQIQ6DFCK6OOUTQXDTLANUKI5OOE";
const ESCROW_CONTRACT_ID  = "CANVAZCSTN7MSQKSAKUNAHM6NGVRSN76ZWHUYL2ZY6BBS4IMA6FF4T3N";
const NETWORK             = "testnet";

// Your deployer / admin Stellar G-address (the one whose secret key you provide)
// This becomes the Admin and Arbitrator of the contract.
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || "REPLACE_WITH_YOUR_STELLAR_G_ADDRESS";

// Your deployer secret key — starts with S...
// ⚠ Never commit a real secret key to git. Use the env var instead.
const SECRET_KEY = process.env.DEPLOYER_SECRET_KEY || "REPLACE_WITH_YOUR_SECRET_KEY";

// ───────────────────────────────────────────────────────────────────────────────

if (SECRET_KEY.startsWith("REPLACE") || ADMIN_ADDRESS.startsWith("REPLACE")) {
  console.error(
    "\n❌  Please set your ADMIN_ADDRESS and DEPLOYER_SECRET_KEY.\n" +
    "    Either edit this file or export the env vars:\n\n" +
    "    set ADMIN_ADDRESS=GXXX...\n" +
    "    set DEPLOYER_SECRET_KEY=SXXX...\n" +
    "    node initialize-contracts.js\n"
  );
  process.exit(1);
}

function run(label, cmd) {
  console.log(`\n▶  ${label}`);
  console.log(`   ${cmd.replace(SECRET_KEY, "S***HIDDEN***")}`);
  try {
    const out = execSync(cmd, { encoding: "utf8", timeout: 60000 });
    console.log(`   ✅ OK: ${out.trim()}`);
    return out.trim();
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || "").toString();
    if (msg.includes("AlreadyInitialized")) {
      console.log("   ⚠  Already initialized — skipping.");
      return "already_initialized";
    }
    console.error(`   ❌ FAILED:\n${msg}`);
    process.exit(1);
  }
}

console.log("═══════════════════════════════════════════════════════════");
console.log(" RentSure — Contract Initialization");
console.log("═══════════════════════════════════════════════════════════");
console.log(` Rental Agreement : ${RENTAL_CONTRACT_ID}`);
console.log(` Escrow           : ${ESCROW_CONTRACT_ID}`);
console.log(` Admin / Arbitrator : ${ADMIN_ADDRESS}`);
console.log(` Network          : ${NETWORK}`);
console.log("═══════════════════════════════════════════════════════════\n");

// 1. Initialize Rental Agreement contract
//    initialize(admin: Address, escrow: Address, arbitrator: Address)
run(
  "Initialize Rental Agreement contract",
  [
    "stellar contract invoke",
    `--id ${RENTAL_CONTRACT_ID}`,
    `--source ${SECRET_KEY}`,
    `--network ${NETWORK}`,
    "--",
    "initialize",
    `--admin ${ADMIN_ADDRESS}`,
    `--escrow ${ESCROW_CONTRACT_ID}`,
    `--arbitrator ${ADMIN_ADDRESS}`,
  ].join(" ")
);

// 2. Initialize Escrow contract
//    initialize(admin: Address, agreement_contract: Address)
run(
  "Initialize Escrow contract",
  [
    "stellar contract invoke",
    `--id ${ESCROW_CONTRACT_ID}`,
    `--source ${SECRET_KEY}`,
    `--network ${NETWORK}`,
    "--",
    "initialize",
    `--admin ${ADMIN_ADDRESS}`,
    `--agreement_contract ${RENTAL_CONTRACT_ID}`,
  ].join(" ")
);

// 3. Verify: call get_admin on the Rental Agreement contract
run(
  "Verify: get_admin on Rental Agreement",
  [
    "stellar contract invoke",
    `--id ${RENTAL_CONTRACT_ID}`,
    `--source ${SECRET_KEY}`,
    `--network ${NETWORK}`,
    "--",
    "get_admin",
  ].join(" ")
);

console.log("\n═══════════════════════════════════════════════════════════");
console.log(" ✅  Both contracts initialized successfully!");
console.log(" You can now create rental agreements in the app.");
console.log("═══════════════════════════════════════════════════════════\n");
