"use client";

import * as React from "react";
import { useAgreements } from "@/hooks/useAgreements";
import { createAgreementSchema, CreateAgreementInput } from "@/utils/validation";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Send, Eye, ShieldAlert, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export function AgreementForm() {
  const router = useRouter();
  const { createAgreementMutation } = useAgreements();

  // Form Field States
  const [title, setTitle] = React.useState("");
  const [propertyAddress, setPropertyAddress] = React.useState("");
  const [tenant, setTenant] = React.useState("");
  const [depositAmount, setDepositAmount] = React.useState("");
  const [leaseStartDate, setLeaseStartDate] = React.useState("");
  const [leaseEndDate, setLeaseEndDate] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Validation & Modal UI States
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);

  const handleValidateForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const formData = {
      title,
      propertyAddress,
      tenant,
      depositAmount,
      leaseStartDate,
      leaseEndDate,
      description: description || undefined,
    };

    const validation = createAgreementSchema.safeParse(formData);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    // Validation passed, show preview modal
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    setShowPreview(false);
    setShowConfirm(true);
  };

  const handleFinalSubmit = async () => {
    setGeneralError(null);
    try {
      const start = new Date(leaseStartDate).getTime();
      const end = new Date(leaseEndDate).getTime();
      const durationSeconds = Math.floor((end - start) / 1000);

      // Trigger mutation
      await createAgreementMutation.mutateAsync({
        title,
        propertyAddress,
        tenant,
        token: "USDC (CCFP...MX25)",
        depositAmount,
        duration: durationSeconds,
        metadataHash: "Qm" + Math.random().toString(36).substring(2, 15),
      });

      setShowConfirm(false);
      router.push(siteConfig.routes.agreements);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to broadcast transaction.";
      setGeneralError(errMsg);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {generalError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 flex items-start space-x-2 text-sm text-red-500">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleValidateForm} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Agreement Name / Title *</label>
          <input
            type="text"
            placeholder="e.g. Oakridge Apt 3B Lease"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
          />
          {fieldErrors.title && <p className="text-xs text-red-500">{fieldErrors.title}</p>}
        </div>

        {/* Property Address */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Property Location Address *</label>
          <input
            type="text"
            placeholder="e.g. 542 Oakridge Blvd, Portland, OR"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
          />
          {fieldErrors.propertyAddress && (
            <p className="text-xs text-red-500">{fieldErrors.propertyAddress}</p>
          )}
        </div>

        {/* Tenant Wallet Address */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Tenant Stellar G... Public Key *</label>
          <input
            type="text"
            placeholder="e.g. GBTR5R5P...TENA"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
          />
          {fieldErrors.tenant && <p className="text-xs text-red-500">{fieldErrors.tenant}</p>}
        </div>

        {/* Financial Split / Amount */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Required Security Deposit (USDC) *</label>
          <input
            type="number"
            placeholder="e.g. 1500"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
          />
          {fieldErrors.depositAmount && (
            <p className="text-xs text-red-500">{fieldErrors.depositAmount}</p>
          )}
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Lease Start Date *</label>
            <input
              type="date"
              value={leaseStartDate}
              onChange={(e) => setLeaseStartDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {fieldErrors.leaseStartDate && (
              <p className="text-xs text-red-500">{fieldErrors.leaseStartDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Lease End Date *</label>
            <input
              type="date"
              value={leaseEndDate}
              onChange={(e) => setLeaseEndDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {fieldErrors.leaseEndDate && (
              <p className="text-xs text-red-500">{fieldErrors.leaseEndDate}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Notes / Description (Stored in IPFS)</label>
          <textarea
            placeholder="Include condition of property or customized lease terms..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-500">{fieldErrors.description}</p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button type="submit" className="w-full flex items-center justify-center space-x-2">
            <Eye className="h-4.5 w-4.5" />
            <span>Preview & Review Agreement</span>
          </Button>
        </div>
      </form>

      {/* Dialog 1: Preview Modal */}
      <Dialog isOpen={showPreview} onClose={() => setShowPreview(false)} title="Verify Rental Specifications">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Please inspect the parameters before signing. These terms will be hashed and registered on the Stellar ledger.
          </p>
          <div className="rounded-lg bg-secondary/30 border border-border/60 p-4 space-y-3.5 text-sm">
            <div className="grid grid-cols-2 border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Title:</span>
              <span className="font-semibold">{title}</span>
            </div>
            <div className="grid grid-cols-2 border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Property:</span>
              <span className="font-semibold truncate">{propertyAddress}</span>
            </div>
            <div className="grid grid-cols-2 border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Tenant Address:</span>
              <span className="font-mono text-xs truncate">{tenant}</span>
            </div>
            <div className="grid grid-cols-2 border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Deposit Value:</span>
              <span className="font-bold text-primary">{depositAmount} USDC</span>
            </div>
            <div className="grid grid-cols-2 border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Start Date:</span>
              <span className="font-semibold">{leaseStartDate}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="text-muted-foreground">End Date:</span>
              <span className="font-semibold">{leaseEndDate}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Edit Fields
            </Button>
            <Button onClick={handleConfirmSubmit} className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Confirm & Send</span>
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog 2: Transaction Confirmation */}
      <Dialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Soroban Contract Signature">
        <div className="space-y-5 text-center">
          <div className="mx-auto rounded-full bg-primary/10 p-4 text-primary w-fit animate-pulse">
            <Send className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-base">Authorize Transaction Signature</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Please click confirm to sign and broadcast the `create_agreement` method invocation to Soroban.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalSubmit} isLoading={createAgreementMutation.isPending} className="flex items-center space-x-1.5">
              <Check className="h-4 w-4" />
              <span>Sign Transaction</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
