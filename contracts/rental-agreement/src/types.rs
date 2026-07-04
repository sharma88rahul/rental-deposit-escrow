use soroban_sdk::{contracterror, contracttype, Address, BytesN};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[contracttype]
#[repr(u32)]
pub enum AgreementStatus {
    Draft = 0,
    Created = 1,
    Accepted = 2,
    DepositLocked = 3,
    LeaseActive = 4,
    RefundRequested = 5,
    Approved = 6,
    FundsReleased = 7,
    DisputeRaised = 8,
    Resolved = 9,
}

#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub struct Agreement {
    pub id: u64,
    pub landlord: Address,
    pub tenant: Address,
    pub token: Address,
    pub deposit_amount: i128,
    pub duration: u64,
    pub status: AgreementStatus,
    pub metadata_hash: BytesN<32>,
    pub refund_requested_amount: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    EscrowContract,
    Arbitrator,
    AgreementCounter,
    Agreement(u64),
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd)]
#[contracterror]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    AgreementNotFound = 4,
    InvalidStatus = 5,
    InvalidAmount = 6,
    InvalidDuration = 7,
    InvalidParticipant = 8,
    Overflow = 9,
}
