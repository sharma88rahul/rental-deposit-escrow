import {
  Contract,
  Address,
  xdr,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  Networks,
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
  private contractId: string;
  private networkPassphrase: string;

  constructor() {
    this.contractId = siteConfig.contracts.rentalAgreementId;
    this.networkPassphrase = siteConfig.contracts.networkPassphrase;
  }

  /**
   * Format transaction call to Rental Agreement Soroban Contract
   */
  public buildInvokeOperation(method: string, args: xdr.ScVal[]) {
    const contract = new Contract(this.contractId);
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
   * Simulates calling `create_agreement` on-chain
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
      toScVal(params.token, "address"), // Token SAC address
      toScVal(params.depositAmount, "u32"), // Deposit HSL amount
      toScVal(params.duration, "u32"), // Duration in seconds
      toScVal(params.metadataHash, "string"),
    ];

    return this.buildInvokeOperation("create_agreement", args);
  }

  /**
   * Simulates calling `accept_agreement` on-chain
   */
  public acceptAgreementOp(agreementId: number) {
    const args = [toScVal(agreementId, "u32")];
    return this.buildInvokeOperation("accept_agreement", args);
  }

  /**
   * Simulates calling `reject_agreement` on-chain
   */
  public rejectAgreementOp(agreementId: number) {
    const args = [toScVal(agreementId, "u32")];
    return this.buildInvokeOperation("reject_agreement", args);
  }

  /**
   * Simulates calling `propose_refund` on-chain
   */
  public proposeRefundOp(agreementId: number, refundAmount: number) {
    const args = [
      toScVal(agreementId, "u32"),
      toScVal(refundAmount, "u32"),
    ];
    return this.buildInvokeOperation("propose_refund", args);
  }

  /**
   * Simulates calling `resolve_dispute` on-chain
   */
  public resolveDisputeOp(agreementId: number, tenantSplit: number) {
    const args = [
      toScVal(agreementId, "u32"),
      toScVal(tenantSplit, "u32"),
    ];
    return this.buildInvokeOperation("resolve_dispute", args);
  }
}
