"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Unlock, HelpCircle, Coins, ArrowUpRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

export default function EscrowCenterPage() {
  const { agreements, updateAgreementStatus, addTransaction, addActivity } = useStore();
  const [isLoading, setIsLoading] = React.useState<number | null>(null);

  // Filter agreements ready to be deposited (Accepted state)
  const depositQueue = agreements.filter((a) => a.status === "Accepted");

  // Filter agreements currently locked in escrow
  const lockedEscrow = agreements.filter(
    (a) => a.status === "LeaseActive" || a.status === "RefundRequested" || a.status === "DisputeRaised"
  );

  const handleLockDeposit = (id: number, amount: string) => {
    setIsLoading(id);
    setTimeout(() => {
      updateAgreementStatus(id, "LeaseActive");

      // Log transaction
      addTransaction({
        hash: Math.random().toString(36).substring(2, 10) + "..." + Math.random().toString(36).substring(2, 6),
        type: "Lock Deposit",
        status: "Confirmed",
        fee: "0.00021 XLM",
        agreementId: id,
        walletUsed: "GBTR5R5P...TENA",
      });

      // Log activity event
      addActivity({
        type: "DepositLocked",
        details: `Tenant deposited ${amount} USDC into Escrow Contract (Agreement #${id})`,
        txHash: "tx-" + Math.random().toString(36).substring(2, 8),
      });

      setIsLoading(null);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Escrow Center</h1>
        <p className="text-muted-foreground mt-1">
          Lock tenant security deposits and approve release splits using Stellar contracts.
        </p>
      </div>

      {/* Escrow overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Deposit Queue */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-primary" />
              <span>Pending Escrow Deposits</span>
            </CardTitle>
            <CardDescription>
              Rental agreements accepted by tenants but awaiting deposit funding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {depositQueue.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No agreements are currently waiting for deposit.
              </div>
            ) : (
              depositQueue.map((a) => (
                <div key={a.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-secondary/35 border border-border/40 gap-4">
                  <div>
                    <div className="font-semibold">{a.title || `Agreement #${a.id}`}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.propertyAddress}</div>
                    <div className="text-xs font-mono mt-1 text-primary">{a.depositAmount} USDC</div>
                  </div>
                  <Button
                    size="sm"
                    isLoading={isLoading === a.id}
                    onClick={() => handleLockDeposit(a.id, a.depositAmount)}
                    className="w-full sm:w-auto"
                  >
                    Lock Deposit
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Locked Vaults */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              <span>Active Locked Vaults</span>
            </CardTitle>
            <CardDescription>
              Funds secured by the escrow contract throughout the active lease duration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lockedEscrow.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No escrow vaults are currently locked.
              </div>
            ) : (
              lockedEscrow.map((a) => (
                <div key={a.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-secondary/35 border border-border/40 gap-4">
                  <div>
                    <div className="font-semibold">{a.title || `Agreement #${a.id}`}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">{a.propertyAddress}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      Vault: <span className="font-semibold text-emerald-500">{a.depositAmount} USDC</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Badge status={a.status} />
                    <Link href={`${siteConfig.routes.agreements}/${a.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract Explanatory Info */}
      <Card glass className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-primary">
            <HelpCircle className="h-5 w-5" />
            <span>Understanding Stellar Escrows</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
          <p>
            RentSure leverages **Soroban smart contract-to-contract (C2C)** calls to ensure complete segregation of duties.
            The *Rental Agreement contract* stores metadata and states, and dictates parameters to the *Escrow contract*.
          </p>
          <p>
            When a tenant triggers `Lock Deposit`, the Stellar Asset Contract (SAC) transfers tokens directly into the Escrow contract vault.
            These tokens cannot be released unless the Rental Agreement state is transitioned to approved release splits or settled by the arbitrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
