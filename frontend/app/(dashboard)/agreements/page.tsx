"use client";

import * as React from "react";
import Link from "next/link";
import { Search, PlusCircle, Filter } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { siteConfig } from "@/config/site";
import { AgreementStatus } from "@/types";

export default function AgreementsPage() {
  const { agreements } = useStore();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"All" | "Active" | "Dispute" | "Completed">("All");

  // Search & Filter Logic
  const filteredAgreements = agreements.filter((agreement) => {
    const matchesSearch =
      agreement.propertyAddress?.toLowerCase().includes(search.toLowerCase()) ||
      agreement.title?.toLowerCase().includes(search.toLowerCase()) ||
      agreement.id.toString().includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && (agreement.status === "LeaseActive" || agreement.status === "DepositLocked")) ||
      (statusFilter === "Dispute" && agreement.status === "DisputeRaised") ||
      (statusFilter === "Completed" && (agreement.status === "FundsReleased" || agreement.status === "Resolved"));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rental Agreements</h1>
          <p className="text-muted-foreground mt-1">
            Manage your lease contracts and track deposit status lifecycle.
          </p>
        </div>
        <Link href={siteConfig.routes.createAgreement}>
          <Button className="flex items-center space-x-2 w-full md:w-auto">
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Create New Agreement</span>
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/20 p-4 rounded-xl border border-border/40">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, property address, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(["All", "Active", "Dispute", "Completed"] as const).map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter)}
              className="text-xs"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <Card glass>
        <CardContent className="p-0">
          {filteredAgreements.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Agreements Found"
                description="Try broadening your search criteria or create a new contract to get started."
                actionText="Create New Agreement"
                onAction={() => window.location.href = siteConfig.routes.createAgreement}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground bg-secondary/15">
                    <th className="p-4 font-semibold">Agreement Title & ID</th>
                    <th className="p-4 font-semibold">Property Address</th>
                    <th className="p-4 font-semibold">Landlord / Tenant</th>
                    <th className="p-4 font-semibold">Deposit Amount</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAgreements.map((agreement) => (
                    <tr key={agreement.id} className="hover:bg-secondary/25 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-foreground">
                          {agreement.title || `Agreement #${agreement.id}`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ID: {agreement.id}
                        </div>
                      </td>
                      <td className="p-4 max-w-[250px] truncate font-medium">
                        {agreement.propertyAddress}
                      </td>
                      <td className="p-4 text-xs">
                        <div className="text-foreground">L: {agreement.landlord}</div>
                        <div className="text-muted-foreground mt-0.5">T: {agreement.tenant}</div>
                      </td>
                      <td className="p-4 font-semibold">
                        {agreement.depositAmount} USDC
                      </td>
                      <td className="p-4">
                        <Badge status={agreement.status} />
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`${siteConfig.routes.agreements}/${agreement.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
