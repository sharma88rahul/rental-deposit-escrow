import * as React from "react";
import Link from "next/link";
import { ShieldCheck, MapPin, Coins, User, ArrowUpRight } from "lucide-react";
import { EscrowDetails } from "@/store/useEscrowStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { siteConfig } from "@/config/site";

interface EscrowCardProps {
  escrow: EscrowDetails;
}

export function EscrowCard({ escrow }: EscrowCardProps) {
  // Shorten wallet keys
  const shortenKey = (key: string) => {
    if (key.length <= 10) return key;
    return `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
  };

  return (
    <Card glass className="hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold tracking-tight text-foreground flex items-center">
            <ShieldCheck className="h-4.5 w-4.5 text-primary mr-1.5 shrink-0" />
            <span>Escrow #{escrow.escrowId}</span>
          </CardTitle>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1 shrink-0" />
            <span className="truncate max-w-[200px]">{escrow.propertyAddress}</span>
          </div>
        </div>
        <Badge status={escrow.status} />
      </CardHeader>
      
      <CardContent className="pb-4 space-y-4 text-sm">
        {/* Balances summary */}
        <div className="grid grid-cols-3 gap-2 bg-secondary/15 rounded-lg p-3 border border-border/40 text-center">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Locked</div>
            <div className="font-bold text-sm text-foreground mt-0.5">{escrow.depositAmount}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Released</div>
            <div className="font-bold text-sm text-primary mt-0.5">{escrow.releasedAmount}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Balance</div>
            <div className="font-bold text-sm text-amber-500 mt-0.5">{escrow.remainingBalance}</div>
          </div>
        </div>

        {/* Current Holder and Asset */}
        <div className="space-y-2 text-xs border-b border-border/40 pb-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Holder:</span>
            <span className="font-semibold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
              {escrow.currentHolder}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Asset SAC Token:</span>
            <span className="font-mono text-foreground">{escrow.assetType}</span>
          </div>
        </div>

        {/* Landlord / Tenant info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block">Landlord:</span>
            <span className="font-mono text-foreground font-semibold flex items-center space-x-1 mt-0.5">
              <User className="h-3 w-3 opacity-60 mr-1" />
              {shortenKey(escrow.landlord)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Tenant:</span>
            <span className="font-mono text-foreground font-semibold flex items-center space-x-1 mt-0.5">
              <User className="h-3 w-3 opacity-60 mr-1" />
              {shortenKey(escrow.tenant)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 justify-end">
        <Link href={`${siteConfig.routes.agreements}/${escrow.agreementId}`}>
          <Button size="sm" variant="outline" className="text-xs group flex items-center">
            <span>View Agreement</span>
            <ArrowUpRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
