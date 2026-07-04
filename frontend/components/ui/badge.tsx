import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AgreementStatus } from "@/types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info";
  status?: AgreementStatus;
}

export function Badge({ className, variant = "default", status, children, ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "text-foreground border border-border",
    success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20",
    info: "bg-sky-500/10 text-sky-500 border border-sky-500/20",
  };

  // Map agreement statuses to visual weights automatically
  let activeVariant = variant;
  if (status) {
    switch (status) {
      case "Draft":
        activeVariant = "outline";
        break;
      case "Created":
        activeVariant = "info";
        break;
      case "Accepted":
        activeVariant = "info";
        break;
      case "DepositLocked":
        activeVariant = "success";
        break;
      case "LeaseActive":
        activeVariant = "success";
        break;
      case "RefundRequested":
        activeVariant = "warning";
        break;
      case "Approved":
        activeVariant = "success";
        break;
      case "FundsReleased":
        activeVariant = "secondary";
        break;
      case "DisputeRaised":
        activeVariant = "danger";
        break;
      case "Resolved":
        activeVariant = "success";
        break;
    }
  }

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[activeVariant], className))}
      {...props}
    >
      {children || status}
    </span>
  );
}
