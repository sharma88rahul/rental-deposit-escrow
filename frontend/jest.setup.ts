import "@testing-library/jest-dom";

// Mock @creit-tech/stellar-wallets-kit and its submodules
jest.mock("@creit-tech/stellar-wallets-kit", () => ({
  Networks: {
    TESTNET: "testnet",
    PUBLIC: "public",
  },
  StellarWalletsKit: {
    init: jest.fn(),
    setWallet: jest.fn(),
    setNetwork: jest.fn(),
    fetchAddress: jest.fn().mockResolvedValue({ address: "GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K" }),
    signTransaction: jest.fn().mockResolvedValue({ signedTxXdr: "AAAA" }),
  },
}));
jest.mock("@creit-tech/stellar-wallets-kit/modules/freighter", () => ({
  FreighterModule: jest.fn().mockImplementation(() => ({})),
  FREIGHTER_ID: "freighter",
}));
jest.mock("@creit-tech/stellar-wallets-kit/modules/albedo", () => ({
  AlbedoModule: jest.fn().mockImplementation(() => ({})),
  ALBEDO_ID: "albedo",
}));
jest.mock("@creit-tech/stellar-wallets-kit/modules/xbull", () => ({
  xBullModule: jest.fn().mockImplementation(() => ({})),
  XBULL_ID: "xbull",
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
    TransactionBuilder: Object.assign(
      jest.fn().mockImplementation(() => ({
        addOperation: jest.fn().mockReturnThis(),
        setTimeout: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({
          toXDR: jest.fn().mockReturnValue("AAAA"),
        }),
      })),
      {
        fromXDR: jest.fn().mockReturnValue({}),
      }
    ),
    scValToNative: jest.fn().mockImplementation((scVal) => {
      // When called with a mock u64 ScVal (the create_agreement return value),
      // return agreement ID 2000 — distinct from the seeded ID 1042 — so the
      // new agreement is appended to the list rather than updating the existing one.
      if (scVal && typeof scVal.switch === "function" && scVal.switch()?.name === "scvU64") {
        return 2000;
      }
      // For all other calls (e.g. get_agreement retval), return the agreement object
      // with id=2000 to match the ID returned by getTransaction.
      return {
        id: 2000,
        agreement_id: 2000,
        landlord: "GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K",
        tenant: "GBTR5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K",
        token: "USDC",
        deposit_amount: 1200,
        locked_amount: 1200,
        released_amount: 0,
        duration: 31536000,
        status: "Created",
        metadata_hash: "hash123",
        refund_requested_amount: 0,
      };
    }),
    rpc: {
      Api: {
        isSimulationError: jest.fn().mockImplementation((sim) => "error" in sim),
        isSimulationSuccess: jest.fn().mockImplementation((sim) => "transactionData" in sim),
        GetTransactionStatus: {
          SUCCESS: "SUCCESS",
          FAILED: "FAILED",
          NOT_FOUND: "NOT_FOUND",
        },
      },
      Server: jest.fn().mockImplementation(() => ({
        getLatestLedger: jest.fn().mockResolvedValue({ sequence: 100 }),
        getEvents: jest.fn().mockResolvedValue({ events: [] }),
        simulateTransaction: jest.fn().mockResolvedValue({
          // Simulate successful response shape (transactionData present = success)
          transactionData: {},
          minResourceFee: "100",
          result: {
            retval: { switch: () => ({ name: "scvMap" }) },
          },
        }),
        getAccount: jest.fn().mockResolvedValue({
          id: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
          sequence: "1000",
          incrementSequenceNumber: jest.fn(),
        }),
        prepareTransaction: jest.fn().mockImplementation((tx) => ({
          ...tx,
          toXDR: jest.fn().mockReturnValue("AAAA"),
        })),
        sendTransaction: jest.fn().mockResolvedValue({
          hash: "mocktxhash1234567890",
          status: "PENDING",
        }),
        getTransaction: jest.fn().mockResolvedValue({
          status: "SUCCESS",
          returnValue: { switch: () => ({ name: "scvU64" }) },
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
        scvBytes: jest.fn().mockReturnValue({}),
        scvI128: jest.fn().mockReturnValue({}),
      },
      Uint64: jest.fn().mockImplementation(() => ({})),
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
    nativeToScVal: jest.fn().mockImplementation((val, opts) => {
      // Return a u64-shaped mock for BigInt values (used for duration, agreementId, etc.)
      if (typeof val === "bigint") {
        return { switch: () => ({ name: opts?.type === "i128" ? "scvI128" : "scvU64" }) };
      }
      return {};
    }),
  };
});
