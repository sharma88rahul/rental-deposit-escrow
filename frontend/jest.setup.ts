import "@testing-library/jest-dom";

// Mock @creit-tech/stellar-wallets-kit
jest.mock("@creit-tech/stellar-wallets-kit", () => ({
  Networks: {
    TESTNET: "testnet",
    PUBLIC: "public",
  },
}));

// Mock @stellar/stellar-sdk globally
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
    Account: jest.fn().mockImplementation(() => ({})),
    scValToNative: jest.fn().mockImplementation(() => ({
      id: 1042,
      agreement_id: 1042,
      landlord: "GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K",
      tenant: "GBTR5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K",
      token: "USDC",
      deposit_amount: 1200,
      locked_amount: 1200,
      released_amount: 0,
      duration: 31536000,
      status: "LeaseActive",
      metadata_hash: "hash123",
      refund_requested_amount: 0,
    })),
    rpc: {
      Server: jest.fn().mockImplementation(() => ({
        getLatestLedger: jest.fn().mockResolvedValue({ sequence: 100 }),
        getEvents: jest.fn().mockResolvedValue({ events: [] }),
        simulateTransaction: jest.fn().mockResolvedValue({
          results: [{
            xdr: "AAAAAA==", // Dummy base64 xdr transaction meta
          }]
        }),
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
      TransactionMeta: {
        fromXDR: jest.fn().mockImplementation(() => ({
          v3: jest.fn().mockImplementation(() => ({
            sorobanMeta: jest.fn().mockImplementation(() => ({
              returnValue: jest.fn().mockReturnValue({}),
            })),
          })),
        })),
      },
    },
    nativeToScVal: jest.fn(),
  };
});
