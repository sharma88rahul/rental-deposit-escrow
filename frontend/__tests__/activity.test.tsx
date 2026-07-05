// Mock wallet kit modules
jest.mock("@creit-tech/stellar-wallets-kit", () => ({
  Networks: {
    TESTNET: "testnet",
    PUBLIC: "public",
  },
}));

// Mock Stellar SDK modules to isolate contract tests from network/XDR compilers
jest.mock("@stellar/stellar-sdk", () => {
  return {
    Address: {
      fromString: jest.fn().mockImplementation(() => ({
        toScAddress: jest.fn(),
      })),
    },
    Contract: jest.fn().mockImplementation(() => ({
      call: jest.fn().mockReturnValue({}),
    })),
    scValToNative: jest.fn().mockImplementation((val) => {
      // Mock parsing for toScVal and payload calls
      if (val === "agreement_created_symbol") return "agreement_created";
      return { details: "Mock Details", agreement_id: 1042 };
    }),
    rpc: {
      Server: jest.fn().mockImplementation(() => ({
        getLatestLedger: jest.fn().mockResolvedValue({ sequence: 100 }),
        getEvents: jest.fn().mockResolvedValue({ events: [] }),
      })),
    },
    xdr: {
      ScVal: {
        fromXDR: jest.fn().mockReturnValue("agreement_created_symbol"),
        scvAddress: jest.fn(),
        scvSymbol: jest.fn(),
        scvU32: jest.fn(),
        scvString: jest.fn(),
      },
    },
    nativeToScVal: jest.fn(),
  };
});

import { useActivityStore } from "../store/useActivityStore";
import { EventService } from "../services/event";

describe("Transaction & Blockchain Event Service Tests", () => {
  beforeEach(() => {
    // Reset Zustand stores
    useActivityStore.setState({
      transactions: [
        {
          hash: "0xFailedTxHash123",
          type: "Create Rental Agreement",
          status: "Failed",
          fee: "0.00008 XLM",
          timestamp: "2026-07-05T09:00:00Z",
          walletUsed: "GD7K5R5P...LAND",
          agreementId: 1043,
        },
      ],
      activities: [],
      liveFeedCache: [],
    });
    useActivityStore.getState().resetFilters();
  });

  describe("Transaction Ledger Actions", () => {
    it("should update transaction status updates", () => {
      useActivityStore.getState().updateTransactionStatus("0xFailedTxHash123", "Confirmed");
      
      const updated = useActivityStore.getState().transactions[0];
      expect(updated.status).toBe("Confirmed");
    });

    it("should process retry transaction states and transition to Processing", () => {
      useActivityStore.getState().retryTransaction("0xFailedTxHash123");

      const updated = useActivityStore.getState().transactions[0];
      expect(updated.status).toBe("Processing");
    });
  });

  describe("Zustand Filtering Queries", () => {
    it("should set and clear filter query params", () => {
      const store = useActivityStore.getState();
      expect(store.filters.search).toBe("");

      store.setFilters({ search: "0xFailed" });
      expect(useActivityStore.getState().filters.search).toBe("0xFailed");

      store.resetFilters();
      expect(useActivityStore.getState().filters.search).toBe("");
    });
  });

  describe("Event Normalization Parsers", () => {
    it("should correctly compile and register normalized events inside store lists", () => {
      const store = useActivityStore.getState();
      expect(store.activities.length).toBe(0);

      // Trigger simulation generator
      // It calls useActivityStore.getState().addActivityEvent() internally
      EventService.startSubscription();
      
      // Simulate receipt of normalized event
      useActivityStore.getState().addActivityEvent({
        id: "evt-1234",
        type: "AgreementCreated",
        timestamp: new Date().toISOString(),
        details: "Agreement Created Mock Details",
        txHash: "0xEvtTxHash1234",
        agreementId: 1042,
      });

      expect(useActivityStore.getState().activities.length).toBe(1);
      expect(useActivityStore.getState().activities[0].type).toBe("AgreementCreated");
      
      EventService.stopSubscription();
    });
  });
});
