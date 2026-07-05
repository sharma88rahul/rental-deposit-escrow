"use client";

import * as React from "react";
import { useActivity } from "@/hooks/useActivity";
import { useActivityStore } from "@/store/useActivityStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/loader";
import { TransactionTable } from "@/components/transaction/transaction-table";
import { Search, Database, RefreshCw, Layers } from "lucide-react";

export default function TransactionsPage() {
  const { transactionsQuery } = useActivity();
  const { filters, setFilters, resetFilters } = useActivityStore();
  const [searchInput, setSearchInput] = React.useState(filters.search);

  // Sync search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setFilters]);

  const { data: transactions = [], isLoading, isRefetching, refetch } = transactionsQuery;

  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.hash.toLowerCase().includes(filters.search.toLowerCase()) ||
        tx.type.toLowerCase().includes(filters.search.toLowerCase()) ||
        (tx.agreementId && tx.agreementId.toString().includes(filters.search));

      const matchesStatus =
        filters.status === "All" ||
        tx.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, filters]);

  // Aggregate metrics
  const metrics = React.useMemo(() => {
    const total = transactions.length;
    const confirmed = transactions.filter((t) => t.status === "Confirmed").length;
    const failed = transactions.filter((t) => t.status === "Failed").length;

    return {
      total,
      confirmed,
      failed,
    };
  }, [transactions]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Center</h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of broadcasted Soroban host function transactions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center space-x-1.5 self-end sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          <span>Sync Ledger</span>
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Database className="h-4.5 w-4.5 text-primary mr-1.5" />
              <span>Total ledger Calls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.total} Transactions</div>
            <p className="text-xs text-muted-foreground mt-1">Total contract invocations recorded.</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <CheckCircleIcon className="h-4.5 w-4.5 text-green-500 mr-1.5" />
              <span>Confirmed Calls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{metrics.confirmed} Transactions</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed safely on-chain.</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Layers className="h-4.5 w-4.5 text-primary mr-1.5" />
              <span>Network Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Stellar Testnet</div>
            <p className="text-xs text-muted-foreground mt-1">Base Fee: 100 Stroops</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Ledger Table */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/20 p-4 rounded-xl border border-border/40">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by transaction hash, type, or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
          </div>

          {/* Filter Status select */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground font-semibold">Status:</span>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
                className="text-xs bg-secondary/40 border border-border/60 rounded-lg text-foreground px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Transactions</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Failed">Failed</option>
                <option value="Processing">Processing</option>
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs py-1.5 h-8">
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Content Table */}
        {filteredTransactions.length === 0 ? (
          <Card glass>
            <CardContent className="p-8">
              <EmptyState
                title="No Ledger Records Found"
                description="Broadcast a new escrow deposit or signature transaction to build audit logs."
              />
            </CardContent>
          </Card>
        ) : (
          <TransactionTable transactions={filteredTransactions} />
        )}
      </div>
    </div>
  );
}

// Inline custom mini check icon for checklist queries
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
