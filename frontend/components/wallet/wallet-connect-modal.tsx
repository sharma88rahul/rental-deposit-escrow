"use client";

import * as React from "react";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletInfo } from "@/hooks/useWalletInfo";
import { Dialog } from "@/components/ui/dialog";
import { FREIGHTER_ID } from "@creit-tech/stellar-wallets-kit/modules/freighter";
import { ALBEDO_ID } from "@creit-tech/stellar-wallets-kit/modules/albedo";
import { XBULL_ID } from "@creit-tech/stellar-wallets-kit/modules/xbull";
import { Wallet, ShieldAlert, Cpu } from "lucide-react";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connect } = useWallet();
  const { isConnecting, error } = useWalletInfo();

  const wallets = [
    {
      id: FREIGHTER_ID,
      name: "Freighter",
      description: "Official Stellar browser extension wallet.",
    },
    {
      id: ALBEDO_ID,
      name: "Albedo",
      description: "Browser-based trustless link protocol.",
    },
    {
      id: XBULL_ID,
      name: "xBull Wallet",
      description: "Fast, secure extension for power users.",
    },
  ];

  const handleConnect = async (type: string) => {
    try {
      await connect(type);
      onClose(); // Close modal on success connection
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Connect Stellar Wallet">
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Select an installed Stellar browser wallet to sign transactions and authorize contract escrows.
        </p>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 flex items-start space-x-2 text-xs text-red-500">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 gap-3">
          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => handleConnect(w.id)}
              disabled={isConnecting}
              className="flex items-start text-left p-4 rounded-xl border border-border/60 hover:border-primary/40 bg-secondary/20 hover:bg-secondary/40 transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="rounded-full bg-primary/10 p-2.5 text-primary mr-3.5 mt-0.5">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground">{w.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{w.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="rounded-lg bg-secondary/30 p-3 border border-border/40 flex items-start space-x-2 text-xs text-muted-foreground">
          <Cpu className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            Ensure your extension is set to **Testnet** network passphrase prior to connecting.
          </span>
        </div>
      </div>
    </Dialog>
  );
}
