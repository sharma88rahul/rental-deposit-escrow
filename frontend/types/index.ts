export type AgreementStatus =
  | "Draft"
  | "Created"
  | "Accepted"
  | "DepositLocked"
  | "LeaseActive"
  | "RefundRequested"
  | "Approved"
  | "FundsReleased"
  | "DisputeRaised"
  | "Resolved";

export interface Agreement {
  id: number;
  landlord: string;
  tenant: string;
  token: string;
  depositAmount: string;
  duration: number; // in seconds
  status: AgreementStatus;
  metadataHash: string;
  refundRequestedAmount: string;
  title?: string;
  propertyAddress?: string;
  createdAt?: string;
}

export interface EscrowState {
  agreementId: number;
  amount: string;
  tokenAddress: string;
  locked: boolean;
  disbursed: boolean;
}

export type TransactionStatus = "Pending" | "Processing" | "Confirmed" | "Failed";

export interface Transaction {
  hash: string;
  type: string;
  status: TransactionStatus;
  fee: string;
  timestamp: string;
  walletUsed: string;
  agreementId?: number;
}

export interface ActivityEvent {
  id: string;
  type:
    | "AgreementCreated"
    | "AgreementAccepted"
    | "DepositLocked"
    | "LeaseActivated"
    | "RefundRequested"
    | "RefundApproved"
    | "RefundRejected"
    | "DeductionRequested"
    | "DeductionApproved"
    | "DisputeRaised"
    | "DisputeResolved"
    | "FundsReleased"
    | "AgreementCompleted"
    | "WalletConnected"
    | "WalletDisconnected";
  timestamp: string;
  details: string;
  txHash?: string;
  agreementId?: number;
}
