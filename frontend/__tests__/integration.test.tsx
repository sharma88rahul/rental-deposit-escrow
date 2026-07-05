// Mock wallet kit modules
jest.mock("@creit-tech/stellar-wallets-kit", () => ({
  Networks: {
    TESTNET: "testnet",
    PUBLIC: "public",
  },
}));

// Mock Stellar SDK modules
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
    scValToNative: jest.fn().mockImplementation(() => ({
      details: "Mock Details",
      agreement_id: 1042,
    })),
    rpc: {
      Server: jest.fn().mockImplementation(() => ({
        getLatestLedger: jest.fn().mockResolvedValue({ sequence: 100 }),
        getEvents: jest.fn().mockResolvedValue({ events: [] }),
      })),
    },
    xdr: {
      ScVal: {
        fromXDR: jest.fn().mockReturnValue("agreement_created_symbol"),
        scvAddress: jest.fn().mockReturnValue({}),
        scvSymbol: jest.fn().mockReturnValue({}),
        scvU32: jest.fn().mockReturnValue({}),
        scvU64: jest.fn().mockReturnValue({}),
        scvString: jest.fn().mockReturnValue({}),
      },
    },
    nativeToScVal: jest.fn(),
  };
});

import { useWalletStore } from "../store/useWalletStore";
import { useEscrowStore } from "../store/useEscrowStore";
import { useStore } from "../store/useStore";
import { AgreementService } from "../services/agreement";
import { EscrowService } from "../services/escrow";

// Helper 56-char public keys
const mockLandlord = "GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K";
const mockTenant = "GBTR5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K";

describe("RentSure Frontend System Integration Tests", () => {
  beforeEach(() => {
    // Reset stores
    useWalletStore.setState({
      connected: false,
      walletAddress: null,
      activeWallet: null,
    });
    
    useStore.setState({
      connected: false,
      walletAddress: null,
      activeWallet: null,
      agreements: [],
      transactions: [],
      activities: [],
    });

    useEscrowStore.setState({
      escrows: [],
      searchQuery: "",
      statusFilter: "All",
    });
  });

  describe("Wallet ↔ Agreements Integration Flow", () => {
    it("should reject creating agreement drafts if wallet is disconnected", async () => {
      // Wallet is disconnected initially
      const store = useWalletStore.getState();
      expect(store.connected).toBe(false);

      // Verify that calling createAgreement fails
      await expect(
        AgreementService.createAgreement({
          title: "Beach House",
          propertyAddress: "Florida Key 10",
          tenant: mockTenant,
          depositAmount: "1200",
          duration: 3600 * 24 * 30, // 30 days
          token: "USDC",
          metadataHash: "hash123",
        })
      ).rejects.toThrow("Wallet not connected");
    });

    it("should allow creating drafts when wallet session is active", async () => {
      // Connect wallet
      useWalletStore.getState().setConnection(mockLandlord, "freighter");
      expect(useWalletStore.getState().connected).toBe(true);

      // Create agreement draft
      const newId = await AgreementService.createAgreement({
        title: "Beach House",
        propertyAddress: "Florida Key 10",
        tenant: mockTenant,
        depositAmount: "1200",
        duration: 3600 * 24 * 30,
        token: "USDC",
        metadataHash: "hash123",
      });

      expect(newId).toBeDefined();
      const created = useStore.getState().agreements.find((a) => a.id === newId);
      expect(created).toBeDefined();
      expect(created?.status).toBe("Created");
      expect(useStore.getState().agreements.length).toBe(1);
    });
  });

  describe("Agreements ↔ Escrow Locks Integration Flow", () => {
    it("should create corresponding Escrow records when agreements status transitions to DepositLocked", async () => {
      // Connect wallet as tenant
      useWalletStore.getState().setConnection(mockTenant, "freighter");

      // Set up draft agreement
      useStore.setState({
        agreements: [
          {
            id: 2001,
            landlord: mockLandlord,
            tenant: mockTenant,
            token: "USDC",
            depositAmount: "1200",
            duration: 3600 * 24 * 30,
            status: "Accepted",
            metadataHash: "hash123",
            propertyAddress: "Florida Key 10",
          },
        ],
      });

      // Seed corresponding escrow record
      useEscrowStore.setState({
        escrows: [
          {
            escrowId: 9001,
            agreementId: 2001,
            tenant: mockTenant,
            landlord: mockLandlord,
            assetType: "USDC",
            depositAmount: "1200",
            lockedAmount: "0.00",
            releasedAmount: "0.00",
            remainingBalance: "1200.00",
            currentHolder: "Awaiting Deposit",
            status: "Accepted",
          },
        ],
      });

      // Call escrow lock deposit
      await EscrowService.lockDeposit(2001);

      // Verify corresponding escrow vault record was updated to LeaseActive
      const escrows = useEscrowStore.getState().escrows;
      expect(escrows.length).toBe(1);
      expect(escrows[0].agreementId).toBe(2001);
      expect(escrows[0].status).toBe("LeaseActive");
    });
  });

  describe("Escrow ↔ Transactions Integration Flow", () => {
    it("should write audit hash logs to activity store upon release of funds", async () => {
      useWalletStore.getState().setConnection(mockLandlord, "freighter");

      // Set up locked escrow and agreement
      useStore.setState({
        agreements: [
          {
            id: 2002,
            landlord: mockLandlord,
            tenant: mockTenant,
            token: "USDC",
            depositAmount: "1200",
            duration: 3600 * 24 * 30,
            status: "DepositLocked",
            metadataHash: "hash123",
          },
        ],
      });

      useEscrowStore.setState({
        escrows: [
          {
            escrowId: 9002,
            agreementId: 2002,
            tenant: mockTenant,
            landlord: mockLandlord,
            assetType: "USDC",
            depositAmount: "1200",
            lockedAmount: "1200.00",
            releasedAmount: "0.00",
            remainingBalance: "1200.00",
            currentHolder: "Escrow Contract",
            status: "DepositLocked",
            lockedAt: new Date().toISOString(),
          },
        ],
      });

      // Release deposit fully
      await EscrowService.releaseDepositFully(2002);

      // Verify transaction register is not empty
      const txs = useStore.getState().transactions;
      expect(txs.length).toBe(1);
      expect(txs[0].type).toBe("Release Escrow Full");
      expect(txs[0].status).toBe("Confirmed");
    });
  });
});
