// Mock the ESM wallets kit module before importing components that reference it
jest.mock("@creit-tech/stellar-wallets-kit", () => ({
  Networks: {
    TESTNET: "testnet",
    PUBLIC: "public",
  },
  allowAllModules: jest.fn(),
  StellarWalletsKit: jest.fn(),
}));

import { useWalletStore } from "../store/useWalletStore";
import { Networks } from "@creit-tech/stellar-wallets-kit";

// Mock the wallet service module to avoid direct browser/extension calls
jest.mock("../services/wallet", () => ({
  connectWalletService: jest.fn((walletId: string) => {
    if (walletId === "freighter") {
      return Promise.resolve({ address: "GD7K5R5P...LAND" });
    }
    return Promise.reject(new Error("Wallet not available"));
  }),
  fetchBalanceService: jest.fn(() => Promise.resolve("45.20")),
}));

describe("Stellar Wallet Integration & Store Tests", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useWalletStore.getState().disconnect();
    useWalletStore.getState().setError(null);
  });

  it("should initialize with default disconnected values", () => {
    const state = useWalletStore.getState();
    expect(state.connected).toBe(false);
    expect(state.walletAddress).toBeNull();
    expect(state.activeWallet).toBeNull();
    expect(state.balance).toBe("0.0");
    expect(state.network).toBe(Networks.TESTNET);
  });

  it("should connect Freighter wallet successfully and set address", async () => {
    const state = useWalletStore.getState();
    expect(state.connected).toBe(false);

    // Trigger mock connection success parameters
    state.setConnection("GD7K5R5P...LAND", "freighter");

    const updatedState = useWalletStore.getState();
    expect(updatedState.connected).toBe(true);
    expect(updatedState.walletAddress).toBe("GD7K5R5P...LAND");
    expect(updatedState.activeWallet).toBe("freighter");
    expect(updatedState.error).toBeNull();
  });

  it("should disconnect wallet session and clear address metadata", () => {
    const state = useWalletStore.getState();
    state.setConnection("GD7K5R5P...LAND", "freighter");
    state.setBalance("120.45");
    
    expect(useWalletStore.getState().connected).toBe(true);

    // Call disconnect
    useWalletStore.getState().disconnect();

    const clearedState = useWalletStore.getState();
    expect(clearedState.connected).toBe(false);
    expect(clearedState.walletAddress).toBeNull();
    expect(clearedState.activeWallet).toBeNull();
    expect(clearedState.balance).toBe("0.0");
  });

  it("should switch active networks and handle updates", () => {
    const state = useWalletStore.getState();
    expect(state.network).toBe(Networks.TESTNET);

    state.setNetwork(Networks.PUBLIC);
    
    expect(useWalletStore.getState().network).toBe(Networks.PUBLIC);
  });

  it("should record connection errors in the store", () => {
    const state = useWalletStore.getState();
    state.setError("Freighter extension not found");

    const errorState = useWalletStore.getState();
    expect(errorState.error).toBe("Freighter extension not found");
    expect(errorState.isConnecting).toBe(false);
  });
});
