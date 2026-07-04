"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Agreement } from "@/types";
import { useAgreementStore, SortConfig } from "@/store/useAgreementStore";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { siteConfig } from "@/config/site";

interface AgreementTableProps {
  agreements: Agreement[];
}

export function AgreementTable({ agreements }: AgreementTableProps) {
  const { sorting, setSorting, page, pageSize, setPage } = useAgreementStore();

  const handleSort = (column: SortConfig["column"]) => {
    const isAsc = sorting.column === column && sorting.direction === "asc";
    setSorting({
      column,
      direction: isAsc ? "desc" : "asc",
    });
  };

  // Shorten public keys
  const shortenKey = (key: string) => {
    if (key.length <= 10) return key;
    return `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
  };

  // Sort & Paginate
  const sortedAgreements = React.useMemo(() => {
    const sorted = [...agreements];
    const { column, direction } = sorting;

    sorted.sort((a, b) => {
      let valA: string | number = a[column] || "";
      let valB: string | number = b[column] || "";

      // Convert depositAmount to float for proper sorting
      if (column === "depositAmount") {
        valA = parseFloat(a.depositAmount || "0");
        valB = parseFloat(b.depositAmount || "0");
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [agreements, sorting]);

  // Paginated chunk
  const paginatedAgreements = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedAgreements.slice(startIndex, startIndex + pageSize);
  }, [sortedAgreements, page, pageSize]);

  const totalPages = Math.ceil(agreements.length / pageSize) || 1;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/15 text-muted-foreground font-semibold">
              <th
                onClick={() => handleSort("title")}
                className="p-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Agreement Title</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </th>
              <th className="p-4">Property Location</th>
              <th className="p-4">Tenant Key</th>
              <th
                onClick={() => handleSort("depositAmount")}
                className="p-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Deposit</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="p-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {paginatedAgreements.map((agreement) => (
              <tr key={agreement.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  {agreement.title || `Agreement #${agreement.id}`}
                </td>
                <td className="p-4 text-muted-foreground truncate max-w-[200px]">
                  {agreement.propertyAddress}
                </td>
                <td className="p-4 font-mono text-xs text-muted-foreground">
                  {shortenKey(agreement.tenant)}
                </td>
                <td className="p-4 font-semibold text-foreground">
                  {agreement.depositAmount} USDC
                </td>
                <td className="p-4">
                  <Badge status={agreement.status} />
                </td>
                <td className="p-4 text-right">
                  <Link href={`${siteConfig.routes.agreements}/${agreement.id}`}>
                    <Button size="sm" variant="outline" className="text-xs flex items-center space-x-1 ml-auto">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-sm text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(page * pageSize, agreements.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{agreements.length}</span> entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <div className="flex items-center justify-center font-medium text-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
