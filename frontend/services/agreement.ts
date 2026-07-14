import { ContractClient } from "./contract-client";
import { SorobanClient } from "./soroban-client-new";
import { signTransactionService } from "./wallet";
import { useStore } from "@/store/useStore";
import { useWalletStore } from "@/store/useWalletStore";
import { siteConfig } from "@/config/site";
import { Agreement, AgreementStatus } from "@/types";
import { scValToNative } from "@stellar/stellar-sdk";

const client = new ContractClient();

interface AgreementContractData {
  id: number | bigint;
  landlord: string;
  tenant: string;
  token: string;
  deposit_amount: bigint | number | { toString(): string };
  duration: number | bigint;
  status: string | string[] | unknown;
  metadata_hash: string | Uint8Array | unknown;
  refund_requested_amount: bigint | number | { toString(): string };
}

/**
 * Soroban #[contracttype] enums are encoded as u32 integers on-chain,
 * but scValToNative() can return either a number, an array, or an object.
 * This helper extracts the variant name regardless of the format.
 */
function parseContractStatus(raw: unknown): AgreementStatus {
  // Number form: 1 (Stellar u32 repr enums on chain)
  if (typeof raw === "number") {
    const statuses: AgreementStatus[] = [
      "Draft",
      "Created",
      "Accepted",
      "DepositLocked",
      "LeaseActive",
      "RefundRequested",
      "Approved",
      "FundsReleased",
      "DisputeRaised",
      "Resolved",
    ];
    return statuses[raw] || "Created";
  }
  // Array form: ['Created'] — from scValToNative of scvVec enum
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
    return raw[0] as AgreementStatus;
  }
  // Already a string (e.g. from mocks or future SDK changes)
  if (typeof raw === "string") return raw as AgreementStatus;
  // Object map form: { Created: null } — possible alternative encoding
  if (raw && typeof raw === "object") {
    const key = Object.keys(raw as object)[0];
    if (key) return key as AgreementStatus;
  }
  return "Created";
}

/**
 * Safely parse metadata hash from Buffer or Uint8Array back to string.
 */
function parseMetadataHash(raw: unknown): string {
  if (raw && (typeof raw === "object" || raw instanceof Uint8Array)) {
    try {
      return Buffer.from(raw as any).toString("utf8").replace(/\0+$/, "");
    } catch {
      return String(raw);
    }
  }
  return String(raw);
}

// JSON replacer to safely stringify BigInt values without throwing TypeError
const safeBigIntReplacer = (key: string, value: any) =>
  typeof value === "bigint" ? value.toString() : value;

/**
 * Convert stroops (i128 bigint) to XLM string with up to 7 decimal places.
 * The XLM SAC uses 7-decimal precision (1 XLM = 10,000,000 stroops).
 */
function stroopsToXlm(stroops: unknown): string {
  try {
    const n = BigInt(String(stroops));
    const divisor = BigInt(10_000_000);
    const whole = n / divisor;
    const frac = n % divisor;
    if (frac === BigInt(0)) return whole.toString();
    return `${whole}.${frac.toString().padStart(7, "0").replace(/0+$/, "")}`;
  } catch {
    return String(stroops);
  }
}

export class AgreementService {
  /**
   * Fetch all agreements from the deployed Rental Agreement contract by
   * sequential scan.  Every step is logged so we can trace exactly where
   * the array becomes empty.
   */
  public static async fetchAgreements(): Promise<Agreement[]> {
    console.log("[AgreementService.fetchAgreements] Starting sequential scan from id=1");
    const agreements: Agreement[] = [];
    let id = 1;

    while (true) {
      console.log(`[AgreementService.fetchAgreements] Querying id=${id}...`);
      try {
        const raw = await SorobanClient.getAgreement(id);
        console.log(`[AgreementService.fetchAgreements] id=${id} raw=`, JSON.stringify(raw, safeBigIntReplacer));

        if (!raw) {
          console.log(`[AgreementService.fetchAgreements] id=${id} returned null → scan complete at ${id - 1} agreements.`);
          break;
        }

        const item = raw as AgreementContractData;
        const parsed: Agreement = {
          id: Number(item.id),
          landlord: String(item.landlord),
          tenant: String(item.tenant),
          token: String(item.token),
          // deposit_amount is stored in stroops (i128). Convert to XLM for display.
          depositAmount: stroopsToXlm(item.deposit_amount),
          duration: Number(item.duration),
          // status is a scvVec enum → decoded as ["Created"], extract the string
          status: parseContractStatus(item.status),
          metadataHash: parseMetadataHash(item.metadata_hash),
          refundRequestedAmount: stroopsToXlm(item.refund_requested_amount),
          createdAt: new Date().toISOString(),
        };
        console.log(`[AgreementService.fetchAgreements] id=${id} parsed:`, JSON.stringify(parsed, safeBigIntReplacer));
        agreements.push(parsed);
        id++;
      } catch (err: unknown) {
        const errMsg = String((err as Error).message || err);
        console.error(`[AgreementService.fetchAgreements] id=${id} threw error:`, errMsg);
        // Distinguish "record not found" (break scan) from real network error
        const isEndOfScan =
          errMsg.includes("not found") ||
          errMsg.includes("revert") ||
          errMsg.includes("MissingValue") ||
          errMsg.includes("NotInitialized") ||
          errMsg.includes("no valid results") ||
          errMsg.includes("Error(Contract, #4)") ||
          errMsg.includes("#4") ||
          errMsg.includes("Simulation operation error");
        if (isEndOfScan) {
          console.log(`[AgreementService.fetchAgreements] End-of-scan error at id=${id}. Total loaded: ${agreements.length}`);
          break;
        }
        // Real network error — surface it instead of silently hiding it
        throw err;
      }
    }

    console.log(`[AgreementService.fetchAgreements] Final array length: ${agreements.length}`, agreements.map(a => a.id));
    useStore.setState({ agreements });
    return agreements;
  }

  /**
   * Fetch single agreement details from chain and update store.
   */
  public static async getAgreementDetails(id: number): Promise<Agreement | null> {
    console.log(`[AgreementService.getAgreementDetails] Fetching id=${id}`);
    try {
      const raw = await SorobanClient.getAgreement(id);
      if (raw) {
        const item = raw as AgreementContractData;
        const agreement: Agreement = {
          id: Number(item.id),
          landlord: String(item.landlord),
          tenant: String(item.tenant),
          token: String(item.token),
          depositAmount: stroopsToXlm(item.deposit_amount),
          duration: Number(item.duration),
          status: parseContractStatus(item.status),
          metadataHash: parseMetadataHash(item.metadata_hash),
          refundRequestedAmount: stroopsToXlm(item.refund_requested_amount),
          createdAt: new Date().toISOString(),
        };

        const currentList = useStore.getState().agreements;
        const exists = currentList.find((a) => a.id === id);
        if (exists) {
          useStore.setState({
            agreements: currentList.map((a) => (a.id === id ? agreement : a)),
          });
        } else {
          useStore.setState({
            agreements: [agreement, ...currentList],
          });
        }
        return agreement;
      }
    } catch (err) {
      console.warn(`[AgreementService.getAgreementDetails] Could not read id=${id}:`, err);
    }

    return useStore.getState().agreements.find((a) => a.id === id) || null;
  }

  /**
   * Create agreement — REAL Soroban blockchain submission.
   *
   * PROVEN MOCK REMOVED: The previous implementation called
   * client.createAgreementOp() and discarded the return value, then used a
   * 1-second setTimeout to write a random local ID into Zustand.  No Freighter
   * call, no transaction hash, no on-chain write ever happened.
   *
   * This implementation:
   * 1. Builds the operation via ContractClient
   * 2. Simulates it (catches NotInitialized and other contract errors early)
   * 3. Signs via Freighter through StellarWalletsKit
   * 4. Broadcasts and polls to SUCCESS
   * 5. Parses the returned u64 agreement ID from the contract's return value
   * 6. Immediately reads the stored agreement back from chain via getAgreementDetails()
   */
  public static async createAgreement(params: {
    title: string;
    propertyAddress: string;
    tenant: string;
    token: string;
    depositAmount: string;
    duration: number;
    metadataHash: string;
  }): Promise<number> {
    const landlordAddress = useWalletStore.getState().walletAddress;
    if (!landlordAddress) {
      throw new Error("Wallet not connected. Please connect Freighter first.");
    }

    if (!params.tenant.startsWith("G") || params.tenant.length !== 56) {
      throw new Error("Invalid tenant Stellar wallet address format.");
    }

    const depositNum = parseFloat(params.depositAmount);
    if (isNaN(depositNum) || depositNum <= 0) {
      throw new Error("Deposit amount must be greater than zero.");
    }

    console.log("[AgreementService.createAgreement] Building contract operation...");
    const operation = client.createAgreementOp({
      landlord: landlordAddress,
      tenant: params.tenant,
      token: params.token,
      depositAmount: depositNum,
      duration: params.duration,
      metadataHash: params.metadataHash,
    });

    // submitSorobanTransaction handles: simulate → prepareTransaction → sign → send → poll
    console.log("[AgreementService.createAgreement] Submitting Soroban transaction...");
    const { hash, returnValue } = await SorobanClient.submitSorobanTransaction(
      operation,
      landlordAddress,
      (xdrToSign) =>
        signTransactionService(xdrToSign, siteConfig.contracts.networkPassphrase)
    );

    console.log(`[AgreementService.createAgreement] Transaction SUCCESS. Hash: ${hash}`);

    // Parse the u64 agreement ID returned by create_agreement()
    let newId: number | null = null;
    if (returnValue) {
      try {
        const native = scValToNative(returnValue);
        newId = typeof native === "bigint" ? Number(native) : (native as number);
        console.log(`[AgreementService.createAgreement] Contract returned agreement_id=${newId}`);
      } catch (parseErr) {
        console.warn("[AgreementService.createAgreement] Could not parse returnValue:", parseErr);
      }
    }

    if (!newId || newId <= 0) {
      throw new Error(`Transaction succeeded (hash: ${hash}) but contract returned no agreement ID.`);
    }

    // Read the stored agreement from chain so the store and UI are updated
    console.log(`[AgreementService.createAgreement] Reading agreement id=${newId} from chain...`);
    await AgreementService.getAgreementDetails(newId);

    // Merge off-chain metadata (title, propertyAddress) into the stored entry.
    // The Soroban contract stores only on-chain fields; title and address are
    // form-level annotations that we preserve in the local Zustand store.
    useStore.setState((state) => ({
      agreements: state.agreements.map((a) =>
        a.id === newId
          ? {
              ...a,
              title: params.title,
              propertyAddress: params.propertyAddress,
              status: "Created" as AgreementStatus,
            }
          : a
      ),
    }));

    return newId;
  }

  /**
   * Edit draft agreement details — local only (no on-chain edit function exists
   * in the deployed contract).
   */
  public static async editAgreementDraft(
    id: number,
    params: { title: string; propertyAddress: string; depositAmount: string }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const state = useStore.getState();
        const agreement = state.agreements.find((a) => a.id === id);

        if (!agreement) {
          return reject(new Error("Agreement not found."));
        }

        if (agreement.status !== "Created") {
          return reject(new Error("Cannot edit agreement after tenant acceptance."));
        }

        useStore.setState((state) => ({
          agreements: state.agreements.map((a) =>
            a.id === id
              ? {
                  ...a,
                  title: params.title,
                  propertyAddress: params.propertyAddress,
                  depositAmount: params.depositAmount,
                }
              : a
          ),
        }));

        resolve();
      }, 500);
    });
  }

  /**
   * Cancel draft — local only (no on-chain cancel in deployed contract).
   */
  public static async cancelAgreementDraft(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const state = useStore.getState();
        const agreement = state.agreements.find((a) => a.id === id);

        if (!agreement) {
          return reject(new Error("Agreement not found."));
        }

        if (agreement.status !== "Created") {
          return reject(new Error("Cannot cancel agreement after tenant has signed."));
        }

        useStore.getState().updateAgreementStatus(id, "Draft");
        resolve();
      }, 400);
    });
  }

  /**
   * Accept agreement — submits accept_agreement on-chain.
   */
  public static async acceptAgreement(id: number): Promise<void> {
    const tenantAddress = useWalletStore.getState().walletAddress;
    if (!tenantAddress) throw new Error("Wallet not connected.");

    const operation = client.acceptAgreementOp(tenantAddress, id);
    const { hash } = await SorobanClient.submitSorobanTransaction(
      operation,
      tenantAddress,
      (xdrToSign) =>
        signTransactionService(xdrToSign, siteConfig.contracts.networkPassphrase)
    );
    console.log(`[AgreementService.acceptAgreement] SUCCESS hash=${hash}`);
    await AgreementService.getAgreementDetails(id);
  }

  /**
   * Reject/Cancel agreement — not supported on-chain; updates local state only.
   */
  public static async rejectAgreement(id: number): Promise<void> {
    console.warn(`[AgreementService.rejectAgreement] reject_agreement has no on-chain function. Updating local state only for id=${id}.`);
    useStore.getState().updateAgreementStatus(id, "Draft");
  }

  /**
   * Propose split refund — submits request_refund on-chain.
   */
  public static async proposeRefund(id: number, tenantRefundAmount: string): Promise<void> {
    const refundVal = parseFloat(tenantRefundAmount);
    const landlordAddress = useWalletStore.getState().walletAddress;
    if (!landlordAddress) throw new Error("Wallet not connected.");

    const operation = client.proposeRefundOp(landlordAddress, id, refundVal);
    const { hash } = await SorobanClient.submitSorobanTransaction(
      operation,
      landlordAddress,
      (xdrToSign) =>
        signTransactionService(xdrToSign, siteConfig.contracts.networkPassphrase)
    );
    console.log(`[AgreementService.proposeRefund] SUCCESS hash=${hash}`);
    await AgreementService.getAgreementDetails(id);
  }

  /**
   * Resolve dispute — submits resolve_dispute on-chain.
   */
  public static async resolveDispute(id: number, tenantRefundAmount: string): Promise<void> {
    const refundVal = parseFloat(tenantRefundAmount);
    const arbitratorAddress = useWalletStore.getState().walletAddress;
    if (!arbitratorAddress) throw new Error("Wallet not connected.");

    const operation = client.resolveDisputeOp(arbitratorAddress, id, refundVal);
    const { hash } = await SorobanClient.submitSorobanTransaction(
      operation,
      arbitratorAddress,
      (xdrToSign) =>
        signTransactionService(xdrToSign, siteConfig.contracts.networkPassphrase)
    );
    console.log(`[AgreementService.resolveDispute] SUCCESS hash=${hash}`);
    await AgreementService.getAgreementDetails(id);
  }
}
