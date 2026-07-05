import {
  Contract,
  Address,
  xdr,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { siteConfig } from "@/config/site";

// Helper to convert native values to Soroban ScVal
export function toScVal(value: unknown, type?: "address" | "symbol" | "u32" | "u64" | "string"): xdr.ScVal {
  if (type === "address") {
    return xdr.ScVal.scvAddress(Address.fromString(value as string).toScAddress());
  }
  if (type === "symbol") {
    return xdr.ScVal.scvSymbol(value as string);
  }
  if (type === "u32") {
    return xdr.ScVal.scvU32(value as number);
  }
  if (type === "string") {
    return xdr.ScVal.scvString(value as string);
  }
  // Fallback to automatic conversion
  return nativeToScVal(value);
}

export class ContractClient {
  private rentalContractId: string;
  private escrowContractId: string;

  constructor() {
    this.rentalContractId = siteConfig.contracts.rentalAgreementId;
    this.escrowContractId = siteConfig.contracts.escrowId;
  }

  /**
   * Format transaction call to Rental Agreement Soroban Contract
   */
  public buildRentalInvokeOperation(method: string, args: xdr.ScVal[]) {
    const contract = new Contract(this.rentalContractId);
    return contract.call(method, ...args);
  }

  /**
   * Format transaction call to Escrow Soroban Contract
   */
  public buildEscrowInvokeOperation(method: string, args: xdr.ScVal[]) {
    const contract = new Contract(this.escrowContractId);
    return contract.call(method, ...args);
  }

  /**
   * Helper to parse returned ScVal into native JS types
   */
  public parseResult(scValXdrBase64: string): unknown {
    const scVal = xdr.ScVal.fromXDR(scValXdrBase64, "base64");
    return scValToNative(scVal);
  }

  /**
   * Simulates calling `create_agreement` on Rental Agreement Contract
   */
  public createAgreementOp(params: {
    title: string;
    propertyAddress: string;
    landlord: string;
    tenant: string;
    token: string;
    depositAmount: number;
    duration: number;
    metadataHash: string;
  }) {
    const args = [
      toScVal(params.title, "string"),
      toScVal(params.propertyAddress, "string"),
      toScVal(params.landlord, "address"),
      toScVal(params.tenant, "address"),
      toScVal(params.token, "address"),
      toScVal(params.depositAmount, "u32"),
      toScVal(params.duration, "u32"),
      toScVal(params.metadataHash, "string"),
    ];

    return this.buildRentalInvokeOperation("create_agreement", args);
  }

  /**
   * Simulates calling `accept_agreement` on Rental Agreement Contract
   */
  public acceptAgreementOp(agreementId: number) {
    const args = [toScVal(agreementId, "u32")];
    return this.buildRentalInvokeOperation("accept_agreement", args);
  }

  /**
   * Simulates calling `reject_agreement` on Rental Agreement Contract
   */
  public rejectAgreementOp(agreementId: number) {
    const args = [toScVal(agreementId, "u32")];
    return this.buildRentalInvokeOperation("reject_agreement", args);
  }

  /**
   * Simulates calling `propose_refund` on Rental Agreement Contract
   */
  public proposeRefundOp(agreementId: number, refundAmount: number) {
    const args = [
      toScVal(agreementId, "u32"),
      toScVal(refundAmount, "u32"),
    ];
    return this.buildRentalInvokeOperation("propose_refund", args);
  }

  /**
   * Simulates calling `resolve_dispute` on Rental Agreement Contract
   */
  public resolveDisputeOp(agreementId: number, tenantSplit: number) {
    const args = [
      toScVal(agreementId, "u32"),
      toScVal(tenantSplit, "u32"),
    ];
    return this.buildRentalInvokeOperation("resolve_dispute", args);
  }

  /**
   * Simulates calling `lock_deposit` on Escrow Contract
   */
  public lockEscrowDepositOp(params: {
    tenant: string;
    agreementId: number;
    amount: number;
    token: string;
  }) {
    const args = [
      toScVal(params.tenant, "address"),
      toScVal(params.agreementId, "u32"),
      toScVal(params.amount, "u32"),
      toScVal(params.token, "address"),
    ];
    return this.buildEscrowInvokeOperation("lock_deposit", args);
  }

  /**
   * Simulates calling `release_deposit` on Escrow Contract
   */
  public releaseEscrowDepositOp(params: {
    landlord: string;
    tenant: string;
    agreementId: number;
    tenantRefund: number;
    landlordDeduction: number;
  }) {
    const args = [
      toScVal(params.landlord, "address"),
      toScVal(params.tenant, "address"),
      toScVal(params.agreementId, "u32"),
      toScVal(params.tenantRefund, "u32"),
      toScVal(params.landlordDeduction, "u32"),
    ];
    return this.buildEscrowInvokeOperation("release_deposit", args);
  }

  /**
   * Simulates calling `get_escrow` on Escrow Contract
   */
  public getEscrowOp(agreementId: number) {
    const args = [toScVal(agreementId, "u32")];
    return this.buildEscrowInvokeOperation("get_escrow", args);
  }
}
