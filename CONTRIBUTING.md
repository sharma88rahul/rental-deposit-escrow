# Contributing to RentSure

Thank you for contributing to RentSure! To ensure a smooth review process, please follow these guidelines.

## Local Setup

### Prerequisite Toolchains
- **Rust**: Setup stable toolchain with `rustup target add wasm32-unknown-unknown`
- **Node.js**: Version 22+ with `npm`
- **Stellar CLI**: Install stellar-cli for contract compilation and ledger calls.

### Steps to Initialize
1. Clone the repository.
2. Build the Rust smart contracts:
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   ```
3. Initialize the frontend packages:
   ```bash
   cd frontend
   npm install
   ```

## Development Guidelines

### Coding Standards
- **Rust**: Run `cargo fmt` to apply styling and `cargo clippy --all-targets -- -D warnings` to verify clean builds.
- **Frontend**: Enforce ESLint checks using `npm run lint` and verify files with Prettier.

### Branching & PRs
1. Create a descriptive feature branch: `git checkout -b feature/lease-expiry-cron`.
2. Open a Pull Request referencing the related issue.
3. Ensure the Frontend and Rust Smart Contract CI checks pass successfully before asking for code reviews.
