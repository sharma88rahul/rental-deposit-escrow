"use client";

import * as React from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { connectWalletService, fetchBalanceService } from "@/services/wallet";
import { Networks } from "@creit-tech/stellar-wallets-kit";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface WalletContextType {
  connect: (walletId: string) => Promise<void>;
  disconnectWallet: () => void;
  changeNetwork: (network: Networks) => void;
}

const WalletContext = React.createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  
  const {
    connected,
    walletAddress,
    network,
    setConnection,
    disconnect,
    setBalance,
    setNetwork,
    setConnecting,
    setError,
  } = useWalletStore();

  // Handle client-side hydration for Zustand persistent stores
  React.useEffect(() => {
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  // React Query to fetch XLM balance, refetching every 10 seconds or when wallet/network changes
  const { data: balanceData } = useQuery({
    queryKey: ["wallet-balance", walletAddress, network],
    queryFn: () => {
      if (!walletAddress) return "0.00";
      return fetchBalanceService(walletAddress, network);
    },
    enabled: mounted && connected && !!walletAddress,
    refetchInterval: 10000, // 10s polling
  });

  // Sync balance with store
  React.useEffect(() => {
    if (balanceData) {
      setBalance(balanceData);
    }
  }, [balanceData, setBalance]);

  const connect = React.useCallback(
    async (walletId: string) => {
      setConnecting(true);
      setError(null);
      try {
        const { address } = await connectWalletService(walletId, network);
        setConnection(address, walletId);
        
        // Invalidate balance query to pull fresh values
        queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      } catch (err: unknown) {
        console.error("Connection failed:", err);
        const errMsg = err instanceof Error ? err.message : "Failed to connect wallet.";
        setError(errMsg);
      }
    },
    [network, setConnection, setConnecting, setError, queryClient]
  );

  const disconnectWallet = React.useCallback(() => {
    disconnect();
    queryClient.removeQueries({ queryKey: ["wallet-balance"] });
  }, [disconnect, queryClient]);

  const changeNetwork = React.useCallback(
    (newNet: Networks) => {
      setNetwork(newNet);
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
    [setNetwork, queryClient]
  );

  const value = React.useMemo(
    () => ({
      connect,
      disconnectWallet,
      changeNetwork,
    }),
    [connect, disconnectWallet, changeNetwork]
  );

  if (!mounted) {
    return null; // Prevent Next.js server-client hydration layout flashes
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
