# RentSure Developer & Setup Guide

Welcome to the **RentSure** developer onboarding portal. This guide details setup requirements, build procedures, test coverage operations, and environment variable references.

---

## 1. Repository Structure
```
rental-deposit-escrow/
├── .github/
│   ├── ISSUE_TEMPLATE/     # Bug and feature issue forms
│   ├── workflows/          # CI/CD action config blocks
│   └── CODEOWNERS          # Review ownership map
├── contracts/
│   ├── escrow/             # Soroban Escrow Contract src
│   ├── rental-agreement/   # Soroban Rental Agreement Contract src
│   ├── Cargo.toml          # Rust workspace manifest
│   └── target/             # Compiled Rust binaries
├── frontend/
│   ├── __tests__/          # Jest frontend test suites
│   ├── app/                # Next.js 15 pages and app router
│   ├── components/         # Shared UI and feature components
│   ├── hooks/              # React Query fetch and mutations
│   ├── services/           # Soroban RPC client and lifecycle logic
│   ├── store/              # Zustand global state stores
│   └── package.json        # Frontend Node manifest
├── DEVELOPMENT.md          # This onboarding guide
└── package.json            # Root workspace automation scripts
```

---

## 2. Dev Environment Prerequisites

### 1. Smart Contract Toolchain (Rust)
- Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Add WASM target: `rustup target add wasm32-unknown-unknown`
- (Optional) Install Stellar CLI: `cargo install --locked stellar-cli`

### 2. Frontend Environment (Node)
- Install Node.js v22: `https://nodejs.org/`

---

## 3. Local Onboarding Setup

### Initialize Project Dependencies
From the root workspace directory, run:
```bash
# 1. Install frontend packages
npm run frontend:install

# 2. Format contracts
npm run contract:fmt

# 3. Lint Rust workspace
npm run contract:clippy
```

---

## 4. Automation Command References

A root `package.json` manifest is provided to run commands workspace-wide:

| Operation | Command | Scope |
| --------- | ------- | ----- |
| Format Check | `npm run contract:fmt` | Smart Contracts formatting check |
| Clippy | `npm run contract:clippy` | Rust Clippy strict warnings check |
| Rust Tests | `npm run contract:test` | Cargo workspace smart contract unit tests |
| WASM Compile | `npm run contract:build` | Compiles Rust contracts to WASM targets |
| Frontend Lint | `npm run frontend:lint` | ESLint formatting check for Next.js app |
| Frontend Test | `npm run frontend:test` | Jest unit and integration tests |
| Next.js Build | `npm run frontend:build` | Static optimized Next.js page generation |
| Workspace Build | `npm run workspace:build` | Compiles both Rust contracts and Frontend bundle |
| workspace QA Verify | `npm run workspace:verify` | Full workspace checks (linting, tests, build) |

---

## 5. Environment Configuration (.env)

Duplicate `.env.example` in the root workspace to `.env` to override connection configurations:

```ini
# The target Stellar network network passphrase
NEXT_PUBLIC_STELLAR_NETWORK=testnet

# The target Soroban RPC endpoint URL
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org

# The deployed Rental Agreement Contract ID G... / C...
NEXT_PUBLIC_RENTAL_AGREEMENT_ID=CCFPZOCU33AWX2NKX47XD6W5JNYFP7MU57DTQFB5XOOQSJLSSC4PMX25

# The deployed Escrow Contract ID G... / C...
NEXT_PUBLIC_ESCROW_ID=CDXKQTPLDDF4RBMJCCTGV2XQ44DCJOY7XZZKPEDJFKQTECSTYHBOI42O

# Explorer redirect path URL
NEXT_PUBLIC_EXPLORER_URL=https://stellar.expert/explorer/testnet
```

---

## 6. Continuous Integration Workflow
Every commit pushed or Pull Request created runs our Github Actions check suites:
1. **Rust Smart Contract CI**: Checks `cargo fmt`, `clippy` lints, runs `cargo test`, and compiles contract WASM release outputs.
2. **Frontend CI**: Checks `eslint` formatting checks, runs `jest` unit/integration suites, and compiles the Next.js production bundles.
