"use client";

import * as React from "react";
import { Transaction } from "@/types";
import { useActivityStore, ActivitySortConfig } from "@/store/useActivityStore";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { TransactionDetailsDialog } from "./transaction-details-dialog";

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const { sorting, setSorting, page, pageSize, setPage } = useActivityStore();
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

  const handleSort = (column: ActivitySortConfig["column"]) => {
    const isAsc = sorting.column === column && sorting.direction === "asc";
    setSorting({
      column,
      direction: isAsc ? "desc" : "asc",
    });
  };

  const shortenHash = (hash: string) => {
    if (hash.length <= 12) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  // Sort & Paginate
  const sortedTransactions = React.useMemo(() => {
    const sorted = [...transactions];
    const { column, direction } = sorting;

    sorted.sort((a, b) => {
      const valA = a[column] || "";
      const valB = b[column] || "";

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [transactions, sorting]);

  const paginatedTransactions = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedTransactions.slice(startIndex, startIndex + pageSize);
  }, [sortedTransactions, page, pageSize]);

  const totalPages = Math.ceil(transactions.length / pageSize) || 1;

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
      case "Failed":
        return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/15 text-muted-foreground font-semibold">
              <th className="p-4">Transaction Hash</th>
              <th
                onClick={() => handleSort("type")}
                className="p-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Operation Type</span>
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
              <th
                onClick={() => handleSort("timestamp")}
                className="p-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Timestamp</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </th>
              <th className="p-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {paginatedTransactions.map((tx) => (
              <tr key={tx.hash} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-mono text-xs text-foreground">
                  {shortenHash(tx.hash)}
                </td>
                <td className="p-4 font-semibold text-foreground">
                  {tx.type}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-1.5 text-xs text-foreground font-semibold">
                    {getStatusIcon(tx.status)}
                    <span>{tx.status}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground text-xs">
                  {new Date(tx.timestamp).toLocaleString()}
                </td>
                <td className="p-4 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTx(tx)}
                    className="text-xs flex items-center space-x-1 ml-auto"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Ledger</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-sm text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(page * pageSize, transactions.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{transactions.length}</span> entries
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

      {/* Detail Dialog overlay */}
      {selectedTx && (
        <TransactionDetailsDialog
          transaction={selectedTx}
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
