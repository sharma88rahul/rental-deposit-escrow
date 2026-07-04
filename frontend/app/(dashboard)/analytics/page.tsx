"use client";

import * as React from "react";
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, PieChart, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  // Mock data for analytics
  const metrics = [
    { label: "Total Vault Volume", val: "$6,000 USDC", desc: "Security deposits secured on-chain", icon: TrendingUp },
    { label: "Average Deposit", val: "$2,000 USDC", desc: "Mean deposit per agreement", icon: BarChart3 },
    { label: "Refund Success Rate", val: "95.4%", desc: "Direct landlord-tenant settlements", icon: ShieldCheck },
    { label: "Dispute Rate", val: "4.6%", desc: "Leases requiring arbitration", icon: AlertTriangle },
  ];

  const monthlyVolume = [
    { month: "Jan", val: 40 },
    { month: "Feb", val: 55 },
    { month: "Mar", val: 75 },
    { month: "Apr", val: 60 },
    { month: "May", val: 90 },
    { month: "Jun", val: 120 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Historical overview of RentSure escrow contract volume and dispute rates.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Card key={idx} glass>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                <Icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{m.val}</div>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly Deposit Volume Bar Chart */}
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Vault Volume</CardTitle>
            <CardDescription>Value locked in deposits over the last 6 months (scaled in thousands USDC).</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-end justify-between pt-6 border-b border-border/40">
            {monthlyVolume.map((item) => (
              <div key={item.month} className="flex flex-col items-center flex-1 group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary text-primary-foreground text-xs font-semibold rounded-md px-2 py-1 mb-2 transform -translate-y-2">
                  ${(item.val * 100).toLocaleString()} USDC
                </div>
                {/* Bar */}
                <div
                  style={{ height: `${item.val * 1.3}px` }}
                  className="w-8 sm:w-12 bg-primary rounded-t-md group-hover:bg-primary/85 transition-all duration-300 relative cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-medium mt-3">{item.month}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Dispute settlement split representation */}
        <Card glass>
          <CardHeader>
            <CardTitle>Settlement Distributions</CardTitle>
            <CardDescription>Escrow completion results across all completed leases.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Visual breakdown bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-foreground">Full Refunds to Tenant</span>
                  <span className="text-muted-foreground">72%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "72%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-foreground">Partial Landlord Deductions</span>
                  <span className="text-muted-foreground">23.4%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-indigo-400 h-2 rounded-full" style={{ width: "23.4%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-foreground">Full Deductions to Landlord</span>
                  <span className="text-muted-foreground">4.6%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-amber-400 h-2 rounded-full" style={{ width: "4.6%" }} />
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="rounded-lg bg-secondary/30 p-3.5 border border-border/40 text-xs text-muted-foreground flex items-start space-x-2">
              <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <span>
                95.4% of escrows are settled cooperatively between landlord and tenant without escalating to arbitrator dispute resolution.
              </span>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
