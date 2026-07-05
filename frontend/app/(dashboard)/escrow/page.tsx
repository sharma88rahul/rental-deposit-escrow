"use client";

import * as React from "react";
import { Search, ShieldAlert, Coins, RefreshCw, BarChart } from "lucide-react";
import { useEscrow } from "@/hooks/useEscrow";
import { useEscrowStore } from "@/store/useEscrowStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/loader";
import { EscrowTable } from "@/components/escrow/escrow-table";

export default function EscrowDashboardPage() {
  const { escrowsQuery } = useEscrow();
  const { filters, setFilters, resetFilters } = useEscrowStore();
  const [searchInput, setSearchInput] = React.useState(filters.search);

  // Sync search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setFilters]);

  const { data: escrows = [], isLoading, isRefetching, refetch } = escrowsQuery;

  // Filter escrow records
  const filteredEscrows = React.useMemo(() => {
    return escrows.filter((e) => {
      const matchesSearch =
        e.propertyAddress.toLowerCase().includes(filters.search.toLowerCase()) ||
        e.escrowId.toString().includes(filters.search) ||
        e.agreementId.toString().includes(filters.search);

      const matchesStatus =
        filters.status === "All" ||
        (filters.status === "Locked" && e.status === "LeaseActive") ||
        (filters.status === "Released" && e.status === "FundsReleased") ||
        (filters.status === "Dispute" && e.status === "DisputeRaised") ||
        (filters.status === "Awaiting" && e.status === "Accepted");

      return matchesSearch && matchesStatus;
    });
  }, [escrows, filters]);

  // Aggregate metrics
  const metrics = React.useMemo(() => {
    let totalLocked = 0;
    let totalReleased = 0;
    let activeDisputes = 0;

    escrows.forEach((e) => {
      if (e.status === "LeaseActive" || e.status === "RefundRequested") {
        totalLocked += parseFloat(e.depositAmount);
      }
      if (e.status === "FundsReleased" || e.status === "Resolved") {
        totalReleased += parseFloat(e.releasedAmount);
      }
      if (e.status === "DisputeRaised") {
        activeDisputes += 1;
      }
    });

    return {
      totalLocked: totalLocked.toFixed(2),
      totalReleased: totalReleased.toFixed(2),
      activeDisputes,
    };
  }, [escrows]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escrow Center</h1>
          <p className="text-muted-foreground mt-1">
            Monitor locked security deposits and authorize disbursements.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center space-x-1.5 self-end sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          <span>Sync Status</span>
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Coins className="h-4.5 w-4.5 text-primary mr-1.5" />
              <span>Total Locked Deposit</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalLocked} USDC</div>
            <p className="text-xs text-muted-foreground mt-1">Vaulted securely in Soroban contracts.</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <BarChart className="h-4.5 w-4.5 text-primary mr-1.5" />
              <span>Total Disbursed split</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalReleased} USDC</div>
            <p className="text-xs text-muted-foreground mt-1">Released back to participants.</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <ShieldAlert className="h-4.5 w-4.5 text-red-500 mr-1.5 animate-pulse" />
              <span>Active Disputes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics.activeDisputes}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting legal arbitrator splits.</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/20 p-4 rounded-xl border border-border/40">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Escrow ID, Agreement ID, or address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
          </div>

          {/* Filters Select */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground font-semibold">Status:</span>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
                className="text-xs bg-secondary/40 border border-border/60 rounded-lg text-foreground px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Escrows</option>
                <option value="Awaiting">Awaiting Lock</option>
                <option value="Locked">Active Leases (Locked)</option>
                <option value="Released">Settled / Closed</option>
                <option value="Dispute">Disputed</option>
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs py-1.5 h-8">
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Content Table */}
        {filteredEscrows.length === 0 ? (
          <Card glass>
            <CardContent className="p-8">
              <EmptyState
                title="No Escrow Vaults Found"
                description="Try modifying search queries or connect your wallet to inspect deposits."
              />
            </CardContent>
          </Card>
        ) : (
          <EscrowTable escrows={filteredEscrows} />
        )}
      </div>
    </div>
  );
}
