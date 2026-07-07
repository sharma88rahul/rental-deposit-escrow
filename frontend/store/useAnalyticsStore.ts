import { create } from "zustand";

export interface AnalyticsFilter {
  dateRange: "7d" | "30d" | "90d" | "custom";
  status: "All" | "Active" | "Completed" | "Disputed";
  asset: "All" | "USDC" | "XLM";
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface AnalyticsState {
  // Filters
  filters: AnalyticsFilter;
  setFilters: (filters: Partial<AnalyticsFilter>) => void;
  resetFilters: () => void;

  // Chart datasets (easily replaceable with query data)
  monthlyActivity: ChartDataItem[];
  agreementDistribution: ChartDataItem[];
  escrowSplits: ChartDataItem[];
  transactionVolume: ChartDataItem[];

  // Export functions
  exportToCSV: (data: Record<string, unknown>[], filename: string) => void;
  exportToJSON: (data: unknown, filename: string) => void;
}

const mockMonthlyActivity: ChartDataItem[] = [];
const mockAgreementDistribution: ChartDataItem[] = [];
const mockEscrowSplits: ChartDataItem[] = [];
const mockTransactionVolume: ChartDataItem[] = [];

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  filters: {
    dateRange: "30d",
    status: "All",
    asset: "All",
  },
  monthlyActivity: mockMonthlyActivity,
  agreementDistribution: mockAgreementDistribution,
  escrowSplits: mockEscrowSplits,
  transactionVolume: mockTransactionVolume,

  setFilters: (updated) =>
    set((state) => ({
      filters: { ...state.filters, ...updated },
    })),

  resetFilters: () =>
    set({
      filters: {
        dateRange: "30d",
        status: "All",
        asset: "All",
      },
    }),

  exportToCSV: (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToJSON: (data, filename) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `${filename}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
}));
