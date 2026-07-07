import { create } from "zustand";
import { AgreementStatus } from "@/types";

export interface EscrowDetails {
  escrowId: number;
  agreementId: number;
  title: string;
  propertyAddress: string;
  depositAmount: string;
  releasedAmount: string;
  remainingBalance: string;
  assetType: string;
  status: AgreementStatus;
  landlord: string;
  tenant: string;
  currentHolder: string; // "Escrow Contract", "Tenant", "Landlord"
  lockedAt?: string;
  disbursedAt?: string;
  createdAt: string;
}

export interface EscrowFilters {
  status: string; // "All" or a specific status
  search: string;
}

export interface EscrowSortConfig {
  column: "escrowId" | "depositAmount" | "status" | "remainingBalance";
  direction: "asc" | "desc";
}

interface EscrowState {
  selectedEscrowId: number | null;
  escrows: EscrowDetails[];
  escrowCache: Record<number, EscrowDetails>;
  filters: EscrowFilters;
  sorting: EscrowSortConfig;
  page: number;
  pageSize: number;

  setSelectedEscrowId: (id: number | null) => void;
  setEscrows: (escrows: EscrowDetails[]) => void;
  updateEscrowState: (agreementId: number, updates: Partial<EscrowDetails>) => void;
  cacheEscrow: (escrow: EscrowDetails) => void;
  setFilters: (filters: Partial<EscrowFilters>) => void;
  setSorting: (sorting: EscrowSortConfig) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const initialEscrows: EscrowDetails[] = [];

export const useEscrowStore = create<EscrowState>((set) => ({
  selectedEscrowId: null,
  escrows: initialEscrows,
  escrowCache: {},
  filters: {
    status: "All",
    search: "",
  },
  sorting: {
    column: "escrowId",
    direction: "desc",
  },
  page: 1,
  pageSize: 5,

  setSelectedEscrowId: (id) => set({ selectedEscrowId: id }),
  
  setEscrows: (escrows) => set({ escrows }),

  updateEscrowState: (agreementId, updates) =>
    set((state) => ({
      escrows: state.escrows.map((e) =>
        e.agreementId === agreementId ? { ...e, ...updates } : e
      ),
    })),

  cacheEscrow: (escrow) =>
    set((state) => ({
      escrowCache: {
        ...state.escrowCache,
        [escrow.escrowId]: escrow,
      },
    })),

  setFilters: (updatedFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...updatedFilters },
      page: 1, // Reset page index on search filters update
    })),

  setSorting: (sorting) => set({ sorting }),

  setPage: (page) => set({ page }),

  resetFilters: () =>
    set({
      filters: {
        status: "All",
        search: "",
      },
      page: 1,
    }),
}));
