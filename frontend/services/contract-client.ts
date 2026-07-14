import {
  Contract,
  Address,
  xdr,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { siteConfig } from "@/config/site";

// Helper to convert native values to Soroban ScVal
export function toScVal(
  value: unknown,
  type?: "address" | "symbol" | "u32" | "u64" | "i128" | "u128" | "string"
): xdr.ScVal {
  if (type === "address") {
    return xdr.ScVal.scvAddress(Address.fromString(value as string).toScAddress());
  }
  if (type === "symbol") {
    return xdr.ScVal.scvSymbol(value as string);
  }
  if (type === "u32") {
    return xdr.ScVal.scvU32(Number(value));
  }
  if (type === "u64") {
    return xdr.ScVal.scvU64(new xdr.Uint64(BigInt(value as number)));
  }
  if (type === "i128" || type === "u128") {
    // Use nativeToScVal with explicit type hint so the SDK produces the correct ScvI128/ScvU128
    return nativeToScVal(BigInt(value as number), { type: type === "i128" ? "i128" : "u128" });
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
    // BytesN<32>: contract expects EXACTLY 32 bytes.
    // We generate 32 random bytes and encode them as scvBytes.
    // Buffer.write() of a UTF-8 string would produce wrong lengths —
    // instead we fill with random bytes which is a valid 32-byte identifier.
    const buf = Buffer.alloc(32);
    // Write up to 32 bytes of the metadataHash string as UTF-8, rest stays as 0-padding.
    // This is safe: buf.write returns bytes written, and alloc(32) zero-fills the rest.
    const hashBytes = Buffer.from(params.metadataHash, "utf8").subarray(0, 32);
    hashBytes.copy(buf);
    // Pad with random bytes if the string is shorter than 32 bytes to ensure
    // uniqueness across agreements (prevents hash collisions on short titles).
    if (hashBytes.length < 32) {
      const rand = Buffer.alloc(32 - hashBytes.length);
      for (let i = 0; i < rand.length; i++) {
        rand[i] = Math.floor(Math.random() * 256);
      }
      rand.copy(buf, hashBytes.length);
    }

    const metadataScVal = xdr.ScVal.scvBytes(buf);

    const args = [
      toScVal(params.landlord, "address"),
      toScVal(params.tenant, "address"),
      toScVal(params.token, "address"),
      // deposit_amount is i128 in the contract — must use {type:'i128'} to get ScvI128.
      // nativeToScVal(BigInt(n)) without a type hint produces ScvU64, which causes
      // WasmVm::InvalidAction (type mismatch panic) inside the contract WASM.
      nativeToScVal(BigInt(Math.round(params.depositAmount * 10_000_000)), { type: "i128" }),
      // duration is u64 in the contract
      nativeToScVal(BigInt(params.duration), { type: "u64" }),
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
      nativeToScVal(BigInt(agreementId), { type: "u64" }),     // agreement_id: u64
      nativeToScVal(BigInt(Math.round(refundAmount * 10_000_000)), { type: "i128" }), // refund_amount: i128
    ];
    return this.buildRentalInvokeOperation("request_refund", args);
  }

  /**
   * Simulates calling `resolve_dispute` on Rental Agreement Contract
   */
  public resolveDisputeOp(arbitrator: string, agreementId: number, tenantSplit: number) {
    const args = [
      toScVal(arbitrator, "address"),
      nativeToScVal(BigInt(agreementId), { type: "u64" }),       // agreement_id: u64
      nativeToScVal(BigInt(Math.round(tenantSplit * 10_000_000)), { type: "i128" }), // tenant split: i128
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
      nativeToScVal(BigInt(params.agreementId), { type: "u64" }), // agreement_id: u64
      toScVal(params.tenant, "address"),                          // tenant: Address
      toScVal(params.token, "address"),                           // token: Address
      nativeToScVal(BigInt(Math.round(params.amount * 10_000_000)), { type: "i128" }), // amount: i128
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
