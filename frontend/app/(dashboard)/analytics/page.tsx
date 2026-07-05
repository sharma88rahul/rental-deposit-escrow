"use client";

import * as React from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { BarChart, PieChart, AreaChart } from "@/components/analytics/charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Calendar,
  Layers,
  Coins,
  ShieldCheck,
  TrendingUp,
  FileText,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";

export default function AnalyticsPage() {
  const { analyticsQuery } = useAnalytics();
  const { data: stats, isLoading } = analyticsQuery;
  const {
    filters,
    setFilters,
    monthlyActivity,
    agreementDistribution,
    escrowSplits,
    transactionVolume,
    exportToCSV,
    exportToJSON,
  } = useAnalyticsStore();

  const handleExportCSV = () => {
    if (!stats) return;
    exportToCSV(
      [
        {
          "Total Agreements": stats.totalAgreements,
          "Active Agreements": stats.activeAgreements,
          "Completed Agreements": stats.completedAgreements,
          "Total Escrow Value (USDC)": stats.totalEscrowValue,
          "Released Split Funds": stats.releasedFunds,
          "Pending Refunds": stats.pendingRefunds,
          "Average Deposit": stats.averageDeposit,
        },
      ],
      "rentsure-analytics-report"
    );
  };

  const handleExportJSON = () => {
    if (!stats) return;
    exportToJSON(
      {
        timestamp: new Date().toISOString(),
        filters,
        metrics: stats,
        monthlyActivity,
        agreementDistribution,
        escrowSplits,
        transactionVolume,
      },
      "rentsure-analytics-raw"
    );
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/4 bg-muted/65 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted/65 rounded-xl border border-border" />
          ))}
        </div>
        <div className="h-64 bg-muted/65 rounded-xl border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Real-time financial audits, lease distribution status, and transaction volume.
          </p>
        </div>

        {/* Exporters */}
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>Export JSON</span>
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/25 p-4 rounded-xl border border-border/40">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-primary" />
            <select
              value={filters.dateRange}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ dateRange: e.target.value as "7d" | "30d" | "90d" | "custom" })}
              className="text-xs bg-secondary/40 border border-border/60 rounded-lg text-foreground px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-primary" />
            <select
              value={filters.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ status: e.target.value as "All" | "Active" | "Completed" | "Disputed" })}
              className="text-xs bg-secondary/40 border border-border/60 rounded-lg text-foreground px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Disputed">Disputed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-primary" />
            <select
              value={filters.asset}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ asset: e.target.value as "All" | "USDC" | "XLM" })}
              className="text-xs bg-secondary/40 border border-border/60 rounded-lg text-foreground px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Assets</option>
              <option value="USDC">USDC (Stellar SAC)</option>
              <option value="XLM">Native XLM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Numerical Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <FileText className="h-4.5 w-4.5 text-primary mr-1.5" />
              <span>Total Agreements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgreements}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active: {stats.activeAgreements} • Comp: {stats.completedAgreements}
            </p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Coins className="h-4.5 w-4.5 text-primary mr-1.5" />
              <span>Total Locked Deposit</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalEscrowValue.toLocaleString()} USDC</div>
            <p className="text-xs text-muted-foreground mt-1">Average Deposit: {stats.averageDeposit} USDC</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <UserCheck className="h-4.5 w-4.5 text-emerald-500 mr-1.5" />
              <span>Released splits</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.releasedFunds.toLocaleString()} USDC</div>
            <p className="text-xs text-muted-foreground mt-1">Released safely to landlords/tenants.</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <ShieldCheck className="h-4.5 w-4.5 text-red-500 mr-1.5" />
              <span>Legal Disputes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.disputedAgreements} Raised</div>
            <p className="text-xs text-muted-foreground mt-1">Pending arbitrator resolution.</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphical Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity */}
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              <span>Agreement Signings Over Time</span>
            </CardTitle>
            <CardDescription>Number of registered leases finalized monthly on-chain.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center">
            <AreaChart data={monthlyActivity} />
          </CardContent>
        </Card>

        {/* Escrow Donut splits */}
        <Card glass>
          <CardHeader>
            <CardTitle>Escrow Vault Splits</CardTitle>
            <CardDescription>Locked deposits vs released balances.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <PieChart data={escrowSplits} />
          </CardContent>
        </Card>

        {/* Transaction Volume */}
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Transaction Volume</CardTitle>
            <CardDescription>Invocations count recorded on the consensus ledger this week.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center">
            <BarChart data={transactionVolume} />
          </CardContent>
        </Card>

        {/* Agreement Status Pie */}
        <Card glass>
          <CardHeader>
            <CardTitle>Agreement Statuses</CardTitle>
            <CardDescription>Visual distribution of signed digital agreements.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <PieChart data={agreementDistribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
