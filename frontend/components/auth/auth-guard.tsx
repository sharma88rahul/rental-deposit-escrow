"use client";

import * as React from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { WalletConnectModal } from "../wallet/wallet-connect-modal";
import { Button } from "../ui/button";
import { Lock } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { connected } = useWalletStore();
  const [isConnectOpen, setIsConnectOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!mounted) {
    return null; // Hydration protection
  }

  if (!connected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4 text-center">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent opacity-60 pointer-events-none" />

        <div className="relative z-10 max-w-md w-full rounded-2xl border border-border bg-card/60 backdrop-blur-md p-8 shadow-xl shadow-background/50 space-y-6">
          <div className="mx-auto rounded-full bg-primary/10 p-5 text-primary w-fit border border-primary/20">
            <Lock className="h-10 w-10 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Authentication Required</h2>
            <p className="text-sm text-muted-foreground">
              To view your agreements, vaults, and transactions, please connect your Stellar wallet.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full flex justify-center items-center space-x-2"
              onClick={() => setIsConnectOpen(true)}
            >
              <Wallet className="h-4.5 w-4.5" />
              <span>Connect Wallet</span>
            </Button>
          </div>
        </div>

        {/* Modal render */}
        <WalletConnectModal isOpen={isConnectOpen} onClose={() => setIsConnectOpen(false)} />
      </div>
    );
  }

  return <>{children}</>;
}

// Icon helper wrapper
function Wallet(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}
