import EthBlock from './';
import _ from 'lodash';

describe("EthBlock", ()=>{
  it("Should properly organize events", done=>{
    let block = new EthBlock();
    block.addEvent({
      event: "FakeEvent",
      transactionHash: "hash1",
      transactionIndex: 0,
      returnValues: {
        field: "value1"
      }
    });
    block.addEvent({
      event: "FakeEvent",
      transactionHash: "hash1",
      transactionIndex: 0,
      returnValues: {
        field: "value2"
      }
    });
    block.addEvent({
      event: "AnotherEvent",
      transactionHash: "hash2",
      transactionIndex: 0,
      returnValues: {
        other: "value3"
      }
    });

    let txns = block.transactions;
    if(txns.length !== 2){
      done("Expected 2 txns but found " + txns.length);
    }
    for(let i=0;i<txns.length;++i) {
      let t = txns[i];
      if(t.transactionHash === 'hash1') {
        if(t.allEvents.length !== 2) {
          return done("Expected 2 events in first txn: " + t.allEvents.length);
        }
      } else {
        if(t.allEvents.length !== 1) {
          return done("Expected 1 event in second bundle: " + t.allEvents.length);
        }
      }
    }
    done();
  });
});
