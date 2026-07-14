"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Lock,
  History,
  TrendingUp,
  ShieldCheck,
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { useWalletStore } from "@/store/useWalletStore";
import { siteConfig } from "@/config/site";
import { AgreementService } from "@/services/agreement";
import { EscrowService } from "@/services/escrow";
import { SorobanClient } from "@/services/soroban-client-new";

export default function DashboardPage() {
  const { agreements, transactions } = useStore();

  React.useEffect(() => {
    // Reload live agreements & escrows on mount
    AgreementService.fetchAgreements();
    EscrowService.fetchEscrows();

    const walletState = useWalletStore.getState();
    if (walletState.connected && walletState.walletAddress) {
      SorobanClient.fetchHorizonTransactions(walletState.walletAddress).then((txs) => {
        if (txs && txs.length > 0) {
          useStore.setState({ transactions: txs });
        }
      });
    }
  }, []);

  // Compute metrics based on mock data
  const totalAgreements = agreements.length;
  const activeLeases = agreements.filter((a) => a.status === "LeaseActive" || a.status === "RefundRequested" || a.status === "DisputeRaised").length;
  const completedLeases = agreements.filter((a) => a.status === "FundsReleased").length;
  
  // Calculate total escrow balance
  const totalEscrowBalance = agreements
    .filter((a) => a.status === "LeaseActive" || a.status === "RefundRequested" || a.status === "DisputeRaised")
    .reduce((acc, curr) => acc + parseFloat(curr.depositAmount), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Portal Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your rental contracts and escrow deposits.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={siteConfig.routes.createAgreement}>
            <Button className="flex items-center space-x-2">
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Create Agreement</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Agreements</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgreements}</div>
            <p className="text-xs text-muted-foreground mt-1">Signed contracts on-chain</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leases</CardTitle>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeases}</div>
            <p className="text-xs text-muted-foreground mt-1">Leases currently active</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Escrow Balance</CardTitle>
            <Lock className="h-5 w-5 text-primary animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEscrowBalance.toLocaleString()} XLM</div>
            <p className="text-xs text-muted-foreground mt-1">Locked in smart contracts</p>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Leases</CardTitle>
            <History className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLeases}</div>
            <p className="text-xs text-muted-foreground mt-1">Funds settled and released</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Agreements & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agreements Table Summary */}
        <Card glass className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Agreements</CardTitle>
              <CardDescription>Status summary of your latest rental contracts.</CardDescription>
            </div>
            <Link href={siteConfig.routes.agreements}>
              <Button variant="ghost" size="sm" className="text-xs flex items-center space-x-1">
                <span>View All</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="pb-3 font-semibold">Lease</th>
                    <th className="pb-3 font-semibold">Deposit</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {agreements.slice(0, 3).map((agreement) => (
                    <tr key={agreement.id} className="hover:bg-secondary/25 transition-colors">
                      <td className="py-3.5">
                        <div className="font-medium text-foreground">
                          {agreement.title || `Agreement #${agreement.id}`}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                          {agreement.propertyAddress}
                        </div>
                      </td>
                      <td className="py-3.5 font-medium">{agreement.depositAmount} XLM</td>
                      <td className="py-3.5">
                        <Badge status={agreement.status} />
                      </td>
                      <td className="py-3.5 text-right">
                        <Link href={`${siteConfig.routes.agreements}/${agreement.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <div className="space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle>Escrow Quick Actions</CardTitle>
              <CardDescription>Manage security deposits directly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={siteConfig.routes.escrowCenter} className="block">
                <Button variant="outline" className="w-full justify-start space-x-3 text-sm">
                  <Lock className="h-4.5 w-4.5 text-primary" />
                  <span>Lock Security Deposit</span>
                </Button>
              </Link>
              <Link href={siteConfig.routes.transactionCenter} className="block">
                <Button variant="outline" className="w-full justify-start space-x-3 text-sm">
                  <History className="h-4.5 w-4.5 text-primary" />
                  <span>View Transaction History</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle>Recent Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactions.slice(0, 3).map((tx) => (
                <div key={tx.hash} className="flex justify-between items-start text-xs border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-semibold text-foreground">{tx.type}</div>
                    <div className="text-muted-foreground mt-0.5">{tx.hash}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-500 font-medium">{tx.status}</span>
                    <div className="text-muted-foreground mt-0.5">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
