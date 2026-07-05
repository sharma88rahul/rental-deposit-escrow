import * as React from "react";
import { ActivityEvent } from "@/types";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, ArrowUpRight, Copy, Check, FileText } from "lucide-react";
import { siteConfig } from "@/config/site";

interface ActivityCardProps {
  event: ActivityEvent;
}

export function ActivityCard({ event }: ActivityCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyHash = async () => {
    if (!event.txHash) return;
    try {
      await navigator.clipboard.writeText(event.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const getEventIcon = () => {
    return <FileText className="h-4.5 w-4.5 text-primary shrink-0" />;
  };

  return (
    <Card glass className="hover:border-primary/20 transition-all duration-200">
      <CardContent className="p-4 flex items-start space-x-3.5">
        {/* Icon wrapper */}
        <div className="rounded-full bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
          {getEventIcon()}
        </div>

        {/* Text Details */}
        <div className="flex-1 space-y-1.5 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h4 className="font-semibold text-foreground flex items-center flex-wrap gap-1.5">
              <span>{event.details}</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-primary/5 text-primary">
                {event.type}
              </Badge>
            </h4>
            <span className="text-xs text-muted-foreground flex items-center shrink-0">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Metadata ledger */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
            {event.agreementId && (
              <span>Agreement: #{event.agreementId}</span>
            )}
            {event.txHash && (
              <div className="flex items-center space-x-1.5 border-l border-border/40 pl-3">
                <span className="truncate max-w-[120px]">Tx: {event.txHash}</span>
                <button
                  onClick={handleCopyHash}
                  className="hover:text-foreground transition-colors cursor-pointer"
                  title="Copy Transaction Hash"
                >
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
            {event.txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center border-l border-border/40 pl-3"
              >
                <span>Explorer</span>
                <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
