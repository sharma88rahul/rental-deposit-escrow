const { rpc, Contract, TransactionBuilder, Account, scValToNative, xdr } = require('@stellar/stellar-sdk');
const server = new rpc.Server('https://soroban-testnet.stellar.org');

const RENTAL_CONTRACT_ID = 'CC32FLXF5AQUBFRFRQBBUAXUDFXUSQIQ6DFCK6OOUTQXDTLANUKI5OOE';

async function test() {
  console.log('Querying contract:', RENTAL_CONTRACT_ID);
  let id = 1;
  while (true) {
    try {
      console.log(`Querying ID: ${id}`);
      const contract = new Contract(RENTAL_CONTRACT_ID);
      const args = [xdr.ScVal.scvU64(new xdr.Uint64(BigInt(id)))];
      const tx = new TransactionBuilder(
        new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
        { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
      )
        .addOperation(contract.call('get_agreement', ...args))
        .setTimeout(30)
        .build();

      const simRes = await server.simulateTransaction(tx);
      if (simRes.result && simRes.result.retval) {
        const item = scValToNative(simRes.result.retval);
        console.log(`ID ${id} Raw:`, item);
        
        // Let's test the parsing logic
        const parseContractStatus = (rawStatus) => {
          if (typeof rawStatus === 'number') {
            const statuses = ['Draft', 'Created', 'Accepted', 'DepositLocked', 'LeaseActive', 'RefundRequested', 'Approved', 'FundsReleased', 'DisputeRaised', 'Resolved'];
            return statuses[rawStatus] || 'Created';
          }
          return String(rawStatus);
        };

        const parseMetadataHash = (rawHash) => {
          if (rawHash && (typeof rawHash === 'object' || rawHash instanceof Uint8Array)) {
            try {
              return Buffer.from(rawHash).toString('utf8').replace(/\0+$/, '');
            } catch (e) {
              return String(rawHash);
            }
          }
          return String(rawHash);
        };

        const stroopsToXlm = (stroops) => {
          const n = BigInt(String(stroops));
          const divisor = BigInt(10000000);
          const whole = n / divisor;
          const frac = n % divisor;
          if (frac === BigInt(0)) return whole.toString();
          return whole.toString() + '.' + frac.toString().padStart(7, '0').replace(/0+$/, '');
        };

        const parsed = {
          id: Number(item.id),
          landlord: String(item.landlord),
          tenant: String(item.tenant),
          token: String(item.token),
          depositAmount: stroopsToXlm(item.deposit_amount),
          duration: Number(item.duration),
          status: parseContractStatus(item.status),
          metadataHash: parseMetadataHash(item.metadata_hash),
          refundRequestedAmount: stroopsToXlm(item.refund_requested_amount),
          createdAt: new Date().toISOString(),
        };
        console.log(`ID ${id} Parsed:`, parsed);
        id++;
      } else {
        console.log(`ID ${id} returned no retval (simulation response):`, simRes);
        break;
      }
    } catch (e) {
      console.error(`ID ${id} threw error:`, e.message || e);
      break;
    }
  }
}

test().catch(console.error);
