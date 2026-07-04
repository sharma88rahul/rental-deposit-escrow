"use client";

import * as React from "react";
import { useWalletInfo } from "@/hooks/useWalletInfo";
import { AlertCircle, Globe } from "lucide-react";
import { Badge } from "../ui/badge";
import { Networks } from "@creit-tech/stellar-wallets-kit";

export function NetworkBadge() {
  const { connected, network, isNetworkMismatch } = useWalletInfo();

  if (!connected) return null;

  if (isNetworkMismatch) {
    return (
      <Badge variant="danger" className="flex items-center space-x-1 animate-pulse">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Network Mismatch (Change Wallet to Testnet)</span>
      </Badge>
    );
  }

  // Display human-readable network labels
  const networkLabel = network === Networks.TESTNET ? "Testnet" : "Public";

  return (
    <Badge variant="outline" className="flex items-center space-x-1.5 border-primary/20 bg-primary/5 text-primary text-xs py-1">
      <Globe className="h-3.5 w-3.5" />
      <span>{networkLabel}</span>
    </Badge>
  );
}
