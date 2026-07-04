"use client";

import * as React from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { Networks } from "@creit-tech/stellar-wallets-kit";

export function useWalletInfo() {
  const {
    connected,
    walletAddress,
    activeWallet,
    network,
    balance,
    isConnecting,
    error,
  } = useWalletStore();

  const [copied, setCopied] = React.useState(false);

  // Shorten wallet address: e.g. GD7K5R5P...TENA -> GD7K...TENA
  const shortenedAddress = React.useMemo(() => {
    if (!walletAddress) return "";
    if (walletAddress.length <= 10) return walletAddress;
    return `${walletAddress.substring(0, 6)}...${walletAddress.substring(
      walletAddress.length - 4
    )}`;
  }, [walletAddress]);

  // Copy address to clipboard
  const copyAddress = React.useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }, [walletAddress]);

  // Verify network matches Testnet
  const isNetworkMismatch = React.useMemo(() => {
    return connected && network !== Networks.TESTNET;
  }, [connected, network]);

  return {
    connected,
    walletAddress,
    shortenedAddress,
    activeWallet,
    network,
    balance,
    isConnecting,
    error,
    copied,
    copyAddress,
    isNetworkMismatch,
  };
}
