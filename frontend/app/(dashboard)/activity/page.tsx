"use client";

import * as React from "react";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";

export default function ActivityPage() {
  const { activitiesQuery } = useActivity();
  const { isRefetching, refetch } = activitiesQuery;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">On-Chain Activity Feed</h1>
          <p className="text-muted-foreground mt-1">
            Real-time feed streaming events from the Rental Agreement and Escrow contracts.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center space-x-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Info notice */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-start space-x-3 text-sm">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-primary">On-Chain WebSocket Stream Activated</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rental deposits, agreement signatures, and refund releases are captured directly from Soroban RPC sequence streams.
          </p>
        </div>
      </div>

      {/* Main activities scroll */}
      <Card glass>
        <CardHeader>
          <CardTitle>Recent Event Stream</CardTitle>
          <CardDescription>Chronological ledger of consensus sequences verified on the Testnet.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed />
        </CardContent>
      </Card>
    </div>
  );
}
