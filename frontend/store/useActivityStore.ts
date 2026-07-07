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

const initialTransactions: Transaction[] = [];
const initialActivities: ActivityEvent[] = [];

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
