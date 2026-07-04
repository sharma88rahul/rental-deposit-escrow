import { create } from "zustand";
import { Agreement, AgreementStatus } from "@/types";

export interface AgreementFilters {
  status: string; // "All" or a specific AgreementStatus / "Active"
  search: string;
  role: "all" | "landlord" | "tenant";
}

export interface SortConfig {
  column: "title" | "depositAmount" | "createdAt" | "status";
  direction: "asc" | "desc";
}

interface AgreementState {
  // Selections & Cache
  selectedAgreementId: number | null;
  agreementCache: Record<number, Agreement>;
  
  // Filter, Sort & Pagination Parameters
  filters: AgreementFilters;
  sorting: SortConfig;
  page: number;
  pageSize: number;

  // Actions
  setSelectedAgreementId: (id: number | null) => void;
  cacheAgreements: (agreements: Agreement[]) => void;
  cacheSingleAgreement: (agreement: Agreement) => void;
  setFilters: (filters: Partial<AgreementFilters>) => void;
  setSorting: (sorting: SortConfig) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

export const useAgreementStore = create<AgreementState>((set) => ({
  // Default values
  selectedAgreementId: null,
  agreementCache: {},
  filters: {
    status: "All",
    search: "",
    role: "all",
  },
  sorting: {
    column: "createdAt",
    direction: "desc",
  },
  page: 1,
  pageSize: 5,

  // Actions
  setSelectedAgreementId: (id) => set({ selectedAgreementId: id }),
  
  cacheAgreements: (agreements) =>
    set((state) => {
      const newCache = { ...state.agreementCache };
      agreements.forEach((a) => {
        newCache[a.id] = a;
      });
      return { agreementCache: newCache };
    }),

  cacheSingleAgreement: (agreement) =>
    set((state) => ({
      agreementCache: {
        ...state.agreementCache,
        [agreement.id]: agreement,
      },
    })),

  setFilters: (updatedFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...updatedFilters },
      page: 1, // Reset to page 1 on filter changes
    })),

  setSorting: (sorting) => set({ sorting }),

  setPage: (page) => set({ page }),

  resetFilters: () =>
    set({
      filters: {
        status: "All",
        search: "",
        role: "all",
      },
      page: 1,
    }),
}));
