import * as React from "react";
import Link from "next/link";
import { MapPin, User, Coins, Calendar, ChevronRight } from "lucide-react";
import { Agreement } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { siteConfig } from "@/config/site";

interface AgreementCardProps {
  agreement: Agreement;
}

export function AgreementCard({ agreement }: AgreementCardProps) {
  // Shorten public keys
  const shortenKey = (key: string) => {
    if (key.length <= 10) return key;
    return `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
  };

  // Convert duration seconds to months
  const durationMonths = (agreement.duration / (30 * 24 * 3600)).toFixed(0);

  return (
    <Card glass className="hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground">
            {agreement.title || `Agreement #${agreement.id}`}
          </CardTitle>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1 shrink-0" />
            <span className="truncate max-w-[200px]">{agreement.propertyAddress}</span>
          </div>
        </div>
        <Badge status={agreement.status} />
      </CardHeader>
      
      <CardContent className="pb-4 space-y-3.5 text-sm">
        {/* Landlord / Tenant info */}
        <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-3">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Landlord</div>
            <div className="flex items-center space-x-1.5 mt-0.5 text-xs font-mono text-foreground">
              <User className="h-3.5 w-3.5 opacity-60" />
              <span>{shortenKey(agreement.landlord)}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tenant</div>
            <div className="flex items-center space-x-1.5 mt-0.5 text-xs font-mono text-foreground">
              <User className="h-3.5 w-3.5 opacity-60" />
              <span>{shortenKey(agreement.tenant)}</span>
            </div>
          </div>
        </div>

        {/* Deposit details */}
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center space-x-1.5">
            <Coins className="h-4.5 w-4.5 text-primary shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Deposit</div>
              <div className="font-semibold text-foreground">{agreement.depositAmount} USDC</div>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-4.5 w-4.5 text-primary shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Duration</div>
              <div className="font-semibold text-foreground">{durationMonths} Months</div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 justify-end">
        <Link href={`${siteConfig.routes.agreements}/${agreement.id}`}>
          <Button size="sm" variant="outline" className="text-xs group">
            <span>View Details</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
