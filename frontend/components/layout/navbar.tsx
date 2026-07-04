"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, Sun, Moon, Wallet, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useStore } from "@/store/useStore";
import { useTheme } from "next-themes";
import { siteConfig } from "@/config/site";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const { connected, walletAddress, connectWallet, disconnectWallet } = useStore();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: "Dashboard", href: siteConfig.routes.dashboard },
    { label: "Agreements", href: siteConfig.routes.agreements },
    { label: "Escrow Center", href: siteConfig.routes.escrowCenter },
    { label: "Transactions", href: siteConfig.routes.transactionCenter },
    { label: "Activity", href: siteConfig.routes.activityFeed },
    { label: "Analytics", href: siteConfig.routes.analytics },
  ];

  const handleWalletClick = () => {
    if (connected) {
      disconnectWallet();
    } else {
      // Connect mock wallet for Phase 3
      connectWallet("GD7K5R5P...LAND", "Freighter");
    }
  };

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

            <Button
              variant={connected ? "outline" : "primary"}
              size="sm"
              onClick={handleWalletClick}
              className="flex items-center space-x-2"
            >
              {connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs">{walletAddress}</span>
                  <LogOut className="h-4 w-4 ml-1.5 opacity-60 hover:opacity-100" />
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </>
              )}
            </Button>
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
            <div className="px-3 pt-4 border-t border-border mt-3">
              <Button
                variant={connected ? "outline" : "primary"}
                className="w-full flex justify-center items-center space-x-2"
                onClick={() => {
                  handleWalletClick();
                  setIsOpen(false);
                }}
              >
                {connected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{walletAddress}</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
