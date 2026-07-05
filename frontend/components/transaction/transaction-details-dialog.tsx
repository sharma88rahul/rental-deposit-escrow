"use client";

import * as React from "react";
import { useActivity } from "@/hooks/useActivity";
import { Transaction } from "@/types";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Copy, Check, ArrowUpRight, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsDialog({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailsDialogProps) {
  const { retryTxMutation } = useActivity();
  const [copied, setCopied] = React.useState(false);

  if (!transaction) return null;

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(transaction.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async () => {
    try {
      await retryTxMutation.mutateAsync(transaction.hash);
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
    Failed: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Transaction Ledger Details">
      <div className="space-y-5">
        <div className="rounded-lg bg-secondary/30 border border-border/40 p-4 space-y-3.5 text-sm">
          {/* Status Row */}
          <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
            <span className="text-muted-foreground font-semibold">Ledger Status:</span>
            <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold border ${statusColors[transaction.status]}`}>
              {transaction.status}
            </span>
          </div>

          {/* Operation type */}
          <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
            <span className="text-muted-foreground font-semibold">Operation:</span>
            <span className="font-semibold text-foreground">{transaction.type}</span>
          </div>

          {/* Transaction hash */}
          <div className="space-y-1.5 border-b border-border/40 pb-2.5">
            <span className="text-muted-foreground font-semibold block">Transaction Hash:</span>
            <div className="flex items-center justify-between gap-2 bg-secondary/50 p-2 rounded-md font-mono text-xs text-foreground">
              <span className="truncate max-w-[280px]">{transaction.hash}</span>
              <button
                onClick={handleCopyHash}
                className="hover:text-primary transition-colors cursor-pointer shrink-0"
                title="Copy Hash"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Wallet used */}
          <div className="space-y-1 border-b border-border/40 pb-2.5">
            <span className="text-muted-foreground font-semibold block">Signer Address:</span>
            <span className="font-mono text-xs text-foreground block truncate">{transaction.walletUsed}</span>
          </div>

          {/* Agreement ID mapping */}
          {transaction.agreementId && (
            <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
              <span className="text-muted-foreground font-semibold">Related Agreement:</span>
              <span className="font-semibold text-foreground">#{transaction.agreementId}</span>
            </div>
          )}

          {/* Gas fees */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold">Stellar Base Fee:</span>
            <span className="font-mono text-foreground font-semibold">{transaction.fee}</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex justify-between items-center gap-3 pt-2">
          {transaction.status === "Failed" ? (
            <Button
              onClick={handleRetry}
              isLoading={retryTxMutation.isPending}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Broadcast</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close Details
            </Button>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="flex items-center space-x-1.5">
                <span>View on Explorer</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
