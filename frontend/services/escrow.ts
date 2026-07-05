import { ContractClient } from "./contract-client";
import { useEscrowStore, EscrowDetails } from "@/store/useEscrowStore";
import { useStore } from "@/store/useStore";
import { AgreementStatus } from "@/types";

const client = new ContractClient();

export class EscrowService {
  /**
   * Fetch all escrows from the Zustand cache store
   */
  public static async fetchEscrows(): Promise<EscrowDetails[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const state = useEscrowStore.getState();
        resolve(state.escrows);
      }, 500);
    });
  }

  /**
   * Fetch detailed specifications of a single escrow record
   */
  public static async getEscrowDetails(escrowId: number): Promise<EscrowDetails | null> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const state = useEscrowStore.getState();
        const escrow = state.escrows.find((e) => e.escrowId === escrowId);
        if (!escrow) {
          reject(new Error(`Escrow #${escrowId} not found.`));
        } else {
          resolve(escrow);
        }
      }, 300);
    });
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
