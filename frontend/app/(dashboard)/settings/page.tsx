"use client";

import * as React from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useWalletStore } from "@/store/useWalletStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  User,
  Settings,
  Bell,
  Sun,
  Moon,
  Laptop,
  Wallet,
  Cpu,
  Network,
  Info,
  Check,
  Copy,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme();
  const {
    theme,
    setTheme,
    notifications,
    setNotifications,
    developerSettings,
    setDeveloperSettings,
    profile,
    setProfile,
  } = useSettingsStore();

  const {
    walletAddress,
    connected,
    activeWallet,
    disconnect,
  } = useWalletStore();

  const address = walletAddress;
  const walletName = activeWallet;

  const [copied, setCopied] = React.useState(false);
  const [profileName, setProfileName] = React.useState(profile.username);
  const [profileEmail, setProfileEmail] = React.useState(profile.email);
  const [rpcInput, setRpcInput] = React.useState(developerSettings.rpcEndpoint);

  // Sync theme changes with next-themes on mount or store change
  React.useEffect(() => {
    if (theme) {
      setNextTheme(theme);
    }
  }, [theme, setNextTheme]);

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      username: profileName,
      email: profileEmail,
    });
  };

  const handleSaveDevSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setDeveloperSettings({
      rpcEndpoint: rpcInput,
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your profile, wallet preferences, system theme, and developer configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          <button className="w-full text-left px-3 py-2 rounded-lg bg-secondary/50 text-foreground font-semibold flex items-center gap-2.5 text-sm">
            <User className="h-4.5 w-4.5 text-primary" />
            <span>Profile settings</span>
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/30 text-muted-foreground hover:text-foreground flex items-center gap-2.5 text-sm transition-colors">
            <Wallet className="h-4.5 w-4.5" />
            <span>Wallet Configuration</span>
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/30 text-muted-foreground hover:text-foreground flex items-center gap-2.5 text-sm transition-colors">
            <Bell className="h-4.5 w-4.5" />
            <span>Notifications</span>
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/30 text-muted-foreground hover:text-foreground flex items-center gap-2.5 text-sm transition-colors">
            <Cpu className="h-4.5 w-4.5" />
            <span>Developer settings</span>
          </button>
        </div>

        {/* Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">User Profile</CardTitle>
              <CardDescription>Personal details and display name preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-semibold">Display Username</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <Button type="submit" size="sm" className="mt-2">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Connected Wallet Info */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Wallet Connection Settings</CardTitle>
              <CardDescription>Details of connected Stellar extension wallets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {connected && address ? (
                <div className="space-y-3.5">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Wallet Connected
                      </span>
                      <span className="font-mono text-muted-foreground">{walletName}</span>
                    </div>
                    <div className="flex items-center justify-between bg-secondary/50 p-2.5 rounded-md font-mono text-xs text-foreground">
                      <span className="truncate max-w-[280px]">{address}</span>
                      <button
                        onClick={handleCopyAddress}
                        className="hover:text-primary transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="destructive" size="sm" onClick={disconnect}>
                      Disconnect Session
                    </Button>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <span>Explorer</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                  <p className="text-amber-500 font-semibold text-xs">No active wallet connected</p>
                  <p className="text-muted-foreground text-[11px] mt-1">
                    Connect Freighter or xBull wallet on the top panel.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Theme Settings Persistence */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Appearance Theme</CardTitle>
              <CardDescription>Select Light, Dark, or System mode customizations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs transition-all ${
                    theme === "light"
                      ? "border-primary bg-primary/5 text-primary font-bold"
                      : "border-border/60 hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="h-5 w-5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs transition-all ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 text-primary font-bold"
                      : "border-border/60 hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="h-5 w-5" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs transition-all ${
                    theme === "system"
                      ? "border-primary bg-primary/5 text-primary font-bold"
                      : "border-border/60 hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Laptop className="h-5 w-5" />
                  <span>System</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Preferences */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Decide which operations broadcast platform logs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.agreementUpdates}
                    onChange={(e) => setNotifications({ agreementUpdates: e.target.checked })}
                    className="h-4 w-4 rounded-md border-border/80 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">Lease Signatures</span>
                    <span className="text-xs text-muted-foreground block">Alert when tenant accepts or landlord Cancels agreements.</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer border-t border-border/30 pt-3">
                  <input
                    type="checkbox"
                    checked={notifications.escrowUpdates}
                    onChange={(e) => setNotifications({ escrowUpdates: e.target.checked })}
                    className="h-4 w-4 rounded-md border-border/80 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">Escrow Release Proposals</span>
                    <span className="text-xs text-muted-foreground block">Notify when deduction proposals or release splits occur.</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer border-t border-border/30 pt-3">
                  <input
                    type="checkbox"
                    checked={notifications.disputes}
                    onChange={(e) => setNotifications({ disputes: e.target.checked })}
                    className="h-4 w-4 rounded-md border-border/80 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">Legal Disputes</span>
                    <span className="text-xs text-muted-foreground block">Notify when arbitrator interventions or disputes occur.</span>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Developer Configuration */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Developer Settings</CardTitle>
              <CardDescription>Manage Soroban connection endpoints and contracts references.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDevSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-semibold">Soroban RPC URL</label>
                  <input
                    type="text"
                    value={rpcInput}
                    onChange={(e) => setRpcInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-secondary/40 border border-border/60 rounded-lg text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                  />
                </div>
                <div className="space-y-2.5 text-xs font-mono text-muted-foreground pt-1.5">
                  <div>
                    <span className="text-foreground font-semibold block">Rental Agreement ID:</span>
                    <span className="truncate block max-w-full">{developerSettings.rentalAgreementId}</span>
                  </div>
                  <div>
                    <span className="text-foreground font-semibold block">Escrow Contract ID:</span>
                    <span className="truncate block max-w-full">{developerSettings.escrowId}</span>
                  </div>
                </div>
                <Button type="submit" size="sm" className="mt-2 flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  <span>Update configs</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
