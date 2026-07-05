import { useQuery } from "@tanstack/react-query";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useAgreements } from "./useAgreements";

export function useAnalytics() {
  const { filters } = useAnalyticsStore();
  const { agreementsQuery } = useAgreements();
  const agreements = agreementsQuery.data || [];

  const analyticsQuery = useQuery({
    queryKey: ["analytics", filters],
    queryFn: () => {
      // Base stats derived from local cache + mock adjustments
      const totalAgreements = agreements.length || 26;
      const active = agreements.filter((a) => a.status === "LeaseActive").length || 8;
      const completed = agreements.filter((a) => a.status === "FundsReleased").length || 12;
      const disputed = agreements.filter((a) => a.status === "DisputeRaised").length || 2;
      const cancelled = agreements.filter((a) => a.status === "Draft").length || 4;

      const totalEscrow = agreements.reduce((acc, a) => acc + parseFloat(a.depositAmount || "0"), 0) || 25000;
      const averageDeposit = totalAgreements > 0 ? (totalEscrow / totalAgreements).toFixed(2) : "0.00";

      return {
        totalAgreements,
        activeAgreements: active,
        completedAgreements: completed,
        disputedAgreements: disputed,
        cancelledAgreements: cancelled,
        totalEscrowValue: totalEscrow,
        releasedFunds: 9600,
        pendingRefunds: 15400,
        averageDeposit: parseFloat(averageDeposit),
        averageDuration: 12, // mock value
        mostUsedAsset: "USDC",
      };
    },
    refetchInterval: 10000, // Sync values every 10s
  });

  return {
    analyticsQuery,
  };
}
