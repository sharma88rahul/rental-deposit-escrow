// Mock wallet kit modules
jest.mock("@creit-tech/stellar-wallets-kit", () => ({
  Networks: {
    TESTNET: "testnet",
    PUBLIC: "public",
  },
}));

// Mock Stellar SDK modules to isolate contract tests from on-chain configurations
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
    xdr: {
      ScVal: {
        scvAddress: jest.fn(),
        scvSymbol: jest.fn(),
        scvU32: jest.fn(),
        scvString: jest.fn(),
      },
    },
    nativeToScVal: jest.fn(),
    scValToNative: jest.fn(),
  };
});

import { EscrowService } from "../services/escrow";
import { useEscrowStore } from "../store/useEscrowStore";
import { useStore } from "../store/useStore";

describe("Escrow Service & State Machine Tests", () => {
  beforeEach(() => {
    // Reset Escrow Cache list values
    useEscrowStore.setState({
      escrows: [
        {
          escrowId: 8021,
          agreementId: 1042,
          title: "Vanguard Heights - Apt 402",
          propertyAddress: "742 Evergreen Terrace, Springfield",
          depositAmount: "1200",
          releasedAmount: "0",
          remainingBalance: "1200",
          assetType: "USDC",
          status: "Accepted",
          landlord: "GD7K5R5P...LAND",
          tenant: "GBTR5R5P...TENA",
          currentHolder: "Tenant",
          createdAt: "2026-06-15T12:00:00Z",
        },
      ],
    });

    // Reset main agreements list
    useStore.setState({
      agreements: [
        {
          id: 1042,
          title: "Vanguard Heights - Apt 402",
          propertyAddress: "742 Evergreen Terrace, Springfield",
          landlord: "GD7K5R5P...LAND",
          tenant: "GBTR5R5P...TENA",
          token: "USDC",
          depositAmount: "1200",
          duration: 31536000,
          status: "Accepted",
          metadataHash: "QmXoypizjW3Wkn2EncgV51B3BJKNpd84mCndH39E7uJ8T5",
          refundRequestedAmount: "0",
          createdAt: "2026-06-15T12:00:00Z",
        },
      ],
      transactions: [],
      activities: [],
    });
  });

  it("should transition state from Accepted to LeaseActive upon lockDeposit", async () => {
    await EscrowService.lockDeposit(1042);

    const updatedEscrow = useEscrowStore.getState().escrows.find((e) => e.agreementId === 1042);
    expect(updatedEscrow?.status).toBe("LeaseActive");
    expect(updatedEscrow?.currentHolder).toBe("Escrow Contract");

    const updatedAgreement = useStore.getState().agreements.find((a) => a.id === 1042);
    expect(updatedAgreement?.status).toBe("LeaseActive");

    // Check transaction and activities
    expect(useStore.getState().transactions.length).toBe(1);
    expect(useStore.getState().transactions[0].type).toBe("Lock Escrow Deposit");
  });

  it("should release deposit fully and transition to FundsReleased", async () => {
    // Lock deposit first to enter LeaseActive
    await EscrowService.lockDeposit(1042);
    expect(useEscrowStore.getState().escrows[0].status).toBe("LeaseActive");

    await EscrowService.releaseDepositFully(1042);

    const updatedEscrow = useEscrowStore.getState().escrows[0];
    expect(updatedEscrow.status).toBe("FundsReleased");
    expect(updatedEscrow.remainingBalance).toBe("0");
    expect(updatedEscrow.releasedAmount).toBe("1200");
    expect(updatedEscrow.currentHolder).toBe("Tenant");
  });

  it("should fail lockDeposit if status is already locked or active", async () => {
    await EscrowService.lockDeposit(1042);
    
    // Attempting a duplicate lock should reject
    await expect(EscrowService.lockDeposit(1042)).rejects.toThrow(
      "Deposit has already been locked or escrow is in active status."
    );
  });

  it("should fail deduction request if amount exceeds locked deposit size", async () => {
    await expect(EscrowService.requestDeduction(1042, "1500")).rejects.toThrow(
      "Deduction amount exceeds locked deposit size."
    );
  });

  it("should successfully raise a dispute and set status to DisputeRaised", async () => {
    await EscrowService.lockDeposit(1042);
    await EscrowService.raiseDispute(1042);

    expect(useEscrowStore.getState().escrows[0].status).toBe("DisputeRaised");
    expect(useStore.getState().agreements[0].status).toBe("DisputeRaised");
  });

  it("should successfully resolve a dispute and split balances", async () => {
    await EscrowService.lockDeposit(1042);
    await EscrowService.raiseDispute(1042);
    
    // Resolve dispute split: 800 USDC to Tenant (remaining 400 goes to Landlord)
    await EscrowService.resolveDispute(1042, "800");

    const updatedEscrow = useEscrowStore.getState().escrows[0];
    expect(updatedEscrow.status).toBe("Resolved");
    expect(updatedEscrow.releasedAmount).toBe("800");
    expect(updatedEscrow.remainingBalance).toBe("0");
    expect(updatedEscrow.currentHolder).toBe("Arbitration Released");
  });
});
