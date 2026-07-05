import { create } from "zustand";
import { ActivityEvent, Transaction, TransactionStatus } from "@/types";

export interface ActivityFilters {
  status: string; // "All" or status code
  eventType: string; // "All" or specific type
  search: string; // Search by hash or description
  dateRange: { start: string; end: string } | null;
}

export interface ActivitySortConfig {
  column: "timestamp" | "type" | "status";
  direction: "asc" | "desc";
}

interface ActivityState {
  // Lists & Live Feed Cache
  transactions: Transaction[];
  activities: ActivityEvent[];
  liveFeedCache: ActivityEvent[];
  
  // Filters, Pagination, Sorting
  filters: ActivityFilters;
  sorting: ActivitySortConfig;
  page: number;
  pageSize: number;

  // Actions
  addTransaction: (tx: Transaction) => void;
  updateTransactionStatus: (hash: string, status: TransactionStatus) => void;
  addActivityEvent: (event: ActivityEvent) => void;
  cacheLiveEvents: (events: ActivityEvent[]) => void;
  clearLiveFeedCache: () => void;
  setFilters: (filters: Partial<ActivityFilters>) => void;
  setSorting: (sorting: ActivitySortConfig) => void;
  setPage: (page: number) => void;
  retryTransaction: (hash: string) => void;
  resetFilters: () => void;
}

// Polished mock transactions ledger reflecting history
const initialTransactions: Transaction[] = [
  {
    hash: "0x89ab7cd67ef21a4de910b8923a1ef5d67ba9e021",
    type: "Lock Escrow Deposit",
    status: "Confirmed",
    fee: "0.00025 XLM",
    timestamp: "2026-06-15T13:45:00Z",
    walletUsed: "GBTR5R5P...TENA",
    agreementId: 1042,
  },
  {
    hash: "0xd4e5f210d7ba9e021cf5d67ba9e021cf5d67ba9",
    type: "Propose Escrow Split",
    status: "Confirmed",
    fee: "0.00014 XLM",
    timestamp: "2026-07-04T10:15:00Z",
    walletUsed: "GD7K5R5P...LAND",
    agreementId: 1041,
  },
  {
    hash: "0x3a4b7cd67ef21a4de910b8923a1ef5d67ba9e022",
    type: "Approve Refund",
    status: "Confirmed",
    fee: "0.00012 XLM",
    timestamp: "2026-07-04T12:30:00Z",
    walletUsed: "GD7K5R5P...LAND",
    agreementId: 1040,
  },
  {
    hash: "0xf8g9h210d7ba9e021cf5d67ba9e021cf5d67ba9",
    type: "Create Rental Agreement",
    status: "Failed",
    fee: "0.00008 XLM",
    timestamp: "2026-07-05T09:00:00Z",
    walletUsed: "GD7K5R5P...LAND",
    agreementId: 1043,
  },
];

// Initial activity events
const initialActivities: ActivityEvent[] = [
  {
    id: "act-101",
    type: "DepositLocked",
    timestamp: "2026-06-15T13:45:00Z",
    details: "Tenant locked 1200 USDC into the Escrow Vault (Agreement #1042)",
    txHash: "0x89ab7cd67ef21a4de910b8923a1ef5d67ba9e021",
  },
  {
    id: "act-102",
    type: "DeductionRequested",
    timestamp: "2026-07-04T10:15:00Z",
    details: "Landlord requested 500 USDC split deduction in Escrow (Agreement #1041)",
    txHash: "0xd4e5f210d7ba9e021cf5d67ba9e021cf5d67ba9",
  },
  {
    id: "act-103",
    type: "FundsReleased",
    timestamp: "2026-07-04T12:30:00Z",
    details: "Escrow splits released: 1800 USDC to Tenant (Agreement #1040)",
    txHash: "0x3a4b7cd67ef21a4de910b8923a1ef5d67ba9e022",
  },
];

export const useActivityStore = create<ActivityState>((set) => ({
  // Default values
  transactions: initialTransactions,
  activities: initialActivities,
  liveFeedCache: [],
  filters: {
    status: "All",
    eventType: "All",
    search: "",
    dateRange: null,
  },
  sorting: {
    column: "timestamp",
    direction: "desc",
  },
  page: 1,
  pageSize: 5,

  // Actions
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
    })),

  updateTransactionStatus: (hash, status) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.hash === hash ? { ...t, status } : t
      ),
    })),

  addActivityEvent: (event) =>
    set((state) => ({
      activities: [event, ...state.activities],
      liveFeedCache: [event, ...state.liveFeedCache].slice(0, 10), // Cache last 10 live items
    })),

  cacheLiveEvents: (events) =>
    set((state) => ({
      liveFeedCache: [...events, ...state.liveFeedCache].slice(0, 10),
    })),

  clearLiveFeedCache: () => set({ liveFeedCache: [] }),

  setFilters: (updatedFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...updatedFilters },
      page: 1,
    })),

  setSorting: (sorting) => set({ sorting }),

  setPage: (page) => set({ page }),

  retryTransaction: (hash) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.hash === hash ? { ...t, status: "Processing" } : t
      ),
    })),

  resetFilters: () =>
    set({
      filters: {
        status: "All",
        eventType: "All",
        search: "",
        dateRange: null,
      },
      page: 1,
    }),
}));
