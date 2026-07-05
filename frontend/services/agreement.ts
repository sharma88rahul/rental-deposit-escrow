import { ContractClient } from "./contract-client";
import { useStore } from "@/store/useStore";
import { useWalletStore } from "@/store/useWalletStore";
import { Agreement, AgreementStatus } from "@/types";

const client = new ContractClient();

export class AgreementService {
  /**
   * Fetch all agreements from store cache (in-memory simulation)
   */
  public static async fetchAgreements(): Promise<Agreement[]> {
    return new Promise((resolve) => {
      // Simulate RPC fetch latency
      setTimeout(() => {
        const state = useStore.getState();
        resolve(state.agreements);
      }, 500);
    });
  }

  /**
   * Fetch single agreement details
   */
  public static async getAgreementDetails(id: number): Promise<Agreement | null> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const state = useStore.getState();
        const agreement = state.agreements.find((a) => a.id === id);
        if (!agreement) {
          reject(new Error(`Agreement #${id} not found.`));
        } else {
          resolve(agreement);
        }
      }, 300);
    });
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
    const walletState = useWalletStore.getState();
    if (!walletState.connected || !walletState.walletAddress) {
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
      title: params.title,
      propertyAddress: params.propertyAddress,
      landlord: "GD7K5R5P...LAND", // Default landlord address
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
          landlord: "GD7K5R5P...LAND",
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
    client.acceptAgreementOp(id);
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
    client.rejectAgreementOp(id);
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
    client.proposeRefundOp(id, refundVal);
    
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
    client.resolveDisputeOp(id, refundVal);

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
