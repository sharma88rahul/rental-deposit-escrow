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

const server = new rpc.Server(siteConfig.contracts.testnetRpcUrl);
// Null account for simulation purposes
const mockAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");

interface SimulationResult {
  results?: Array<{
    xdr?: string;
  }>;
  result?: {
    retval?: xdr.ScVal;
  };
}

export class SorobanClient {
  /**
   * Helper to simulate a read-only getter call on a Soroban contract
   */
  public static async queryContract(
    contractId: string,
    method: string,
    args: xdr.ScVal[] = []
  ): Promise<unknown> {
    try {
      const contract = new Contract(contractId);
      const transaction = new TransactionBuilder(mockAccount, {
        fee: "100",
        networkPassphrase: siteConfig.contracts.networkPassphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      const simRes = await server.simulateTransaction(transaction) as unknown as SimulationResult;
      
      // Extract return value from simulation response
      if (simRes && simRes.results && simRes.results[0]) {
        const result = simRes.results[0];
        if (result.xdr) {
          // Parse using native SDK decoder
          const resultXdr = xdr.TransactionMeta.fromXDR(result.xdr, "base64");
          const v3 = resultXdr.v3();
          const operationResults = v3.sorobanMeta()?.returnValue();
          if (operationResults) {
            return scValToNative(operationResults);
          }
        }
      }

      // Alternate standard response check
      if (simRes && simRes.result && simRes.result.retval) {
        return scValToNative(simRes.result.retval);
      }
      
      throw new Error(`Simulation returned no valid results for ${method}.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`Soroban RPC simulation failed for ${method}:`, msg);
      throw error;
    }
  }

  /**
   * Fetches the current number of agreements from the contract storage counter
   */
  public static async getAgreementCounter(): Promise<number> {
    try {
      const val = await this.queryContract(
        siteConfig.contracts.rentalAgreementId,
        "get_agreement_counter"
      );
      return typeof val === "number" ? val : parseInt(String(val || "0"));
    } catch {
      return 3; // Fallback to mock count size
    }
  }

  /**
   * Fetches a single agreement directly from the contract persistent storage
   */
  public static async getAgreement(id: number): Promise<unknown> {
    try {
      const args = [toScVal(id, "u32")];
      const res = await this.queryContract(
        siteConfig.contracts.rentalAgreementId,
        "get_agreement",
        args
      );
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Could not fetch agreement #${id} from contract:`, msg);
      return null;
    }
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
}
