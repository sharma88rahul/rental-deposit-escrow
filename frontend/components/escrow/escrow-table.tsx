"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, ShieldAlert } from "lucide-react";
import { EscrowDetails, useEscrowStore, EscrowSortConfig } from "@/store/useEscrowStore";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { siteConfig } from "@/config/site";

interface EscrowTableProps {
  escrows: EscrowDetails[];
}

export function EscrowTable({ escrows }: EscrowTableProps) {
  const { sorting, setSorting, page, pageSize, setPage } = useEscrowStore();

  const handleSort = (column: EscrowSortConfig["column"]) => {
    const isAsc = sorting.column === column && sorting.direction === "asc";
    setSorting({
      column,
      direction: isAsc ? "desc" : "asc",
    });
  };

  const shortenKey = (key: string) => {
    if (key.length <= 10) return key;
    return `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
  };

  // Sort & Paginate
  const sortedEscrows = React.useMemo(() => {
    const sorted = [...escrows];
    const { column, direction } = sorting;

    sorted.sort((a, b) => {
      let valA: string | number = a[column] || "";
      let valB: string | number = b[column] || "";

      if (column === "depositAmount" || column === "remainingBalance") {
        valA = parseFloat(a[column]);
        valB = parseFloat(b[column]);
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [escrows, sorting]);

  // Paginate chunk
  const paginatedEscrows = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedEscrows.slice(startIndex, startIndex + pageSize);
  }, [sortedEscrows, page, pageSize]);

  const totalPages = Math.ceil(escrows.length / pageSize) || 1;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/15 text-muted-foreground font-semibold">
              <th
                onClick={() => handleSort("escrowId")}
                className="p-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Escrow ID</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </th>
              <th className="p-4">Property Location</th>
              <th className="p-4">Current Holder</th>
              <th
                onClick={() => handleSort("depositAmount")}
                className="p-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Deposit locked</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </th>
              <th
                onClick={() => handleSort("remainingBalance")}
                className="p-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Remaining</span>
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
            {paginatedEscrows.map((e) => (
              <tr key={e.escrowId} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-semibold text-foreground">
                  #{e.escrowId}
                </td>
                <td className="p-4 text-muted-foreground truncate max-w-[180px]">
                  {e.propertyAddress}
                </td>
                <td className="p-4 text-xs font-mono text-muted-foreground">
                  <span className="bg-secondary/50 border border-border/40 px-2 py-0.5 rounded-sm">
                    {e.currentHolder}
                  </span>
                </td>
                <td className="p-4 font-semibold text-foreground">
                  {e.depositAmount} XLM
                </td>
                <td className="p-4 font-semibold text-amber-500">
                  {e.remainingBalance} XLM
                </td>
                <td className="p-4">
                  <Badge status={e.status} />
                </td>
                <td className="p-4 text-right">
                  <Link href={`${siteConfig.routes.agreements}/${e.agreementId}`}>
                    <Button size="sm" variant="outline" className="text-xs flex items-center space-x-1 ml-auto">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Agreement</span>
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
              {Math.min(page * pageSize, escrows.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{escrows.length}</span> vaults
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
