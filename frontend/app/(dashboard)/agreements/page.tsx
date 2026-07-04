"use client";

import * as React from "react";
import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { useAgreements } from "@/hooks/useAgreements";
import { useAgreementStore } from "@/store/useAgreementStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/loader";
import { AgreementTable } from "@/components/agreement/agreement-table";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export default function AgreementsPage() {
  const router = useRouter();
  const { agreementsQuery } = useAgreements();
  const { filters, setFilters, resetFilters } = useAgreementStore();
  const [searchInput, setSearchInput] = React.useState(filters.search);

  // Sync local search input with store (debounced or on submit)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setFilters]);

  const { data: agreements = [], isLoading } = agreementsQuery;

  // Filter agreements based on store filters
  const filteredAgreements = React.useMemo(() => {
    return agreements.filter((agreement) => {
      const matchesSearch =
        agreement.propertyAddress?.toLowerCase().includes(filters.search.toLowerCase()) ||
        agreement.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        agreement.id.toString().includes(filters.search);

      const matchesStatus =
        filters.status === "All" ||
        (filters.status === "Active" &&
          (agreement.status === "LeaseActive" || agreement.status === "DepositLocked")) ||
        (filters.status === "Dispute" && agreement.status === "DisputeRaised") ||
        (filters.status === "Completed" &&
          (agreement.status === "FundsReleased" || agreement.status === "Resolved")) ||
        agreement.status === filters.status;

      const matchesRole =
        filters.role === "all" ||
        (filters.role === "landlord" && agreement.landlord === "GD7K5R5P...LAND") ||
        (filters.role === "tenant" && agreement.tenant === "GD7K5R5P...LAND");

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [agreements, filters]);

  if (isLoading) {
    return <PageLoader />;
  }

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/20 p-4 rounded-xl border border-border/40">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, property address, or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Select */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground font-semibold">Status:</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="text-xs bg-secondary/40 border border-border/60 rounded-lg text-foreground px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Statuses</option>
              <option value="Created">Created (Draft)</option>
              <option value="Accepted">Accepted (Unfunded)</option>
              <option value="LeaseActive">Active Leases</option>
              <option value="RefundRequested">Refund Proposed</option>
              <option value="DisputeRaised">Disputed</option>
              <option value="FundsReleased">Settled / Closed</option>
            </select>
          </div>

          {/* Role Select */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground font-semibold">Role:</span>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ role: e.target.value as "all" | "landlord" | "tenant" })}
              className="text-xs bg-secondary/40 border border-border/60 rounded-lg text-foreground px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Roles</option>
              <option value="landlord">As Landlord</option>
              <option value="tenant">As Tenant</option>
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs py-1.5 h-8">
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Main Table Content */}
      {filteredAgreements.length === 0 ? (
        <Card glass>
          <CardContent className="p-8">
            <EmptyState
              title="No Agreements Found"
              description="Try broadening your search criteria or create a new contract to get started."
              actionText="Create New Agreement"
              onAction={() => router.push(siteConfig.routes.createAgreement)}
            />
          </CardContent>
        </Card>
      ) : (
        <AgreementTable agreements={filteredAgreements} />
      )}
    </div>
  );
}
