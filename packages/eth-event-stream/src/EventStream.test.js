import {EventStream} from './';
import EventEmitter from 'events';
import EthBlock from 'eth-data';

class MockContract {
  constructor(props) {
    this._eth = props.eth;
    [
      'getPastEvents'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  async getPastEvents(name, options) {
    let start = options.fromBlock;
    let end = options.toBlock;
    if(start > end) {
      return [];
    }
    let all = [];
    for(let i=start;i<=end;++i) {
      let block = this._eth.blocks[i];
      if(block) {
        block.transactions.forEach(b=>{
          all = [
            ...all,
            ...b.allEvents
          ];
          if(all.length > 1000) {
            throw new Error("more than 1000 results");
          }
        });
      }
    }
    return all;
  }

}


class MockEth {
  constructor(props={}) {
    this.Contract = (abi, address, options = {}) => {
      return new MockContract({abi, address, options, eth: this})
    };

    this.block = props.block || 1;
    this.blocks = {};

    [
      'subscribe',
      'getBlockNumber',
      'getBlock',
      '_addBlock'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  subscribe(evtName) {
    throw new Error("Subscriptions not supported");
  }

  async getBlockNumber() {
    return this.block;
  }

  async getBlock(num) {
    return this.blocks[num];
  }

  _addBlock(b) {
    this.blocks[b.number] = b;
    this.block = b.number;
  }
}

describe("EventStream", ()=>{
  it("Should route bundled txns", done=>{
    let abi = [
      {
        type: "function",
        name: "testFn",
        signature: "0x12345678"
      }
    ];
    let eth = new MockEth();

    let stream = new EventStream({
      abi,
      address: "0x123456789abcdef987654321fedcba",
      web3Factory: () => ({eth})
    });

    let block = new EthBlock({
      number: 1,
      timestamp: Math.floor(Date.now()/2)
    });

    block.addEvent({
      event: "FakeEvent",
      blockNumber: 1,
      transactionIndex: 0,
      transactionHash: "test-hash",
      returnValues: {
        field: "value"
      }
    });
    eth._addBlock(block);

    stream.use((ctx)=>{
      console.log("Bundle", ctx.transaction);
    });

    stream.start({
      fromBlock: 0,
      toBlock: 100
    }).then(()=>done());
  });
});
