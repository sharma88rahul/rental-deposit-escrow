"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent opacity-60 pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-md mx-auto">
        <div className="mx-auto rounded-full bg-destructive/10 p-5 text-destructive w-fit animate-pulse">
          <AlertCircle className="h-12 w-12 stroke-[1.5]" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Page Not Found</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" className="flex items-center space-x-2 w-full justify-center">
              <ArrowLeft className="h-4.5 w-4.5" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
