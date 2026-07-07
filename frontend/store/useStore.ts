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

const initialAgreements: Agreement[] = [];
const initialTransactions: Transaction[] = [];
const initialActivities: ActivityEvent[] = [];

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
