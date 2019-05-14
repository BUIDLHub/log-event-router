import Bundler from './';
import _ from 'lodash';
import EthBlock from 'eth-data';

describe("TxnBundler", ()=>{
  it("Should bundle events into transactions", done=>{
    let count = 1;
    let block = new EthBlock();
    block.addEvent({
      event: "FakeEvent",
      transactionHash: "test-hash",
      transactionIndex: 0,
      returnValues: {
        field: "value"
      }
    });
    block.addEvent({
      event: "FakeEvent",
      transactionHash: "test-hash",
      transactionIndex: 0,
      returnValues: {
        field: "value2"
      }
    });

    let web3 = {
      getTransaction: async (hash) => {
        if(hash === 'test-hash') {
          return {
            status: true,
            input: '0x12345678'
          }
        }
        return null;
      }
    };

    let bundler = new Bundler();
    bundler.process({web3}, block.bundles[0])
    .then(txn=>{
      if(txn) {
        console.log("Txn", txn);
        let txnEvents = txn.logEvents["FakeEvent"];
        if(txnEvents.length != block.bundles[0].length) {
          return done("Expected " + block.bundles[0].length + " but received " + txnEvents.length);
        }
        done();
      }
    });
  });
});
