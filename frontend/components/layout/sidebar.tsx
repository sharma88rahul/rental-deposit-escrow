"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Lock,
  History,
  Activity,
  BarChart3,
  Settings,
} from "lucide-react";
import { siteConfig } from "@/config/site";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: siteConfig.routes.dashboard, icon: LayoutDashboard },
    { label: "Agreements", href: siteConfig.routes.agreements, icon: FileText },
    { label: "Escrow Center", href: siteConfig.routes.escrowCenter, icon: Lock },
    { label: "Transactions", href: siteConfig.routes.transactionCenter, icon: History },
    { label: "Activity Feed", href: siteConfig.routes.activityFeed, icon: Activity },
    { label: "Analytics", href: siteConfig.routes.analytics, icon: BarChart3 },
    { label: "Settings", href: siteConfig.routes.settings, icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-xs min-h-[calc(100vh-4rem)] p-4 hidden md:block">
      <div className="flex flex-col space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href + "/"));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary/5 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <Icon className="h-4.5 w-4.5 stroke-2" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
