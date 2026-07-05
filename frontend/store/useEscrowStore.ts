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

// Polished mock escrow records reflecting active agreements
const initialEscrows: EscrowDetails[] = [
  {
    escrowId: 8021,
    agreementId: 1042,
    title: "Vanguard Heights - Apt 402",
    propertyAddress: "742 Evergreen Terrace, Springfield",
    depositAmount: "1200",
    releasedAmount: "0",
    remainingBalance: "1200",
    assetType: "USDC (CCFP...MX25)",
    status: "LeaseActive",
    landlord: "GD7K5R5P...LAND",
    tenant: "GBTR5R5P...TENA",
    currentHolder: "Escrow Contract",
    lockedAt: "2026-06-15T13:45:00Z",
    createdAt: "2026-06-15T12:00:00Z",
  },
  {
    escrowId: 8020,
    agreementId: 1041,
    title: "Sunset Boulevard Condo",
    propertyAddress: "1204 Sunset Blvd, Los Angeles",
    depositAmount: "3000",
    releasedAmount: "0",
    remainingBalance: "3000",
    assetType: "XLM (Native)",
    status: "RefundRequested",
    landlord: "GD7K5R5P...LAND",
    tenant: "GC7P5R5P...TENB",
    currentHolder: "Escrow Contract",
    lockedAt: "2026-05-10T15:00:00Z",
    createdAt: "2026-05-10T14:30:00Z",
  },
  {
    escrowId: 8019,
    agreementId: 1040,
    title: "Tech Hub Studio Suite",
    propertyAddress: "405 Innovation Way, San Francisco",
    depositAmount: "1800",
    releasedAmount: "1800",
    remainingBalance: "0",
    assetType: "USDC (CCFP...MX25)",
    status: "FundsReleased",
    landlord: "GA8P5R5P...LAND",
    tenant: "GD7K5R5P...LAND",
    currentHolder: "Tenant",
    lockedAt: "2025-07-04T09:30:00Z",
    disbursedAt: "2026-07-04T12:30:00Z",
    createdAt: "2025-07-04T09:00:00Z",
  },
];

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
