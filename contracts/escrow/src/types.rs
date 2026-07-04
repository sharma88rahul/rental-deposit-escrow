use soroban_sdk::{contracterror, contracttype, Address};

#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub struct EscrowState {
    pub agreement_id: u64,
    pub amount: i128,
    pub token_address: Address,
    pub locked: bool,
    pub disbursed: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    AgreementContract,
    Escrow(u64),
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd)]
#[contracterror]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    EscrowNotFound = 4,
    AlreadyLocked = 5,
    AlreadyDisbursed = 6,
    InvalidAmount = 7,
    TokenTransferFailed = 8,
    InvalidCaller = 9,
}
