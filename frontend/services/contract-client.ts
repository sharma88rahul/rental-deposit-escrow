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
  if (type === "u32" || type === "u64") {
    if (typeof xdr.Uint64 !== "undefined" && typeof xdr.ScVal.scvU64 === "function") {
      return xdr.ScVal.scvU64(xdr.Uint64.fromString(String(value)));
    }
    return nativeToScVal(value);
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
    landlord: string;
    tenant: string;
    token: string;
    depositAmount: number;
    duration: number;
    metadataHash: string;
  }) {
    const buf = Buffer.alloc(32);
    buf.write(params.metadataHash);

    const metadataScVal = typeof xdr.ScVal.scvBytes === "function"
      ? xdr.ScVal.scvBytes(buf)
      : (nativeToScVal(buf) || ({} as unknown as xdr.ScVal));

    const args = [
      toScVal(params.landlord, "address"),
      toScVal(params.tenant, "address"),
      toScVal(params.token, "address"),
      nativeToScVal(BigInt(params.depositAmount)),
      nativeToScVal(BigInt(params.duration)),
      metadataScVal,
    ];

    return this.buildRentalInvokeOperation("create_agreement", args);
  }

  /**
   * Simulates calling `accept_agreement` on Rental Agreement Contract
   */
  public acceptAgreementOp(tenant: string, agreementId: number) {
    const args = [
      toScVal(tenant, "address"),
      toScVal(agreementId, "u64"),
    ];
    return this.buildRentalInvokeOperation("accept_agreement", args);
  }

  /**
   * Simulates calling `reject_agreement` on Rental Agreement Contract (local mockup helper)
   */
  public rejectAgreementOp(agreementId: number) {
    console.warn(`reject_agreement is not supported on-chain for Agreement #${agreementId}. Skipping simulation.`);
    return null;
  }

  /**
   * Simulates calling `request_refund` on Rental Agreement Contract
   */
  public proposeRefundOp(landlord: string, agreementId: number, refundAmount: number) {
    const args = [
      toScVal(landlord, "address"),
      toScVal(agreementId, "u64"),
      nativeToScVal(BigInt(refundAmount)),
    ];
    return this.buildRentalInvokeOperation("request_refund", args);
  }

  /**
   * Simulates calling `resolve_dispute` on Rental Agreement Contract
   */
  public resolveDisputeOp(arbitrator: string, agreementId: number, tenantSplit: number) {
    const args = [
      toScVal(arbitrator, "address"),
      toScVal(agreementId, "u64"),
      nativeToScVal(BigInt(tenantSplit)),
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
