import * as React from "react";
import { AgreementStatus } from "@/types";
import { CheckCircle, Clock, AlertTriangle, Coins, ShieldCheck, XCircle } from "lucide-react";

interface AgreementTimelineProps {
  status: AgreementStatus;
  createdAt: string;
}

export function AgreementTimeline({ status, createdAt }: AgreementTimelineProps) {
  // Convert status to timeline sequence
  const steps = [
    {
      key: "Created",
      title: "Agreement Drafted",
      desc: "Landlord created terms and hashes registered on-chain.",
      icon: Clock,
      date: new Date(createdAt).toLocaleDateString(),
    },
    {
      key: "Accepted",
      title: "Agreement Signed",
      desc: "Tenant signed and accepted the contract terms.",
      icon: CheckCircle,
      date: status !== "Created" && status !== "Draft" ? new Date(createdAt).toLocaleDateString() : undefined,
    },
    {
      key: "LeaseActive",
      title: "Deposit Escrow Locked",
      desc: "Tenant funded the escrow vault; lease is active.",
      icon: Coins,
      date: (status === "LeaseActive" || status === "RefundRequested" || status === "FundsReleased" || status === "Resolved") 
        ? new Date(createdAt).toLocaleDateString() 
        : undefined,
    },
    {
      key: "RefundRequested",
      title: "Refund Proposed",
      desc: "Landlord proposed split release for refund deductions.",
      icon: AlertTriangle,
      date: (status === "RefundRequested" || status === "FundsReleased" || status === "Resolved") 
        ? new Date(createdAt).toLocaleDateString() 
        : undefined,
    },
    {
      key: "Settled",
      title: "Funds Disbursed",
      desc: "Escrow funds released according to split approvals.",
      icon: ShieldCheck,
      date: (status === "FundsReleased" || status === "Resolved") 
        ? new Date(createdAt).toLocaleDateString() 
        : undefined,
    },
  ];

  // Helper to determine step states
  const getStepState = (stepKey: string, idx: number) => {
    const statusOrder: Record<AgreementStatus, number> = {
      Draft: 0,
      Created: 1,
      Accepted: 2,
      DepositLocked: 3,
      LeaseActive: 3,
      RefundRequested: 4,
      Approved: 5,
      DisputeRaised: 4,
      Resolved: 5,
      FundsReleased: 5,
    };

    const currentOrder = statusOrder[status] || 0;

    if (stepKey === "Settled") {
      return currentOrder >= 5 ? "complete" : "upcoming";
    }

    const stepOrder = statusOrder[stepKey as AgreementStatus] || 0;

    if (currentOrder > stepOrder) return "complete";
    if (currentOrder === stepOrder) return "active";
    return "upcoming";
  };

  return (
    <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
      {steps.map((s, idx) => {
        const Icon = s.icon;
        const state = getStepState(s.key, idx);

        return (
          <div key={s.key} className="flex items-start space-x-3 text-sm relative">
            <div
              className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${
                state === "complete"
                  ? "bg-primary border-primary text-primary-foreground"
                  : state === "active"
                  ? "bg-secondary border-primary text-primary font-bold animate-pulse"
                  : "bg-secondary border-border text-muted-foreground"
              }`}
            >
              {state === "complete" ? <CheckCircle className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
            </div>
            <div className="flex-1 pt-1.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`font-semibold ${state === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>
                  {s.title}
                </h4>
                {s.date && <span className="text-xs text-muted-foreground">{s.date}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
