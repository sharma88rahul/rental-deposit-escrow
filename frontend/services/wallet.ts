import { StellarWalletsKit, Networks } from "@creit-tech/stellar-wallets-kit";
import { FreighterModule } from "@creit-tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit-tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit-tech/stellar-wallets-kit/modules/xbull";
import { Horizon } from "@stellar/stellar-sdk";
import { useWalletStore } from "@/store/useWalletStore";

let isKitInitialized = false;

export function initWalletKit(network: Networks) {
  if (!isKitInitialized) {
    StellarWalletsKit.init({
      network,
      modules: [
        new FreighterModule(),
        new AlbedoModule(),
        new xBullModule(),
      ],
    });
    isKitInitialized = true;
  } else {
    StellarWalletsKit.setNetwork(network);
  }
}

export interface ConnectionResult {
  address: string;
}

/**
 * Request wallet connection and get public key address.
 */
export async function connectWalletService(
  walletId: string,
  network: Networks
): Promise<ConnectionResult> {
  // Initialize or update network passphrase
  initWalletKit(network);
  
  // Set target active wallet provider
  StellarWalletsKit.setWallet(walletId);
  
  // Prompt connection / sign-in and fetch public key directly from wallet
  const { address } = await StellarWalletsKit.fetchAddress();
  
  if (!address) {
    throw new Error("No address returned from the wallet provider.");
  }
  
  return { address };
}

/**
 * Fetch native XLM balance using the Stellar SDK Horizon client.
 */
export async function fetchBalanceService(
  address: string,
  network: Networks
): Promise<string> {
  const horizonUrl =
    network === Networks.PUBLIC
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";

  const server = new Horizon.Server(horizonUrl);
  
  try {
    const accountInfo = await server.loadAccount(address);
    const nativeAsset = accountInfo.balances.find(
      (b) => b.asset_type === "native"
    );
    return nativeAsset ? parseFloat(nativeAsset.balance).toFixed(2) : "0.00";
  } catch (error: unknown) {
    // If account doesn't exist on network yet, return 0.00
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return "0.00 (Unfunded)";
    }
    throw error;
  }
}

/**
 * Sign a Soroban transaction XDR using the currently active wallet (Freighter etc.).
 * Called by SorobanClient.submitSorobanTransaction() as the signFn callback.
 *
 * PROVEN MISSING: This function did not exist before. Without it, the
 * createAgreementOp() return value was discarded and a mock setTimeout
 * wrote a fake local ID instead of ever contacting Freighter.
 */
export async function signTransactionService(
  xdrToSign: string,
  networkPassphrase: string
): Promise<string> {
  // Automatically restore kit state if a persisted wallet session exists
  const store = useWalletStore.getState();
  if (store.connected && store.activeWallet) {
    console.log(`[signTransactionService] Restoring kit session for wallet: ${store.activeWallet}`);
    initWalletKit(store.network);
    StellarWalletsKit.setWallet(store.activeWallet);
  }

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdrToSign, {
    networkPassphrase,
  });
  if (!signedTxXdr) {
    throw new Error("Wallet returned no signed XDR. User may have rejected the transaction.");
  }
  console.log("[signTransactionService] Signed XDR received from wallet.");
  return signedTxXdr;
}

