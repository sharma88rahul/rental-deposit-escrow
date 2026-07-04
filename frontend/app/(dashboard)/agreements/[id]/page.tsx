"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Lock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  History,
  CheckCircle,
  Gavel,
  Coins,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
import { AgreementStatus } from "@/types";

export default function AgreementDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const agreementId = parseInt(params.id as string);
  const { agreements, updateAgreementStatus, requestRefund, addTransaction, addActivity } = useStore();

  const [isRefundOpen, setIsRefundOpen] = React.useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = React.useState(false);
  const [refundInput, setRefundInput] = React.useState("");
  const [disputeInput, setDisputeInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const agreement = agreements.find((a) => a.id === agreementId);

  if (!agreement) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-2xl font-bold">Agreement Not Found</h2>
        <p className="text-muted-foreground">The requested contract ID does not exist.</p>
        <Link href={siteConfig.routes.agreements}>
          <Button variant="outline">Back to list</Button>
        </Link>
      </div>
    );
  }

  // Helper to check what steps are completed
  const getStepStatus = (step: number) => {
    const statusMap: Record<AgreementStatus, number> = {
      Draft: 0,
      Created: 1,
      Accepted: 2,
      DepositLocked: 3,
      LeaseActive: 4,
      RefundRequested: 5,
      Approved: 6,
      DisputeRaised: 6,
      Resolved: 7,
      FundsReleased: 8,
    };
    
    const currentStep = statusMap[agreement.status] || 0;
    if (currentStep >= step) return "complete";
    if (currentStep + 1 === step) return "active";
    return "upcoming";
  };

  const simulateAction = (actionName: string, transitionTo: AgreementStatus, detailsMsg: string, callback?: () => void) => {
    setIsLoading(true);
    setTimeout(() => {
      if (callback) {
        callback();
      } else {
        updateAgreementStatus(agreementId, transitionTo);
      }
      
      // Add Mock Transaction
      addTransaction({
        hash: Math.random().toString(36).substring(2, 10) + "..." + Math.random().toString(36).substring(2, 6),
        type: actionName,
        status: "Confirmed",
        fee: "0.00014 XLM",
        agreementId,
        walletUsed: "GBTR5R5P...TENA",
      });

      // Add Activity Event
      addActivity({
        type: transitionTo === "DisputeRaised" ? "DisputeRaised" : "FundsReleased",
        details: detailsMsg,
        txHash: "tx-" + Math.random().toString(36).substring(2, 8),
      });

      setIsLoading(false);
      setIsRefundOpen(false);
      setIsDisputeOpen(false);
    }, 1500);
  };

  const handleAccept = () => {
    simulateAction(
      "Accept Agreement",
      "Accepted",
      `Tenant accepted the agreement terms (Agreement #${agreementId})`
    );
  };

  const handleLock = () => {
    simulateAction(
      "Lock Deposit",
      "LeaseActive",
      `Tenant locked ${agreement.depositAmount} USDC and activated the lease (Agreement #${agreementId})`
    );
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundInput || parseFloat(refundInput) < 0 || parseFloat(refundInput) > parseFloat(agreement.depositAmount)) {
      return;
    }
    simulateAction(
      "Propose Refund",
      "RefundRequested",
      `Landlord proposed split: refund ${refundInput} USDC to Tenant (Agreement #${agreementId})`,
      () => requestRefund(agreementId, refundInput)
    );
  };

  const handleTenantApprove = () => {
    simulateAction(
      "Approve Release",
      "FundsReleased",
      `Tenant approved the proposed release split. Funds disbursed. (Agreement #${agreementId})`
    );
  };

  const handleTenantDispute = () => {
    simulateAction(
      "Raise Dispute",
      "DisputeRaised",
      `Tenant disputed the proposed refund amount. Raised to Arbitration. (Agreement #${agreementId})`
    );
  };

  const handleArbitrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeInput || parseFloat(disputeInput) < 0 || parseFloat(disputeInput) > parseFloat(agreement.depositAmount)) {
      return;
    }
    simulateAction(
      "Resolve Dispute",
      "FundsReleased",
      `Arbitrator resolved dispute for Agreement #${agreementId}. Split: ${disputeInput} USDC to Tenant.`,
      () => {
        requestRefund(agreementId, disputeInput);
        updateAgreementStatus(agreementId, "FundsReleased");
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link href={siteConfig.routes.agreements} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground space-x-1.5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Agreements</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">{agreement.title || `Agreement #${agreement.id}`}</h1>
            <Badge status={agreement.status} />
          </div>
          <p className="text-muted-foreground mt-1">ID: {agreement.id} • Registered on-chain</p>
        </div>
      </div>

      {/* Main Grid: Details vs Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Agreement Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle>Agreement Specifications</CardTitle>
              <CardDescription>Visual inspection of the signed digital lease contract details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Property Details */}
              <div className="flex items-start space-x-3 border-b border-border/40 pb-4">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <div className="text-xs text-muted-foreground">Property Location</div>
                  <div className="font-semibold text-base mt-0.5">{agreement.propertyAddress}</div>
                </div>
              </div>

              {/* Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-border/40 pb-4">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-xs text-muted-foreground">Landlord Address</div>
                    <div className="font-mono text-sm mt-0.5">{agreement.landlord}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-xs text-muted-foreground">Tenant Address</div>
                    <div className="font-mono text-sm mt-0.5">{agreement.tenant}</div>
                  </div>
                </div>
              </div>

              {/* Financials & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
                <div className="flex items-start space-x-3">
                  <Coins className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-xs text-muted-foreground">Required Deposit</div>
                    <div className="font-bold text-lg mt-0.5 text-primary">{agreement.depositAmount} USDC</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-xs text-muted-foreground">Lease Term</div>
                    <div className="font-bold text-lg mt-0.5">{(agreement.duration / (30 * 24 * 3600)).toFixed(0)} Months</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="text-xs text-muted-foreground">Token Address</div>
                    <div className="font-mono text-xs mt-0.5 truncate max-w-[120px]">{agreement.token}</div>
                  </div>
                </div>
              </div>

              {/* Proposed Splits (Show if RefundRequested) */}
              {agreement.status === "RefundRequested" && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-2">
                  <h4 className="font-semibold text-amber-500 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="h-4.5 w-4.5" />
                    Proposed Refund Release Split
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Refund to Tenant:</span>
                      <span className="font-bold text-foreground ml-1.5">{agreement.refundRequestedAmount} USDC</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deduction to Landlord:</span>
                      <span className="font-bold text-foreground ml-1.5">
                        {parseFloat(agreement.depositAmount) - parseFloat(agreement.refundRequestedAmount)} USDC
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Context-based Interactive Simulation Actions */}
            <CardFooter className="bg-secondary/10 border-t border-border/40 p-6 flex justify-end gap-3 flex-wrap">
              {agreement.status === "Created" && (
                <Button onClick={handleAccept} isLoading={isLoading}>
                  Accept Terms (Tenant Action)
                </Button>
              )}

              {agreement.status === "Accepted" && (
                <Button onClick={handleLock} isLoading={isLoading}>
                  Lock Deposit & Activate Lease (Tenant Action)
                </Button>
              )}

              {agreement.status === "LeaseActive" && (
                <Button onClick={() => setIsRefundOpen(true)} isLoading={isLoading}>
                  Propose Refund Release (Landlord Action)
                </Button>
              )}

              {agreement.status === "RefundRequested" && (
                <>
                  <Button variant="destructive" onClick={handleTenantDispute} isLoading={isLoading}>
                    Raise Dispute
                  </Button>
                  <Button onClick={handleTenantApprove} isLoading={isLoading}>
                    Approve Release
                  </Button>
                </>
              )}

              {agreement.status === "DisputeRaised" && (
                <Button onClick={() => setIsDisputeOpen(true)} isLoading={isLoading}>
                  Resolve Dispute (Arbitrator Action)
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Right: State Timeline */}
        <div className="space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle>Lifecycle Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                {[
                  { step: 1, title: "Agreement Created", desc: "Contract metadata drafted on Stellar." },
                  { step: 2, title: "Agreement Accepted", desc: "Tenant signs matching the landlord specifications." },
                  { step: 4, title: "Deposit Vaulted & Active", desc: "Escrow secures funds, activating the lease." },
                  { step: 5, title: "Refund Proposed", desc: "Landlord requests splits for refund/deductions." },
                  { step: 8, title: "Funds Disbursed", desc: "Escrow splits released automatically. Lease complete." }
                ].map((s) => {
                  const status = getStepStatus(s.step);
                  return (
                    <div key={s.step} className="flex items-start space-x-3 text-sm relative">
                      <div className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${
                        status === "complete"
                          ? "bg-primary border-primary text-primary-foreground"
                          : status === "active"
                          ? "bg-secondary border-primary text-primary animate-pulse font-bold"
                          : "bg-secondary border-border text-muted-foreground"
                      }`}>
                        {status === "complete" ? <CheckCircle className="h-4.5 w-4.5" /> : s.step}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <h4 className={`font-semibold ${status === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>
                          {s.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Dialog: Propose Refund (Landlord) */}
      <Dialog isOpen={isRefundOpen} onClose={() => setIsRefundOpen(false)} title="Propose Security Deposit Split">
        <form onSubmit={handleRefundSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Tenant Refund Amount (USDC)</label>
            <input
              type="number"
              placeholder={`Max ${agreement.depositAmount}`}
              value={refundInput}
              onChange={(e) => setRefundInput(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              The remaining balance ({parseFloat(agreement.depositAmount) - (parseFloat(refundInput) || 0)} USDC) will be disbursed to your wallet as deduction.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsRefundOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Propose</Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Dispute Resolution (Arbitrator) */}
      <Dialog isOpen={isDisputeOpen} onClose={() => setIsDisputeOpen(false)} title="Arbitration Resolution Split">
        <form onSubmit={handleArbitrationSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Arbitrator Refund Allocation to Tenant (USDC)</label>
            <input
              type="number"
              placeholder={`Max ${agreement.depositAmount}`}
              value={disputeInput}
              onChange={(e) => setDisputeInput(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Submit the legally binding split: {disputeInput || 0} USDC to Tenant, and {parseFloat(agreement.depositAmount) - (parseFloat(disputeInput) || 0)} USDC to Landlord.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsDisputeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex items-center space-x-2">
              <Gavel className="h-4.5 w-4.5" />
              <span>Issue Settlement</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
