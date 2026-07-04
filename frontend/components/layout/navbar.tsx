"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, Sun, Moon, Wallet } from "lucide-react";
import { Button } from "../ui/button";
import { useWalletStore } from "@/store/useWalletStore";
import { useTheme } from "next-themes";
import { siteConfig } from "@/config/site";
import { NetworkBadge } from "../wallet/network-badge";
import { WalletDropdown } from "../wallet/wallet-dropdown";
import { WalletConnectModal } from "../wallet/wallet-connect-modal";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isConnectOpen, setIsConnectOpen] = React.useState(false);
  const { connected } = useWalletStore();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: "Dashboard", href: siteConfig.routes.dashboard },
    { label: "Agreements", href: siteConfig.routes.agreements },
    { label: "Escrow Center", href: siteConfig.routes.escrowCenter },
    { label: "Transactions", href: siteConfig.routes.transactionCenter },
    { label: "Activity", href: siteConfig.routes.activityFeed },
    { label: "Analytics", href: siteConfig.routes.analytics },
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-xl">
              <Shield className="h-6 w-6 stroke-2" />
              <span className="text-foreground tracking-tight">RentSure</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Network status */}
            <NetworkBadge />

            {connected ? (
              <WalletDropdown />
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsConnectOpen(true)}
                className="flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-lg animate-fade-in">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="px-3 pt-4 border-t border-border mt-3 space-y-3">
              <div className="flex justify-center">
                <NetworkBadge />
              </div>
              {connected ? (
                <div className="flex justify-center">
                  <WalletDropdown />
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full flex justify-center items-center space-x-2"
                  onClick={() => {
                    setIsConnectOpen(true);
                    setIsOpen(false);
                  }}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connect Dialog */}
      <WalletConnectModal isOpen={isConnectOpen} onClose={() => setIsConnectOpen(false)} />
    </nav>
  );
}
