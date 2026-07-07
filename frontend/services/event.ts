import { rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { useActivityStore } from "@/store/useActivityStore";
import { ActivityEvent } from "@/types";
import { siteConfig } from "@/config/site";

export class EventService {
  private static isSubscribed = false;
  private static pollTimer: NodeJS.Timeout | null = null;
  private static lastLedger = 0;

  public static startSubscription(): void {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    const rpcUrl = siteConfig.contracts.testnetRpcUrl;
    const server = new rpc.Server(rpcUrl);

    // Initial query ledger start point
    server.getLatestLedger()
      .then((ledger) => {
        this.lastLedger = ledger.sequence;
        
        // Start polling interval every 6 seconds
        this.pollTimer = setInterval(async () => {
          try {
            await this.pollEvents(server);
          } catch (err) {
            console.warn("RPC event poll failed:", err);
          }
        }, 6000);
      })
      .catch((err) => {
        console.warn("Could not load initial ledger sequence, Soroban events feed is currently unreachable:", err);
      });
  }

  /**
   * Stop active event streams
   */
  public static stopSubscription(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isSubscribed = false;
  }

  /**
   * Active Soroban RPC events query
   */
  private static async pollEvents(server: rpc.Server): Promise<void> {
    const filters = [
      {
        type: "contract" as const,
        ids: [siteConfig.contracts.rentalAgreementId, siteConfig.contracts.escrowId],
      },
    ];

    const response = await server.getEvents({
      startLedger: this.lastLedger,
      filters,
    });

    if (response.events && response.events.length > 0) {
      response.events.forEach((evt) => {
        const normalized = this.normalizeSorobanEvent(evt);
        if (normalized) {
          useActivityStore.getState().addActivityEvent(normalized);
        }
      });
      // Bump last ledger index sequence
      const maxLedger = Math.max(...response.events.map((e) => e.ledger));
      this.lastLedger = maxLedger + 1;
    }
  }

  /**
   * Helper to normalize raw Soroban event XDR into TypeScript ActivityEvent
   */
  private static normalizeSorobanEvent(evt: unknown): ActivityEvent | null {
    try {
      const e = evt as {
        id: string;
        topic: string[];
        value: string;
        ledgerClosedAt?: string;
        txHash?: string;
      };
      // Soroban topic parsing
      const topics = e.topic.map((t: string) => xdr.ScVal.fromXDR(t, "base64"));
      const firstTopicSymbol = scValToNative(topics[0]); // e.g. "agreement_created"

      const rawVal = xdr.ScVal.fromXDR(e.value, "base64");
      const payload = scValToNative(rawVal) as {
        details?: string;
        agreement_id?: number;
      };

      // Extract types
      const eventTypeMap: Record<string, ActivityEvent["type"]> = {
        agreement_created: "AgreementCreated",
        agreement_accepted: "AgreementAccepted",
        deposit_locked: "DepositLocked",
        lease_activated: "LeaseActivated",
        refund_proposed: "RefundRequested",
        refund_approved: "RefundApproved",
        resolve_dispute: "DisputeResolved",
        dispute_raised: "DisputeRaised",
        funds_released: "FundsReleased",
      };

      const eventType = eventTypeMap[firstTopicSymbol] || "AgreementCreated";

      return {
        id: e.id,
        type: eventType,
        timestamp: e.ledgerClosedAt || new Date().toISOString(),
        details: payload.details || `On-chain event trigger ${firstTopicSymbol}`,
        txHash: e.txHash,
        agreementId: payload.agreement_id || 1042,
      };
    } catch (err) {
      console.error("Failed to parse event XDR:", err);
      return null;
    }
  }

}
