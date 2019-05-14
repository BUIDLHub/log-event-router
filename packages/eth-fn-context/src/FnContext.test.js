import EthBlock from 'eth-data';
import FnContext from './';

describe("FnContext", ()=>{
  it("Should add fn context from ABI", done=>{
    let abi = [
      {
        type: "function",
        name: "testFn",
        signature: "0x12345678"
      }
    ];
    let fnCtx = new FnContext({abi});
    let block = new EthBlock();
    block.addEvent({
      event: "FakeEvent",
      transactionHash: "hash1",
      returnValues: {
        field: "value"
      }
    });
    block.bundles[0].input = "0x12345678000000010101000101";

    fnCtx.process({}, block.bundles[0])
    .then(bundle=>{
      if(bundle.fnContext !== 'testFn') {
        done("Function context was not appended to bundle");
      }
      done();
    })
  });
});
