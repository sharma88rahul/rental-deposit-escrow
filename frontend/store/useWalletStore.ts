import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Networks } from "@creit-tech/stellar-wallets-kit";

interface WalletState {
  // Connection State
  connected: boolean;
  walletAddress: string | null;
  activeWallet: string | null; // e.g. "freighter", "albedo", "xbull"
  network: Networks;
  
  // Account Information
  balance: string; // XLM balance
  isConnecting: boolean;
  error: string | null;

  // Actions
  setConnecting: (isConnecting: boolean) => void;
  setConnection: (address: string, wallet: string) => void;
  disconnect: () => void;
  setBalance: (balance: string) => void;
  setNetwork: (network: Networks) => void;
  setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      // Default States
      connected: false,
      walletAddress: null,
      activeWallet: null,
      network: Networks.TESTNET,
      balance: "0.0",
      isConnecting: false,
      error: null,

      // Actions
      setConnecting: (isConnecting) => set({ isConnecting }),
      
      setConnection: (address, wallet) =>
        set({
          connected: true,
          walletAddress: address,
          activeWallet: wallet,
          error: null,
          isConnecting: false,
        }),
      
      disconnect: () =>
        set({
          connected: false,
          walletAddress: null,
          activeWallet: null,
          balance: "0.0",
          error: null,
          isConnecting: false,
        }),
      
      setBalance: (balance) => set({ balance }),
      
      setNetwork: (network) => set({ network }),
      
      setError: (error) => set({ error, isConnecting: false }),
    }),
    {
      name: "rent-sure-wallet-session",
      partialize: (state) => ({
        connected: state.connected,
        walletAddress: state.walletAddress,
        activeWallet: state.activeWallet,
        network: state.network,
      }),
    }
  )
);
