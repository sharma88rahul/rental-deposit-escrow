"use client";

import * as React from "react";
import { History, ExternalLink, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export default function TransactionsPage() {
  const { transactions } = useStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />;
      case "Pending":
      case "Processing":
        return <Clock className="h-4.5 w-4.5 text-amber-500 animate-spin" />;
      case "Failed":
        return <AlertCircle className="h-4.5 w-4.5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Center</h1>
          <p className="text-muted-foreground mt-1">
            Audit log of all on-chain transactions broadcasted to Stellar.
          </p>
        </div>
      </div>

      {/* Transaction Log Table */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <span>Transaction Logs</span>
          </CardTitle>
          <CardDescription>
            Historical records of Soroban smart contract invocations and state changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="pb-3 font-semibold">Tx Hash</th>
                  <th className="pb-3 font-semibold">Invocated Method</th>
                  <th className="pb-3 font-semibold">Signer Wallet</th>
                  <th className="pb-3 font-semibold">Gas Fee</th>
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-secondary/25 transition-colors">
                    <td className="py-3.5 font-mono text-xs text-primary">{tx.hash}</td>
                    <td className="py-3.5 font-medium">{tx.type}</td>
                    <td className="py-3.5 font-mono text-xs text-muted-foreground">{tx.walletUsed}</td>
                    <td className="py-3.5 text-muted-foreground">{tx.fee}</td>
                    <td className="py-3.5 text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center space-x-1.5">
                        {getStatusIcon(tx.status)}
                        <span className={`font-medium ${tx.status === "Confirmed" ? "text-emerald-500" : "text-muted-foreground"}`}>
                          {tx.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-primary hover:underline"
                      >
                        <span>Stellar.expert</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
