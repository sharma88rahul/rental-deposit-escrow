import { useQuery } from "@tanstack/react-query";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useAgreements } from "./useAgreements";
import { useStore } from "@/store/useStore";

export function useAnalytics() {
  const { filters } = useAnalyticsStore();
  const { agreementsQuery } = useAgreements();
  const agreements = agreementsQuery.data || [];

  const analyticsQuery = useQuery({
    queryKey: ["analytics", filters, agreements],
    queryFn: () => {
      const totalAgreements = agreements.length;
      const active = agreements.filter((a) => a.status === "LeaseActive" || a.status === "RefundRequested" || a.status === "DisputeRaised").length;
      const completed = agreements.filter((a) => a.status === "FundsReleased" || a.status === "Resolved").length;
      const disputed = agreements.filter((a) => a.status === "DisputeRaised").length;
      const cancelled = agreements.filter((a) => a.status === "Draft" || a.status === "Created").length;

      const totalEscrow = agreements
        .filter((a) => a.status === "LeaseActive" || a.status === "RefundRequested" || a.status === "DisputeRaised")
        .reduce((acc, a) => acc + parseFloat(a.depositAmount || "0"), 0);

      const releasedFunds = agreements
        .filter((a) => a.status === "FundsReleased" || a.status === "Resolved")
        .reduce((acc, a) => acc + parseFloat(a.depositAmount || "0"), 0);

      const pendingRefunds = agreements
        .filter((a) => a.status === "RefundRequested" || a.status === "DisputeRaised")
        .reduce((acc, a) => acc + parseFloat(a.refundRequestedAmount || "0"), 0);

      const averageDeposit = totalAgreements > 0 ? (totalEscrow / totalAgreements).toFixed(2) : "0.00";

      // Compute average lease duration in months
      const activeDurations = agreements.map((a) => a.duration);
      const totalDuration = activeDurations.reduce((acc, d) => acc + d, 0);
      const averageDuration = totalAgreements > 0 ? Math.round(totalDuration / totalAgreements / (30 * 24 * 3600)) : 0;

      // Find most used asset
      const assets = agreements.map((a) => a.token);
      const assetCounts: Record<string, number> = {};
      let mostUsedAsset = "USDC";
      let maxCount = 0;
      assets.forEach((asset) => {
        if (!asset) return;
        assetCounts[asset] = (assetCounts[asset] || 0) + 1;
        if (assetCounts[asset] > maxCount) {
          maxCount = assetCounts[asset];
          mostUsedAsset = asset;
        }
      });

      // Monthly Activity Distribution (group by createdAt month)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyCounts = Array(12).fill(0);
      agreements.forEach((a) => {
        if (a.createdAt) {
          const m = new Date(a.createdAt).getMonth();
          monthlyCounts[m]++;
        }
      });
      const monthlyActivity = months.map((m, idx) => ({ name: m, value: monthlyCounts[idx] }));

      // Agreement Status Distribution
      const agreementDistribution = [
        { name: "Active", value: active },
        { name: "Completed", value: completed },
        { name: "Disputed", value: disputed },
        { name: "Draft", value: cancelled },
      ];

      // Escrow Splits
      const escrowSplits = [
        { name: "Locked Vault", value: totalEscrow },
        { name: "Released Tenant", value: releasedFunds },
        { name: "Released Landlord", value: 0 },
      ];

      // Transaction Volume (by day of week)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dailyCounts = Array(7).fill(0);
      const { transactions } = useStore.getState();
      transactions.forEach((tx) => {
        if (tx.timestamp) {
          const d = new Date(tx.timestamp).getDay();
          dailyCounts[d]++;
        }
      });
      const transactionVolume = days.map((day, idx) => ({ name: day, value: dailyCounts[idx] }));

      return {
        totalAgreements,
        activeAgreements: active,
        completedAgreements: completed,
        disputedAgreements: disputed,
        cancelledAgreements: cancelled,
        totalEscrowValue: totalEscrow,
        releasedFunds,
        pendingRefunds,
        averageDeposit: parseFloat(averageDeposit),
        averageDuration,
        mostUsedAsset,
        monthlyActivity,
        agreementDistribution,
        escrowSplits,
        transactionVolume,
      };
    },
    refetchInterval: 10000,
  });

  return {
    analyticsQuery,
  };
}
