"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgreementForm } from "@/components/agreement/agreement-form";
import { siteConfig } from "@/config/site";

export default function CreateAgreementPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          href={siteConfig.routes.agreements}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground space-x-1.5 transition-colors"
        >
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

      {/* Form Render */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <AgreementForm />
      </div>
    </div>
  );
}
