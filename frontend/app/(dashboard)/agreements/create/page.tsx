"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export default function CreateAgreementPage() {
  const router = useRouter();
  const { addAgreement, addTransaction, addActivity } = useStore();
  
  // Form State
  const [title, setTitle] = React.useState("");
  const [propertyAddress, setPropertyAddress] = React.useState("");
  const [tenantAddress, setTenantAddress] = React.useState("");
  const [depositAmount, setDepositAmount] = React.useState("");
  const [durationMonths, setDurationMonths] = React.useState("12");
  const [description, setDescription] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !propertyAddress || !tenantAddress || !depositAmount) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    if (parseFloat(depositAmount) <= 0) {
      setError("Deposit amount must be greater than 0.");
      return;
    }

    setIsLoading(true);

    // Simulate blockchain mining latency
    setTimeout(() => {
      try {
        const durationSeconds = parseInt(durationMonths) * 30 * 24 * 3600;
        
        // Add to Zustand state
        const agreementId = addAgreement({
          title,
          propertyAddress,
          landlord: "GD7K5R5P...LAND", // Mock landlord address
          tenant: tenantAddress,
          token: "USDC (CCFP...MX25)",
          depositAmount,
          duration: durationSeconds,
          metadataHash: "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        });

        // Add Mock Transaction
        addTransaction({
          hash: Math.random().toString(36).substring(2, 10) + "..." + Math.random().toString(36).substring(2, 6),
          type: "Create Agreement",
          status: "Confirmed",
          fee: "0.00018 XLM",
          agreementId,
          walletUsed: "GD7K5R5P...LAND",
        });

        // Add Mock Activity Feed item
        addActivity({
          type: "AgreementCreated",
          details: `Landlord created a new rental agreement for ${title} (Agreement #${agreementId})`,
          txHash: "tx-" + Math.random().toString(36).substring(2, 8),
        });

        setIsLoading(false);
        router.push(siteConfig.routes.agreements);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to create agreement.";
        setError(errorMsg);
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link href={siteConfig.routes.agreements} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground space-x-1.5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Agreements</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Rental Agreement</h1>
        <p className="text-muted-foreground mt-1">
          Draft a new lease contract and specify deposit amounts for the tenant.
        </p>
      </div>

      {/* Form Card */}
      <Card glass>
        <CardHeader>
          <CardTitle>Agreement Specifications</CardTitle>
          <CardDescription>
            Input property details and tenant address. The tenant will review and lock the funds once created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-500">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Agreement Title *</label>
              <input
                type="text"
                placeholder="e.g. Oakridge Townhouse - Apt 3B"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            {/* Property Address */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Property Address *</label>
              <input
                type="text"
                placeholder="e.g. 542 Oakridge Blvd, Portland, OR"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            {/* Tenant Wallet Address */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Tenant Wallet Address (Stellar G... Address) *</label>
              <input
                type="text"
                placeholder="e.g. GBTR5R5P...TENA"
                value={tenantAddress}
                onChange={(e) => setTenantAddress(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            {/* Amount and Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Deposit Amount */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Security Deposit Amount (USDC) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Lease Duration (Months) *</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="18">18 Months</option>
                  <option value="24">24 Months (2 Years)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Lease Terms / Notes (Stored in IPFS)</label>
              <textarea
                placeholder="Include property conditions, terms, or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button type="submit" isLoading={isLoading} className="w-full flex items-center justify-center space-x-2">
                <Send className="h-4.5 w-4.5" />
                <span>Submit and Sign Agreement</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
