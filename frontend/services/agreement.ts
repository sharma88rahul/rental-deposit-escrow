import { ContractClient } from "./contract-client";
import { SorobanClient } from "./soroban-client";
import { useStore } from "@/store/useStore";
import { useWalletStore } from "@/store/useWalletStore";
import { Agreement, AgreementStatus } from "@/types";

const client = new ContractClient();

interface AgreementContractData {
  id: number;
  landlord: string;
  tenant: string;
  token: string;
  deposit_amount: { toString(): string };
  duration: number;
  status: string;
  metadata_hash: string;
  refund_requested_amount: { toString(): string };
}

export class AgreementService {
  /**
   * Fetch all agreements from store cache (in-memory simulation)
   */
  public static async fetchAgreements(): Promise<Agreement[]> {
    const agreements: Agreement[] = [];
    let id = 1;
    while (true) {
      try {
        const item = await SorobanClient.getAgreement(id) as AgreementContractData | null;
        if (!item) {
          break;
        }
        agreements.push({
          id: item.id,
          landlord: item.landlord,
          tenant: item.tenant,
          token: item.token,
          depositAmount: item.deposit_amount.toString(),
          duration: item.duration,
          status: item.status as AgreementStatus,
          metadataHash: item.metadata_hash,
          refundRequestedAmount: item.refund_requested_amount.toString(),
          createdAt: new Date().toISOString(),
        });
        id++;
      } catch (err: any) {
        const errMsg = String(err.message || err);
        if (
          errMsg.includes("not found") ||
          errMsg.includes("revert") ||
          errMsg.includes("no valid results") ||
          errMsg.includes("Simulation operation error")
        ) {
          break;
        }
        throw err;
      }
    }

    useStore.setState({ agreements });
    return agreements;
  }

  /**
   * Fetch single agreement details
   */
  public static async getAgreementDetails(id: number): Promise<Agreement | null> {
    try {
      const item = await SorobanClient.getAgreement(id) as AgreementContractData | null;
      if (item) {
        const agreement: Agreement = {
          id: item.id,
          landlord: item.landlord,
          tenant: item.tenant,
          token: item.token,
          depositAmount: item.deposit_amount.toString(),
          duration: item.duration,
          status: item.status as AgreementStatus,
          metadataHash: item.metadata_hash,
          refundRequestedAmount: item.refund_requested_amount.toString(),
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
      console.warn(`Could not read agreement #${id} from contract, using fallback cache:`, err);
    }

    return useStore.getState().agreements.find((a) => a.id === id) || null;
  }

  /**
   * Create agreement (invokes contract create_agreement simulation)
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
    // Validate wallets
    const landlordAddress = useWalletStore.getState().walletAddress;
    if (!landlordAddress) {
      throw new Error("Wallet not connected");
    }

    if (!params.tenant.startsWith("G") || params.tenant.length !== 56) {
      throw new Error("Invalid tenant Stellar wallet address format.");
    }
    
    const depositNum = parseFloat(params.depositAmount);
    if (isNaN(depositNum) || depositNum <= 0) {
      throw new Error("Deposit amount must be greater than zero.");
    }

    // Build Soroban operation envelope for syntax check compiler validation
    client.createAgreementOp({
      landlord: landlordAddress,
      tenant: params.tenant,
      token: params.token,
      depositAmount: depositNum,
      duration: params.duration,
      metadataHash: params.metadataHash,
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const mainStore = useStore.getState();
        const newId = mainStore.addAgreement({
          title: params.title,
          propertyAddress: params.propertyAddress,
          landlord: landlordAddress,
          tenant: params.tenant,
          token: params.token,
          depositAmount: params.depositAmount,
          duration: params.duration,
          metadataHash: params.metadataHash,
        });
        resolve(newId);
      }, 1000);
    });
  }

  /**
   * Edit draft agreement details (only allowed when status is 'Created')
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

        // Apply edits in-memory
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
   * Cancel draft agreement (only allowed when status is 'Created')
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

        useStore.getState().updateAgreementStatus(id, "Draft"); // Set to Draft/Cancelled state

        resolve();
      }, 400);
    });
  }

  /**
   * Accept agreement (invokes contract accept_agreement)
   */
  public static async acceptAgreement(id: number): Promise<void> {
    const tenantAddress = useWalletStore.getState().walletAddress;
    if (tenantAddress) {
      client.acceptAgreementOp(tenantAddress, id);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        useStore.getState().updateAgreementStatus(id, "Accepted");
        resolve();
      }, 800);
    });
  }

  /**
   * Reject/Cancel agreement
   */
  public static async rejectAgreement(id: number): Promise<void> {
    try {
      client.rejectAgreementOp(id);
    } catch {
      // Skip if not supported
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        useStore.getState().updateAgreementStatus(id, "Draft"); // Reverts to Draft/Cancelled state
        resolve();
      }, 800);
    });
  }

  /**
   * Propose split refund release
   */
  public static async proposeRefund(id: number, tenantRefundAmount: string): Promise<void> {
    const refundVal = parseFloat(tenantRefundAmount);
    const landlordAddress = useWalletStore.getState().walletAddress;
    if (landlordAddress) {
      client.proposeRefundOp(landlordAddress, id, refundVal);
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        useStore.getState().requestRefund(id, tenantRefundAmount);
        resolve();
      }, 800);
    });
  }

  /**
   * Issue arbitration settlement
   */
  public static async resolveDispute(id: number, tenantRefundAmount: string): Promise<void> {
    const refundVal = parseFloat(tenantRefundAmount);
    const arbitratorAddress = useWalletStore.getState().walletAddress;
    if (arbitratorAddress) {
      client.resolveDisputeOp(arbitratorAddress, id, refundVal);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        // Dispute resolution releases funds and resolves agreement status
        useStore.getState().requestRefund(id, tenantRefundAmount);
        useStore.getState().updateAgreementStatus(id, "Resolved");
        resolve();
      }, 800);
    });
  }
}
