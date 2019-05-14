import EthBlock from './';

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

    let bundles = block.bundles;
    if(bundles.length !== 2){
      done("Expected 2 bundles but found " + bundles.length);
    }
    for(let i=0;i<bundles.length;++i) {
      let b = bundles[i];
      if(b.transactionHash === 'hash1') {
        if(b.allEvents.length !== 2) {
          return done("Expected 2 events in first bundle: " + b.allEvents.length);
        }
        if(b.length !== 2) {
          return done("Length is invalid for bundle: " + b.length + " != 2");
        }
      } else {
        if(b.allEvents.length !== 1) {
          return done("Expected 1 event in second bundle: " + b.allEvents.length);
        }
        if(b.length !== 1) {
          return done("Length is invalid 1-item bundle: " + b.length);
        }
      }
    }
    done();
  });
});
