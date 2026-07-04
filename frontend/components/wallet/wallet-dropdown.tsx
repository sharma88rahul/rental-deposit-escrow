"use client";

import * as React from "react";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletInfo } from "@/hooks/useWalletInfo";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Copy,
  CheckCircle,
  ChevronDown,
  Coins,
} from "lucide-react";

export function WalletDropdown() {
  const { disconnectWallet } = useWallet();
  const {
    connected,
    shortenedAddress,
    balance,
    activeWallet,
    copied,
    copyAddress,
  } = useWalletInfo();

  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!connected) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono">{shortenedAddress}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-60 z-50 rounded-xl border border-border bg-card p-4 shadow-xl shadow-background/50 animate-fade-in">
          {/* Header Info */}
          <div className="border-b border-border/40 pb-3 mb-3">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              Connected Wallet
            </div>
            <div className="font-semibold text-sm mt-0.5 capitalize">
              {activeWallet} Provider
            </div>
          </div>

          {/* Balance Section */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Coins className="h-4 w-4 text-primary" />
              <span>Balance:</span>
            </div>
            <span className="font-semibold text-foreground font-mono">
              {balance} XLM
            </span>
          </div>

          {/* Action List */}
          <div className="space-y-2.5">
            {/* Copy Address */}
            <button
              onClick={copyAddress}
              className="flex items-center justify-between w-full text-left px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>{copied ? "Copied!" : "Copy Address"}</span>
              </div>
              <span className="text-[10px] font-mono opacity-65 truncate max-w-[80px]">
                {shortenedAddress}
              </span>
            </button>

            {/* Disconnect */}
            <button
              onClick={() => {
                disconnectWallet();
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 w-full text-left px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
