"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Gavel,
  Coins,
  Edit3,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { useAgreements, useAgreementDetails } from "@/hooks/useAgreements";
import { useEscrow } from "@/hooks/useEscrow";
import { editAgreementSchema } from "@/utils/validation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { PageLoader } from "@/components/ui/loader";
import { AgreementTimeline } from "@/components/agreement/agreement-timeline";
import { siteConfig } from "@/config/site";

export default function AgreementDetailsPage() {
  const params = useParams();
  const agreementId = parseInt(params.id as string);

  // React Query Operations for Agreements and Escrows
  const { data: agreement, isLoading } = useAgreementDetails(agreementId);
  const {
    acceptAgreementMutation,
    cancelAgreementMutation,
    editAgreementMutation,
  } = useAgreements();

  const {
    escrowsQuery,
    lockDepositMutation,
    releaseDepositFullyMutation,
    requestDeductionMutation,
    approveDeductionMutation,
    raiseDisputeMutation,
    resolveDisputeMutation: resolveEscrowDisputeMutation,
  } = useEscrow();

  const escrows = escrowsQuery.data || [];
  const escrow = escrows.find((e) => e.agreementId === agreementId);

  // Modal UI States
  const [isDeductOpen, setIsDeductOpen] = React.useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [deductInput, setDeductInput] = React.useState("");
  const [disputeInput, setDisputeInput] = React.useState("");

  // Edit Draft Form States
  const [editTitle, setEditTitle] = React.useState("");
  const [editAddress, setEditAddress] = React.useState("");
  const [editAmount, setEditAmount] = React.useState("");
  const [editErrors, setEditErrors] = React.useState<Record<string, string>>({});

  // Initialize edit fields when draft modal opens
  React.useEffect(() => {
    if (agreement && isEditOpen) {
      const frameId = requestAnimationFrame(() => {
        setEditTitle(agreement.title || "");
        setEditAddress(agreement.propertyAddress || "");
        setEditAmount(agreement.depositAmount || "");
        setEditErrors({});
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [agreement, isEditOpen]);

  if (isLoading) {
    return <PageLoader />;
  }

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

  const handleAccept = async () => {
    try {
      await acceptAgreementMutation.mutateAsync(agreementId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelDraft = async () => {
    try {
      await cancelAgreementMutation.mutateAsync(agreementId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLockDeposit = async () => {
    try {
      await lockDepositMutation.mutateAsync(agreementId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseFull = async () => {
    try {
      await releaseDepositFullyMutation.mutateAsync(agreementId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrors({});

    const validation = editAgreementSchema.safeParse({
      title: editTitle,
      propertyAddress: editAddress,
      depositAmount: editAmount,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setEditErrors(errors);
      return;
    }

    try {
      await editAgreementMutation.mutateAsync({
        id: agreementId,
        title: editTitle,
        propertyAddress: editAddress,
        depositAmount: editAmount,
      });
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductInput || parseFloat(deductInput) < 0 || parseFloat(deductInput) > parseFloat(agreement.depositAmount)) {
      return;
    }
    try {
      await requestDeductionMutation.mutateAsync({
        agreementId,
        deductionAmount: deductInput,
      });
      setIsDeductOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveDeductionSplit = async () => {
    try {
      await approveDeductionMutation.mutateAsync({
        agreementId,
        tenantRefundAmount: agreement.refundRequestedAmount,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRaiseDispute = async () => {
    try {
      await raiseDisputeMutation.mutateAsync(agreementId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleArbitrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeInput || parseFloat(disputeInput) < 0 || parseFloat(disputeInput) > parseFloat(agreement.depositAmount)) {
      return;
    }
    try {
      await resolveEscrowDisputeMutation.mutateAsync({
        agreementId,
        tenantRefundAmount: disputeInput,
      });
      setIsDisputeOpen(false);
    } catch (err) {
      console.error(err);
    }
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
                    <div className="font-bold text-lg mt-0.5 text-primary">{agreement.depositAmount} XLM</div>
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

              {/* Escrow Contract Vault Ledger Status */}
              {escrow && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4.5 space-y-3">
                  <h4 className="font-bold text-primary flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                    <span>Escrow Ledger Audit Box</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Escrow ID</span>
                      <span className="font-semibold text-foreground">#{escrow.escrowId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Current Holder</span>
                      <span className="font-semibold text-foreground">{escrow.currentHolder}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Remaining Balance</span>
                      <span className="font-bold text-amber-500">{escrow.remainingBalance} XLM</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Released Split</span>
                      <span className="font-bold text-primary">{escrow.releasedAmount} XLM</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-2.5 border-t border-primary/10 flex items-center justify-between">
                    <span>Locked Date: {escrow.lockedAt ? new Date(escrow.lockedAt).toLocaleString() : "Awaiting Deposit"}</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${escrow.escrowId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold"
                    >
                      View on Stellar.expert
                    </a>
                  </div>
                </div>
              )}

              {/* Proposed Splits */}
              {agreement.status === "RefundRequested" && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-2">
                  <h4 className="font-semibold text-amber-500 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="h-4.5 w-4.5" />
                    Proposed Refund Release Split
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Refund to Tenant:</span>
                      <span className="font-bold text-foreground ml-1.5">{agreement.refundRequestedAmount} XLM</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deduction to Landlord:</span>
                      <span className="font-bold text-foreground ml-1.5">
                        {parseFloat(agreement.depositAmount) - parseFloat(agreement.refundRequestedAmount)} XLM
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Interactive Escrow State Machine Actions */}
            <CardFooter className="bg-secondary/10 border-t border-border/40 p-6 flex justify-end gap-3 flex-wrap">
              {/* Draft Actions */}
              {agreement.status === "Created" && (
                <>
                  <Button variant="outline" onClick={() => setIsEditOpen(true)} className="flex items-center space-x-1.5">
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Draft</span>
                  </Button>
                  <Button variant="destructive" onClick={handleCancelDraft} isLoading={cancelAgreementMutation.isPending} className="flex items-center space-x-1.5">
                    <XCircle className="h-4 w-4" />
                    <span>Cancel Agreement</span>
                  </Button>
                  <Button onClick={handleAccept} isLoading={acceptAgreementMutation.isPending} className="flex items-center space-x-1.5">
                    <CheckCircle className="h-4 w-4" />
                    <span>Accept Terms</span>
                  </Button>
                </>
              )}

              {/* Accepted (Unfunded) -> Tenant locks deposit */}
              {agreement.status === "Accepted" && (
                <Button onClick={handleLockDeposit} isLoading={lockDepositMutation.isPending} className="flex items-center space-x-1.5">
                  <Coins className="h-4 w-4" />
                  <span>Lock Security Deposit</span>
                </Button>
              )}

              {/* Active Lease -> Landlord can Propose deduction or Release fully */}
              {agreement.status === "LeaseActive" && (
                <>
                  <Button variant="outline" onClick={handleReleaseFull} isLoading={releaseDepositFullyMutation.isPending} className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Release Full Refund</span>
                  </Button>
                  <Button onClick={() => setIsDeductOpen(true)} className="flex items-center space-x-1.5">
                    <Coins className="h-4 w-4" />
                    <span>Propose Deduction</span>
                  </Button>
                </>
              )}

              {/* Refund proposed -> Tenant approves split or rejects / raises dispute */}
              {agreement.status === "RefundRequested" && (
                <>
                  <Button variant="destructive" onClick={handleRaiseDispute} isLoading={raiseDisputeMutation.isPending} className="flex items-center space-x-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Raise Dispute</span>
                  </Button>
                  <Button onClick={handleApproveDeductionSplit} isLoading={approveDeductionMutation.isPending} className="flex items-center space-x-1.5">
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve Refund Split</span>
                  </Button>
                </>
              )}

              {/* Dispute raised -> Arbitrator resolves */}
              {agreement.status === "DisputeRaised" && (
                <Button onClick={() => setIsDisputeOpen(true)} className="flex items-center space-x-1.5">
                  <Gavel className="h-4 w-4" />
                  <span>Resolve Dispute (Arbitrator)</span>
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
              <AgreementTimeline status={agreement.status} createdAt={agreement.createdAt || ""} />
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Dialog: Propose Deduction */}
      <Dialog isOpen={isDeductOpen} onClose={() => setIsDeductOpen(false)} title="Propose Deduction Split">
        <form onSubmit={handleDeductionSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Tenant Refund Allocation (XLM)</label>
            <input
              type="number"
              placeholder={`Max ${agreement.depositAmount}`}
              value={deductInput}
              onChange={(e) => setDeductInput(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tenant receives {deductInput || 0} XLM. Landlord retains the remaining balance ({parseFloat(agreement.depositAmount) - (parseFloat(deductInput) || 0)} XLM) for repairs or unpaid rent.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsDeductOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={requestDeductionMutation.isPending}>
              Propose Split
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Dispute Resolution */}
      <Dialog isOpen={isDisputeOpen} onClose={() => setIsDisputeOpen(false)} title="Arbitration Resolution Split">
        <form onSubmit={handleArbitrationSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Tenant Refund Allocation (XLM)</label>
            <input
              type="number"
              placeholder={`Max ${agreement.depositAmount}`}
              value={disputeInput}
              onChange={(e) => setDisputeInput(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Submit the binding split: {disputeInput || 0} XLM to Tenant, and {parseFloat(agreement.depositAmount) - (parseFloat(disputeInput) || 0)} XLM to Landlord.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsDisputeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={resolveEscrowDisputeMutation.isPending} className="flex items-center space-x-2">
              <Gavel className="h-4.5 w-4.5" />
              <span>Issue Settlement</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Edit Draft */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Agreement Draft">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Agreement Title *</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {editErrors.title && <p className="text-xs text-red-500">{editErrors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Property Location Address *</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {editErrors.propertyAddress && <p className="text-xs text-red-500">{editErrors.propertyAddress}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Security Deposit (XLM) *</label>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {editErrors.depositAmount && <p className="text-xs text-red-500">{editErrors.depositAmount}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={editAgreementMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
