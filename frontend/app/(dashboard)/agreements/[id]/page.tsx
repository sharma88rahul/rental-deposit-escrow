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
} from "lucide-react";
import { useAgreements, useAgreementDetails } from "@/hooks/useAgreements";
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

  // React Query Operations
  const { data: agreement, isLoading } = useAgreementDetails(agreementId);
  const {
    acceptAgreementMutation,
    proposeRefundMutation,
    resolveDisputeMutation,
    cancelAgreementMutation,
    editAgreementMutation,
  } = useAgreements();

  // Modal UI States
  const [isRefundOpen, setIsRefundOpen] = React.useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [refundInput, setRefundInput] = React.useState("");
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

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundInput || parseFloat(refundInput) < 0 || parseFloat(refundInput) > parseFloat(agreement.depositAmount)) {
      return;
    }
    try {
      await proposeRefundMutation.mutateAsync({
        id: agreementId,
        refundAmount: refundInput,
      });
      setIsRefundOpen(false);
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
      await resolveDisputeMutation.mutateAsync({
        id: agreementId,
        refundAmount: disputeInput,
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
            
            {/* Interactive Simulation Actions */}
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

              {agreement.status === "LeaseActive" && (
                <Button onClick={() => setIsRefundOpen(true)} className="flex items-center space-x-1.5">
                  <Coins className="h-4 w-4" />
                  <span>Propose Refund Split</span>
                </Button>
              )}

              {agreement.status === "DisputeRaised" && (
                <Button onClick={() => setIsDisputeOpen(true)} className="flex items-center space-x-1.5">
                  <Gavel className="h-4 w-4" />
                  <span>Arbitrate Dispute</span>
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

      {/* Dialog: Propose Refund */}
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
            <p className="text-xs text-muted-foreground mt-1">
              The remaining balance ({parseFloat(agreement.depositAmount) - (parseFloat(refundInput) || 0)} USDC) will be disbursed to the landlord.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsRefundOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={proposeRefundMutation.isPending}>
              Submit Proposal
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Dispute Resolution */}
      <Dialog isOpen={isDisputeOpen} onClose={() => setIsDisputeOpen(false)} title="Arbitration Resolution Split">
        <form onSubmit={handleArbitrationSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Tenant Refund Allocation (USDC)</label>
            <input
              type="number"
              placeholder={`Max ${agreement.depositAmount}`}
              value={disputeInput}
              onChange={(e) => setDisputeInput(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Submit the binding split: {disputeInput || 0} USDC to Tenant, and {parseFloat(agreement.depositAmount) - (parseFloat(disputeInput) || 0)} USDC to Landlord.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsDisputeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={resolveDisputeMutation.isPending} className="flex items-center space-x-2">
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
            <label className="text-sm font-semibold">Security Deposit (USDC) *</label>
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
