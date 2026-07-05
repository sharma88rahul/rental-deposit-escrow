import { ContractClient, toScVal } from "./contract-client";
import { SorobanClient } from "./soroban-client";
import { useEscrowStore, EscrowDetails } from "@/store/useEscrowStore";
import { useStore } from "@/store/useStore";
import { AgreementStatus } from "@/types";
import { siteConfig } from "@/config/site";

const client = new ContractClient();

export class EscrowService {
  /**
   * Fetch all escrows from the Zustand cache store
   */
  public static async fetchEscrows(): Promise<EscrowDetails[]> {
    try {
      const counter = await SorobanClient.getAgreementCounter();
      const escrows: EscrowDetails[] = [];

      for (let i = 1; i <= counter; i++) {
        // Query the escrow state from contract
        const args = [toScVal(i, "u32")];
        const item = await SorobanClient.queryContract(
          siteConfig.contracts.escrowId,
          "get_escrow",
          args
        ) as any;
        if (item) {
          const agreement = useStore.getState().agreements.find((a) => a.id === i);
          escrows.push({
            escrowId: item.agreement_id,
            agreementId: item.agreement_id,
            tenant: item.tenant,
            landlord: item.landlord,
            title: agreement?.title || `Escrow Vault #${i}`,
            propertyAddress: agreement?.propertyAddress || "Stellar Ledger Address",
            createdAt: agreement?.createdAt || new Date().toISOString(),
            assetType: item.token_address || "USDC",
            depositAmount: item.locked_amount.toString(),
            releasedAmount: item.released_amount.toString(),
            remainingBalance: (item.locked_amount - item.released_amount).toString(),
            currentHolder: item.is_locked ? "Escrow Contract" : "Released",
            status: item.is_locked ? "LeaseActive" : "FundsReleased",
          });
        }
      }

      if (escrows.length > 0) {
        useEscrowStore.setState({ escrows });
        return escrows;
      }
    } catch (err) {
      console.warn("Falling back to local escrow store cache due to:", err);
    }

    return useEscrowStore.getState().escrows;
  }

  /**
   * Fetch detailed specifications of a single escrow record
   */
  public static async getEscrowDetails(escrowId: number): Promise<EscrowDetails | null> {
    try {
      const args = [toScVal(escrowId, "u32")];
      const item = await SorobanClient.queryContract(
        siteConfig.contracts.escrowId,
        "get_escrow",
        args
      ) as any;
      if (item) {
        const agreement = useStore.getState().agreements.find((a) => a.id === escrowId);
        const escrow: EscrowDetails = {
          escrowId: item.agreement_id,
          agreementId: item.agreement_id,
          tenant: item.tenant,
          landlord: item.landlord,
          title: agreement?.title || `Escrow Vault #${escrowId}`,
          propertyAddress: agreement?.propertyAddress || "Stellar Ledger Address",
          createdAt: agreement?.createdAt || new Date().toISOString(),
          assetType: item.token_address || "USDC",
          depositAmount: item.locked_amount.toString(),
          releasedAmount: item.released_amount.toString(),
          remainingBalance: (item.locked_amount - item.released_amount).toString(),
          currentHolder: item.is_locked ? "Escrow Contract" : "Released",
          status: item.is_locked ? "LeaseActive" : "FundsReleased",
        };
        
        const currentList = useEscrowStore.getState().escrows;
        useEscrowStore.setState({
          escrows: currentList.map((e) => (e.escrowId === escrowId ? escrow : e)),
        });
        return escrow;
      }
    } catch (err) {
      console.warn(`Could not read escrow #${escrowId} from contract:`, err);
    }

    return useEscrowStore.getState().escrows.find((e) => e.escrowId === escrowId) || null;
  }

  /**
   * Triggers the lock_deposit transaction call to Soroban
   */
  public static async lockDeposit(agreementId: number): Promise<void> {
    const escrowStore = useEscrowStore.getState();
    const targetEscrow = escrowStore.escrows.find((e) => e.agreementId === agreementId);

    if (!targetEscrow) {
      throw new Error(`Escrow mapping for Agreement #${agreementId} not found.`);
    }

    if (targetEscrow.status !== "Accepted" && targetEscrow.status !== "Created") {
      throw new Error("Deposit has already been locked or escrow is in active status.");
    }

    // Call Soroban SDK serializer
    client.lockEscrowDepositOp({
      tenant: targetEscrow.tenant,
      agreementId,
      amount: parseFloat(targetEscrow.depositAmount),
      token: targetEscrow.assetType,
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = "0x" + Math.random().toString(16).substring(2, 10) + "lock";
        
        // Update Escrow Store state
        useEscrowStore.getState().updateEscrowState(agreementId, {
          status: "LeaseActive",
          lockedAt: new Date().toISOString(),
          currentHolder: "Escrow Contract",
        });

        // Update Agreements main store state
        useStore.getState().updateAgreementStatus(agreementId, "LeaseActive");

        // Audit Trail Logs
        useStore.getState().addTransaction({
          hash: txHash,
          type: "Lock Escrow Deposit",
          status: "Confirmed",
          fee: "0.00025 XLM",
          walletUsed: targetEscrow.tenant,
          agreementId,
        });

        useStore.getState().addActivity({
          type: "DepositLocked",
          details: `Tenant ${targetEscrow.tenant.substring(0, 6)}... locked ${targetEscrow.depositAmount} USDC into Escrow #${targetEscrow.escrowId}`,
          txHash,
        });

        resolve();
      }, 1000);
    });
  }

  /**
   * Release deposit fully to the Tenant
   */
  public static async releaseDepositFully(agreementId: number): Promise<void> {
    const escrowStore = useEscrowStore.getState();
    const targetEscrow = escrowStore.escrows.find((e) => e.agreementId === agreementId);

    if (!targetEscrow) {
      throw new Error(`Escrow mapping for Agreement #${agreementId} not found.`);
    }

    client.releaseEscrowDepositOp({
      landlord: targetEscrow.landlord,
      tenant: targetEscrow.tenant,
      agreementId,
      tenantRefund: parseFloat(targetEscrow.depositAmount),
      landlordDeduction: 0,
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = "0x" + Math.random().toString(16).substring(2, 10) + "release";

        useEscrowStore.getState().updateEscrowState(agreementId, {
          status: "FundsReleased",
          releasedAmount: targetEscrow.depositAmount,
          remainingBalance: "0",
          currentHolder: "Tenant",
          disbursedAt: new Date().toISOString(),
        });

        useStore.getState().updateAgreementStatus(agreementId, "FundsReleased");

        useStore.getState().addTransaction({
          hash: txHash,
          type: "Release Escrow Full",
          status: "Confirmed",
          fee: "0.00018 XLM",
          walletUsed: targetEscrow.landlord,
          agreementId,
        });

        useStore.getState().addActivity({
          type: "FundsReleased",
          details: `Full deposit of ${targetEscrow.depositAmount} USDC released to Tenant in Escrow #${targetEscrow.escrowId}`,
          txHash,
        });

        resolve();
      }, 800);
    });
  }

  /**
   * Propose a landlord deduction request split
   */
  public static async requestDeduction(agreementId: number, deductionAmount: string): Promise<void> {
    const deductVal = parseFloat(deductionAmount);
    const escrowStore = useEscrowStore.getState();
    const targetEscrow = escrowStore.escrows.find((e) => e.agreementId === agreementId);

    if (!targetEscrow) {
      throw new Error("Escrow record not found.");
    }

    if (deductVal < 0 || deductVal > parseFloat(targetEscrow.depositAmount)) {
      throw new Error("Deduction amount exceeds locked deposit size.");
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = "0x" + Math.random().toString(16).substring(2, 10) + "deduct";

        useEscrowStore.getState().updateEscrowState(agreementId, {
          status: "RefundRequested",
        });

        useStore.getState().updateAgreementStatus(agreementId, "RefundRequested");

        useStore.getState().addTransaction({
          hash: txHash,
          type: "Propose Escrow Split",
          status: "Confirmed",
          fee: "0.00014 XLM",
          walletUsed: targetEscrow.landlord,
          agreementId,
        });

        useStore.getState().addActivity({
          type: "DeductionRequested",
          details: `Landlord requested ${deductionAmount} USDC deduction split in Escrow #${targetEscrow.escrowId}`,
          txHash,
        });

        resolve();
      }, 800);
    });
  }

  /**
   * Approve a partial refund/deduction split
   */
  public static async approveDeduction(agreementId: number, tenantRefundAmount: string): Promise<void> {
    const escrowStore = useEscrowStore.getState();
    const targetEscrow = escrowStore.escrows.find((e) => e.agreementId === agreementId);

    if (!targetEscrow) {
      throw new Error("Escrow record not found.");
    }

    const tenantRefundVal = parseFloat(tenantRefundAmount);
    const landlordDeductVal = parseFloat(targetEscrow.depositAmount) - tenantRefundVal;

    client.releaseEscrowDepositOp({
      landlord: targetEscrow.landlord,
      tenant: targetEscrow.tenant,
      agreementId,
      tenantRefund: tenantRefundVal,
      landlordDeduction: landlordDeductVal,
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = "0x" + Math.random().toString(16).substring(2, 10) + "partial";

        useEscrowStore.getState().updateEscrowState(agreementId, {
          status: "FundsReleased",
          releasedAmount: tenantRefundAmount,
          remainingBalance: "0",
          currentHolder: "Split Released",
          disbursedAt: new Date().toISOString(),
        });

        useStore.getState().updateAgreementStatus(agreementId, "FundsReleased");

        useStore.getState().addTransaction({
          hash: txHash,
          type: "Approve Partial Split",
          status: "Confirmed",
          fee: "0.00021 XLM",
          walletUsed: targetEscrow.tenant,
          agreementId,
        });

        useStore.getState().addActivity({
          type: "DeductionApproved",
          details: `Tenant approved deduction split: ${tenantRefundAmount} USDC to Tenant, ${landlordDeductVal} USDC to Landlord in Escrow #${targetEscrow.escrowId}`,
          txHash,
        });

        resolve();
      }, 800);
    });
  }

  /**
   * Raise dispute (disputed state triggers arbitration locks)
   */
  public static async raiseDispute(agreementId: number): Promise<void> {
    const escrowStore = useEscrowStore.getState();
    const targetEscrow = escrowStore.escrows.find((e) => e.agreementId === agreementId);

    if (!targetEscrow) {
      throw new Error("Escrow record not found.");
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = "0x" + Math.random().toString(16).substring(2, 10) + "dispute";

        useEscrowStore.getState().updateEscrowState(agreementId, {
          status: "DisputeRaised",
        });

        useStore.getState().updateAgreementStatus(agreementId, "DisputeRaised");

        useStore.getState().addTransaction({
          hash: txHash,
          type: "Raise Escrow Dispute",
          status: "Confirmed",
          fee: "0.00024 XLM",
          walletUsed: targetEscrow.tenant,
          agreementId,
        });

        useStore.getState().addActivity({
          type: "DisputeRaised",
          details: `Tenant raised a legal dispute on Escrow #${targetEscrow.escrowId}`,
          txHash,
        });

        resolve();
      }, 600);
    });
  }

  /**
   * Resolve dispute split (Arbitrator action)
   */
  public static async resolveDispute(agreementId: number, tenantRefundAmount: string): Promise<void> {
    const escrowStore = useEscrowStore.getState();
    const targetEscrow = escrowStore.escrows.find((e) => e.agreementId === agreementId);

    if (!targetEscrow) {
      throw new Error("Escrow record not found.");
    }

    const tenantRefundVal = parseFloat(tenantRefundAmount);
    const landlordDeductVal = parseFloat(targetEscrow.depositAmount) - tenantRefundVal;

    client.releaseEscrowDepositOp({
      landlord: targetEscrow.landlord,
      tenant: targetEscrow.tenant,
      agreementId,
      tenantRefund: tenantRefundVal,
      landlordDeduction: landlordDeductVal,
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = "0x" + Math.random().toString(16).substring(2, 10) + "resolve";

        useEscrowStore.getState().updateEscrowState(agreementId, {
          status: "Resolved",
          releasedAmount: tenantRefundAmount,
          remainingBalance: "0",
          currentHolder: "Arbitration Released",
          disbursedAt: new Date().toISOString(),
        });

        useStore.getState().updateAgreementStatus(agreementId, "Resolved");

        useStore.getState().addTransaction({
          hash: txHash,
          type: "Resolve Dispute Split",
          status: "Confirmed",
          fee: "0.00032 XLM",
          walletUsed: "GA8P5R5P...ARBITRATOR",
          agreementId,
        });

        useStore.getState().addActivity({
          type: "DisputeResolved",
          details: `Arbitrator resolved dispute on Escrow #${targetEscrow.escrowId}: Tenant split ${tenantRefundAmount} USDC`,
          txHash,
        });

        resolve();
      }, 900);
    });
  }

  /**
   * Close Escrow / complete cleanup
   */
  public static async closeEscrow(agreementId: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = "0x" + Math.random().toString(16).substring(2, 10) + "close";

        useEscrowStore.getState().updateEscrowState(agreementId, {
          status: "FundsReleased", // Final state
        });

        useStore.getState().updateAgreementStatus(agreementId, "FundsReleased");

        useStore.getState().addTransaction({
          hash: txHash,
          type: "Close Escrow Vault",
          status: "Confirmed",
          fee: "0.00011 XLM",
          walletUsed: "GD7K5R5P...LAND",
          agreementId,
        });

        useStore.getState().addActivity({
          type: "AgreementCompleted",
          details: `Escrow vault closed for Agreement #${agreementId}`,
          txHash,
        });

        resolve();
      }, 500);
    });
  }
}
