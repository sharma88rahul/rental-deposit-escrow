"use client";

import * as React from "react";
import { Activity, Bell, ExternalLink, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ActivityFeedPage() {
  const { activities, addActivity } = useStore();

  const handleSimulateEvent = () => {
    const mockEvents = [
      {
        type: "AgreementAccepted" as const,
        details: "Tenant GC7P...TENB accepted terms for Sunset Boulevard Condo (Agreement #1041)"
      },
      {
        type: "RefundApproved" as const,
        details: "Tenant GBTR...TENA approved landlord proposed release of 800 USDC (Agreement #1042)"
      },
      {
        type: "DisputeResolved" as const,
        details: "Arbitrator settled Dispute #1041: 1200 USDC to Tenant, 800 USDC to Landlord"
      }
    ];

    const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    addActivity({
      ...randomEvent,
      txHash: "tx-" + Math.random().toString(36).substring(2, 8)
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">On-Chain Activity Feed</h1>
          <p className="text-muted-foreground mt-1">
            Real-time event logs emitted by our Soroban smart contracts.
          </p>
        </div>
        <Button onClick={handleSimulateEvent} className="flex items-center space-x-2 w-fit">
          <Sparkles className="h-4 w-4" />
          <span>Simulate Contract Event</span>
        </Button>
      </div>

      {/* Timeline Card */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Event Stream</span>
          </CardTitle>
          <CardDescription>
            Listening to Soroban topics: agreement_created, deposit_locked, and funds_released.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start space-x-4 relative">
                <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-secondary border border-border text-primary shadow-xs">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 bg-secondary/15 p-4 rounded-xl border border-border/40 hover:border-primary/20 transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-semibold text-foreground text-sm">{act.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(act.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{act.details}</p>
                  {act.txHash && (
                    <div className="mt-3 flex items-center space-x-1.5 text-xs">
                      <span className="text-muted-foreground">Tx Hash:</span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${act.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-primary hover:underline flex items-center space-x-0.5"
                      >
                        <span>{act.txHash}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
