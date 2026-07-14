import {
  rpc,
  TransactionBuilder,
  Account,
  Contract,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { siteConfig } from "@/config/site";
import { toScVal } from "./contract-client";
import { Transaction, TransactionStatus } from "@/types";

const server = new rpc.Server(siteConfig.contracts.testnetRpcUrl);

export class SorobanClient {
  /**
   * Simulate a read-only getter call on a Soroban contract.
   *
   * FORENSIC NOTE — The Stellar SDK's simulateTransaction() returns a PARSED
   * response object. On success it has `result.retval` (an xdr.ScVal).
   * On error it has `error` (a string). There is NO `results` array in the
   * parsed response — that was a raw-response field that the SDK collapses into
   * `result.retval` via parseRawSimulation(). Using TransactionMeta.fromXDR()
   * on that field was incorrect and is proven wrong by reading
   * @stellar/stellar-sdk/lib/rpc/parsers.js:
   *   retval: row.xdr ? ScVal.fromXDR(row.xdr, "base64") : ScVal.scvVoid()
   */
  public static async queryContract(
    contractId: string,
    method: string,
    args: xdr.ScVal[] = []
  ): Promise<unknown> {
    const contract = new Contract(contractId);
    const transaction = new TransactionBuilder(
      new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
      {
        fee: "100",
        networkPassphrase: siteConfig.contracts.networkPassphrase,
      }
    )
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    console.log(`[SorobanClient.queryContract] Simulating ${method} on ${contractId.slice(0, 8)}...`);
    const simRes = await server.simulateTransaction(transaction);

    // The SDK signals a contract/simulation error via the `error` string field.
    if (rpc.Api.isSimulationError(simRes)) {
      const errStr = (simRes as rpc.Api.SimulateTransactionErrorResponse).error;
      console.warn(`[SorobanClient.queryContract] Simulation ERROR for ${method}:`, errStr);
      throw new Error(errStr);
    }

    // On success the SDK puts the decoded return value in result.retval.
    const successSim = simRes as rpc.Api.SimulateTransactionSuccessResponse;
    if (successSim.result?.retval) {
      const native = scValToNative(successSim.result.retval);
      console.log(
        `[SorobanClient.queryContract] ${method} retval switch=${successSim.result.retval.switch().name} native=`,
        JSON.stringify(native, (k, v) => typeof v === "bigint" ? v.toString() : v)
      );
      return native;
    }

    console.warn(`[SorobanClient.queryContract] ${method} returned void / no result.`);
    throw new Error(`Simulation returned no result for ${method}.`);
  }

  /**
   * Fetch a single agreement from contract persistent storage.
   * Returns null ONLY when the contract signals the record is absent.
   * Re-throws genuine network errors so the caller can surface them.
   */
  public static async getAgreement(id: number): Promise<unknown> {
    console.log(`[SorobanClient.getAgreement] Querying id=${id} (u64)`);
    try {
      const args = [toScVal(id, "u64")];
      const res = await this.queryContract(
        siteConfig.contracts.rentalAgreementId,
        "get_agreement",
        args
      );
      console.log(`[SorobanClient.getAgreement] id=${id} result:`, JSON.stringify(res, (k, v) => typeof v === "bigint" ? v.toString() : v));
      return res;
    } catch (err: unknown) {
      const msg = String(err instanceof Error ? err.message : err);
      // These signal that the agreement slot simply does not exist → stop scan.
      // Contract Error #4 represents AgreementNotFound (as defined in types.rs).
      const isNotFound =
        msg.includes("MissingValue") ||
        msg.includes("AgreementNotFound") ||
        msg.includes("not found") ||
        msg.includes("NotInitialized") ||
        msg.includes("Error(Contract, #4)") ||
        msg.includes("#4");
      if (isNotFound) {
        console.log(`[SorobanClient.getAgreement] id=${id} → not found (scan stop): ${msg}`);
        return null;
      }
      // Genuine network / RPC error — propagate.
      console.error(`[SorobanClient.getAgreement] id=${id} → network error:`, msg);
      throw err;
    }
  }

  /**
   * Build, simulate, prepare, sign (via Freighter), send, and poll a
   * Soroban transaction to completion.
   *
   * @param operation   xdr.Operation built by ContractClient
   * @param sourceAddress  Connected wallet G-address
   * @param signFn      Async fn: XDR string → signed XDR string (Freighter)
   */
  public static async submitSorobanTransaction(
    operation: xdr.Operation,
    sourceAddress: string,
    signFn: (xdrToSign: string) => Promise<string>
  ): Promise<{ hash: string; returnValue: xdr.ScVal | undefined }> {
    // 1. Load real on-chain account sequence
    console.log(`[SorobanClient.submit] Loading account ${sourceAddress.slice(0, 8)}...`);
    const account = await server.getAccount(sourceAddress);

    // 2. Build transaction envelope
    const tx = new TransactionBuilder(account, {
      fee: "1000000", // 0.1 XLM max fee — Soroban requires higher fees
      networkPassphrase: siteConfig.contracts.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(300)
      .build();

    // 3. Simulate to catch contract errors early and obtain resource footprint
    console.log(`[SorobanClient.submit] Simulating...`);
    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      const errMsg = (simResult as rpc.Api.SimulateTransactionErrorResponse).error;
      console.error(`[SorobanClient.submit] Simulation FAILED:`, errMsg);
      throw new Error(`Contract simulation failed: ${errMsg}`);
    }

    // 4. Prepare — SDK injects SorobanData (footprint + auth entries)
    console.log(`[SorobanClient.submit] Preparing transaction...`);
    const preparedTx = await server.prepareTransaction(tx);
    const preparedXdr = preparedTx.toXDR();
    console.log(`[SorobanClient.submit] Prepared XDR length: ${preparedXdr.length}`);

    // 5. Sign via Freighter
    console.log(`[SorobanClient.submit] Requesting wallet signature...`);
    const signedXdr = await signFn(preparedXdr);
    if (!signedXdr) throw new Error("Wallet returned empty signed XDR.");
    console.log(`[SorobanClient.submit] Signed XDR received.`);

    // 6. Broadcast
    const signedTx = TransactionBuilder.fromXDR(
      signedXdr,
      siteConfig.contracts.networkPassphrase
    );
    const sendResult = await server.sendTransaction(signedTx);
    const hash = sendResult.hash;
    console.log(`[SorobanClient.submit] Broadcast hash=${hash} status=${sendResult.status}`);

    if (sendResult.status === "ERROR") {
      let details = "";
      const rawSend = sendResult as any;
      const errorResult = rawSend.errorResult || rawSend.errorResultXdr;
      if (errorResult) {
        try {
          const txResult = typeof errorResult === "string"
            ? xdr.TransactionResult.fromXDR(errorResult, "base64")
            : errorResult;
          details = ` ResultCode: ${txResult.result().switch().name}`;
        } catch (e) {
          details = ` Error: ${String(errorResult)}`;
        }
      }
      throw new Error(`Transaction broadcast failed (status: ERROR, hash: ${hash}).${details}`);
    }

    // 7. Poll until SUCCESS or FAILED (max 60 s / 30 attempts × 2 s)
    let txResult: rpc.Api.GetTransactionResponse;
    let attempts = 0;
    do {
      await new Promise((r) => setTimeout(r, 2000));
      txResult = await server.getTransaction(hash);
      attempts++;
      console.log(`[SorobanClient.submit] Poll ${attempts}: ${txResult.status} (hash: ${hash})`);
    } while (
      txResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
      attempts < 30
    );

    if (txResult.status === rpc.Api.GetTransactionStatus.FAILED) {
      let details = "";
      const failedTx = txResult as any;
      if (failedTx.resultXdr) {
        try {
          const txResultParsed = xdr.TransactionResult.fromXDR(failedTx.resultXdr, "base64");
          details = ` ResultCode: ${txResultParsed.result().switch().name}`;
        } catch (e) {
          details = ` XDR: ${failedTx.resultXdr}`;
        }
      }
      throw new Error(`Transaction FAILED on-chain (hash: ${hash}).${details}`);
    }
    if (txResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error(
        `Transaction timed out (hash: ${hash}, status: ${txResult.status})`
      );
    }

    console.log(`[SorobanClient.submit] SUCCESS (hash: ${hash})`);
    const successTx = txResult as rpc.Api.GetSuccessfulTransactionResponse;
    return { hash, returnValue: successTx.returnValue };
  }

  /**
   * Fetch live contract event logs starting from ledger sequence 100
   */
  public static async fetchLiveEvents(): Promise<unknown[]> {
    try {
      const response = await server.getEvents({
        startLedger: 100,
        filters: [
          {
            type: "contract",
            contractIds: [
              siteConfig.contracts.rentalAgreementId,
              siteConfig.contracts.escrowId,
            ],
          },
        ],
        limit: 10,
      });

      return response.events || [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Could not fetch events from Soroban RPC:", msg);
      return [];
    }
  }

  /**
   * Fetch live account transaction history logs from Horizon
   */
  public static async fetchHorizonTransactions(publicKey: string): Promise<Transaction[]> {
    try {
      const res = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${publicKey}/transactions?limit=10&order=desc`
      );
      if (!res.ok) return [];
      const data = await res.json() as {
        _embedded?: {
          records?: Array<{
            hash: string;
            memo?: string;
            fee_charged: string;
            source_account: string;
            created_at: string;
          }>;
        };
      };
      const records = data._embedded?.records || [];
      return records.map((r) => ({
        hash: r.hash.substring(0, 10) + "..." + r.hash.substring(r.hash.length - 4),
        type: r.memo || "Stellar Transaction",
        status: "Confirmed" as TransactionStatus,
        fee: `${(parseInt(r.fee_charged) / 10000000).toFixed(5)} XLM`,
        timestamp: r.created_at,
        walletUsed:
          r.source_account.substring(0, 8) +
          "..." +
          r.source_account.substring(r.source_account.length - 4),
      }));
    } catch (err) {
      console.warn("Horizon transaction fetch failed:", err);
      return [];
    }
  }
}
