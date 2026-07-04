"use client";

import * as React from "react";
import { Settings, Wallet, Sun, Moon, Bell, Cpu, ShieldAlert, LogOut } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export default function SettingsPage() {
  const { connected, walletAddress, activeWallet, network, disconnectWallet, switchNetwork } = useStore();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your Stellar RPC nodes, theme preferences, and wallet connectivity.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Wallet & Connection details */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span>Wallet Management</span>
            </CardTitle>
            <CardDescription>
              Manage active sessions and signature providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {connected ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary/40 p-4 border border-border/60">
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-semibold text-foreground">{activeWallet}</span>
                    
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-mono text-xs text-foreground select-all">{walletAddress}</span>
                    
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-semibold text-foreground capitalize">{network}</span>
                  </div>
                </div>
                <Button variant="destructive" onClick={disconnectWallet} className="w-full flex items-center justify-center space-x-2">
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Disconnect Wallet</span>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground space-y-3">
                <p>No wallet is currently connected.</p>
                <p className="text-xs">Use the wallet connector in the navigation bar to establish a session.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sun className="h-5 w-5 text-primary" />
              <span>Theme Preferences</span>
            </CardTitle>
            <CardDescription>
              Toggle between light and dark display modes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <div className="font-semibold text-sm">Active Theme</div>
                <div className="text-xs text-muted-foreground mt-0.5">Currently displaying {theme} mode</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="text-xs"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  <span>Light</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="text-xs"
                >
                  <Moon className="h-4 w-4 mr-1" />
                  <span>Dark</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network & RPC config */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-primary" />
              <span>Stellar Network Configuration</span>
            </CardTitle>
            <CardDescription>
              Select the active RPC environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-semibold">RPC Endpoints</label>
              <select
                value={network}
                onChange={(e) => switchNetwork(e.target.value as "testnet" | "mainnet")}
                className="w-full px-3.5 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="testnet">Stellar Testnet ({siteConfig.contracts.testnetRpcUrl})</option>
                <option value="mainnet" disabled>Stellar Mainnet (Disabled - Security Lock)</option>
              </select>
            </div>

            <div className="rounded-lg bg-secondary/30 p-3.5 border border-border/40 grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
              <span>Passphrase:</span>
              <span className="font-semibold text-foreground truncate">{siteConfig.contracts.networkPassphrase}</span>
              
              <span>Agreement Contract:</span>
              <span className="font-mono text-foreground truncate select-all">{siteConfig.contracts.rentalAgreementId}</span>
              
              <span>Escrow Contract:</span>
              <span className="font-mono text-foreground truncate select-all">{siteConfig.contracts.escrowId}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notification settings */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Event Notifications</span>
            </CardTitle>
            <CardDescription>
              Control web notifications on contract state changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-semibold">Browser Event Toasts</div>
                <div className="text-xs text-muted-foreground mt-0.5">Show notifications when contract events occur</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded-sm accent-primary cursor-pointer" />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
