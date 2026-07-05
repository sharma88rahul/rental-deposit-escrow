## Description
Briefly describe the change and the rationale behind it.

## Related Issues
Closes #[issue-number]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Checklist

### Smart Contracts (Rust)
- [ ] Code formatted with `cargo fmt`
- [ ] Lints verified with `cargo clippy --all-targets -- -D warnings`
- [ ] Workspace unit tests pass: `cargo test`
- [ ] Successfully compiles to WASM target

### Frontend (Next.js)
- [ ] Type checking passes with `npm run build`
- [ ] ESLint runs clean: `npm run lint`
- [ ] Unit and integration tests pass: `npm run test`
- [ ] Checked responsive layouts and accessibility (ARIA, focus)

## Verification Screenshots / Logs
Attach visual demonstrations or CLI output proving the build completes successfully.
