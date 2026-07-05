"use client";

import * as React from "react";
import { useActivity } from "@/hooks/useActivity";
import { ActivityCard } from "./activity-card";
import { EmptyState } from "../ui/empty-state";
import { CardSkeleton } from "../ui/loader";

export function ActivityFeed() {
  const { activitiesQuery } = useActivity();
  const { data: activities = [], isLoading } = activitiesQuery;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        title="No On-Chain Activities"
        description="Connect your wallet or perform escrow operations to see transaction logs."
      />
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((event) => (
        <ActivityCard key={event.id} event={event} />
      ))}
    </div>
  );
}
