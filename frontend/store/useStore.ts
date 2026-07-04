import { create } from "zustand";
import { Agreement, Transaction, ActivityEvent, AgreementStatus } from "@/types";

interface AppState {
  // Wallet & Network State
  connected: boolean;
  walletAddress: string | null;
  activeWallet: string | null;
  network: "testnet" | "mainnet";

  // Data Lists
  agreements: Agreement[];
  transactions: Transaction[];
  activities: ActivityEvent[];

  // Actions
  connectWallet: (address: string, walletType: string) => void;
  disconnectWallet: () => void;
  switchNetwork: (net: "testnet" | "mainnet") => void;

  // Agreement Actions
  addAgreement: (agreement: Omit<Agreement, "id" | "status" | "refundRequestedAmount">) => number;
  updateAgreementStatus: (id: number, status: AgreementStatus) => void;
  requestRefund: (id: number, refundAmount: string) => void;

  // Transaction Actions
  addTransaction: (tx: Omit<Transaction, "timestamp">) => void;
  
  // Activity Feed Actions
  addActivity: (activity: Omit<ActivityEvent, "id" | "timestamp">) => void;
}

// Initial mock data for a polished SaaS dashboard experience
const initialAgreements: Agreement[] = [
  {
    id: 1042,
    title: "Vanguard Heights - Apt 402",
    propertyAddress: "742 Evergreen Terrace, Springfield",
    landlord: "GD7K...LAND",
    tenant: "GBTR...TENA",
    token: "USDC (CCFP...MX25)",
    depositAmount: "1200",
    duration: 31536000, // 1 year
    status: "LeaseActive",
    metadataHash: "QmXoypizjW3Wkn2EncgV51B3BJKNpd84mCndH39E7uJ8T5",
    refundRequestedAmount: "0",
    createdAt: "2026-06-15T12:00:00Z"
  },
  {
    id: 1041,
    title: "Sunset Boulevard Condo",
    propertyAddress: "1204 Sunset Blvd, Los Angeles",
    landlord: "GD7K...LAND",
    tenant: "GC7P...TENB",
    token: "XLM (Native)",
    depositAmount: "3000",
    duration: 15768000, // 6 months
    status: "RefundRequested",
    metadataHash: "QmZ3P7x3R7Bkn2EncgV51B3BJKNpd84mCndH39E7uJ8T5",
    refundRequestedAmount: "2500",
    createdAt: "2026-05-10T14:30:00Z"
  },
  {
    id: 1040,
    title: "Tech Hub Studio Suite",
    propertyAddress: "405 Innovation Way, San Francisco",
    landlord: "GA8P...LAND",
    tenant: "GD7K...LAND", // Current user is tenant here
    token: "USDC (CCFP...MX25)",
    depositAmount: "1800",
    duration: 31536000,
    status: "FundsReleased",
    metadataHash: "QmT5P7x3R7Bkn2EncgV51B3BJKNpd84mCndH39E7uJ8T5",
    refundRequestedAmount: "1800",
    createdAt: "2025-07-04T09:00:00Z"
  }
];

const initialTransactions: Transaction[] = [
  {
    hash: "3a4b7...c92d",
    type: "Approve Refund",
    status: "Confirmed",
    fee: "0.00012 XLM",
    timestamp: "2026-07-04T12:30:00Z",
    walletUsed: "GD7K...LAND",
    agreementId: 1040
  },
  {
    hash: "d4e5f...6a7b",
    type: "Request Refund",
    status: "Confirmed",
    fee: "0.00015 XLM",
    timestamp: "2026-07-04T10:15:00Z",
    walletUsed: "GD7K...LAND",
    agreementId: 1041
  },
  {
    hash: "f8g9h...2i3j",
    type: "Lock Deposit",
    status: "Confirmed",
    fee: "0.00021 XLM",
    timestamp: "2026-06-15T13:45:00Z",
    walletUsed: "GBTR...TENA",
    agreementId: 1042
  }
];

const initialActivities: ActivityEvent[] = [
  {
    id: "act-1",
    type: "RefundRequested",
    timestamp: "2026-07-04T10:15:00Z",
    details: "Landlord GD7K...LAND requested a refund split of 2500 USDC to Tenant (Agreement #1041)",
    txHash: "d4e5f...6a7b"
  },
  {
    id: "act-2",
    type: "DepositLocked",
    timestamp: "2026-06-15T13:45:00Z",
    details: "Tenant GBTR...TENA locked 1200 USDC into the Escrow Vault (Agreement #1042)",
    txHash: "f8g9h...2i3j"
  },
  {
    id: "act-3",
    type: "AgreementCreated",
    timestamp: "2026-06-15T12:00:00Z",
    details: "Landlord GD7K...LAND created a new rental agreement for Vanguard Heights - Apt 402 (Agreement #1042)",
    txHash: "9a8b7...c3d2"
  }
];

export const useStore = create<AppState>((set) => ({
  // Wallet states
  connected: false,
  walletAddress: null,
  activeWallet: null,
  network: "testnet",

  // Core lists
  agreements: initialAgreements,
  transactions: initialTransactions,
  activities: initialActivities,

  // Wallet actions
  connectWallet: (address, walletType) =>
    set({
      connected: true,
      walletAddress: address,
      activeWallet: walletType,
    }),
  
  disconnectWallet: () =>
    set({
      connected: false,
      walletAddress: null,
      activeWallet: null,
    }),
  
  switchNetwork: (net) => set({ network: net }),

  // Agreement actions
  addAgreement: (agreement) => {
    const newId = Math.floor(Math.random() * 9000) + 1000;
    const newAgreement: Agreement = {
      ...agreement,
      id: newId,
      status: "Created",
      refundRequestedAmount: "0",
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      agreements: [newAgreement, ...state.agreements],
    }));

    return newId;
  },

  updateAgreementStatus: (id, status) =>
    set((state) => ({
      agreements: state.agreements.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),

  requestRefund: (id, refundAmount) =>
    set((state) => ({
      agreements: state.agreements.map((a) =>
        a.id === id ? { ...a, status: "RefundRequested", refundRequestedAmount: refundAmount } : a
      ),
    })),

  // Transaction actions
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [
        {
          ...tx,
          timestamp: new Date().toISOString(),
        },
        ...state.transactions,
      ],
    })),

  // Activity actions
  addActivity: (activity) =>
    set((state) => ({
      activities: [
        {
          ...activity,
          id: `act-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
        ...state.activities,
      ],
    })),
}));
