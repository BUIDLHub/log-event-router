import {StatefulEventPuller} from 'eth-event-puller';
import * as yup from 'yup';

const schema = yup.object().shape({
  abi: yup.array().required("Missing ABI"),
  address: yup.string().required("Missing contract address"),
  rangeStart: yup.number().required("Missing block range start"),
  rangeEnd: yup.number().required("Missing block range end"),
  refreshRate: yup.number().required("Missing callback refresh rate")
});

export default class AppSyncRunner {
  constructor(props) {
    schema.validateSync(props);
    this.abi = props.abi;
    this.address = props.address;
    this.web3Factory = props.web3Factory;
    this.fromBlock = props.rangeStart-0;
    this.toBlock = props.rangeEnd-0;
    this.includeTxn = props.includeTxn;
    this.includeTime = props.includeTimestamp;
    this.refreshRate = props.refreshRate-0;
    this.puller = new StatefulEventPuller();
    this.batch = [];
    this.history = {};

    [
      'start',
      'stop'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  start(cb) {
    this.running = true;
    this.history = {};
    this.meta = {
      rpcCalls: 0
    };
    return new Promise(async (done,err)=>{
      try {
        let web3 = this.web3Factory();
        this.startBlock = await web3.eth.getBlock(this.fromBlock);
        this.endBlock = await web3.eth.getBlock(this.toBlock);

        let con = new web3.eth.Contract(this.abi, this.address,{address: this.address});
        let handler = async (e,txns, meta)=>{

          if(meta.toBlock !== this.meta.toBlock) {
            this.meta.rpcCalls += meta.rpcCalls;
            this.meta.fromBlock = meta.fromBlock;
            this.meta.toBlock = meta.toBlock;
          }


          for(let i=0;i<txns.length;++i) {
            if(!this.running) {
              break;
            }
            let txn = txns[i];
            if(this.history[txn.transactionHash]) {
              cb(new Error("Duplicate txn detected"));
              continue;
            }
            this.history[txn.transactionHash] = true;

            if(this.includeTime) {
              this.meta.rpcCalls++;
              let block = await web3.eth.getBlock(txn.blockNumber);
              txn.timestamp = block.timestamp;
            }
            if(this.includeTxn) {
              this.meta.rpcCalls++;
              let rec = await web3.eth.getTransactionReceipt(txn.transactionHash);
              if(rec) {
                txn.receipt = rec;
              }
            }
            this.batch.push(txn);
            if(this.batch.length >= this.refreshRate) {
              await cb(null, this.batch, this.meta);
              this.batch = [];
              this.meta.rpcCalls = 0;
            }
          }
          if(!this.running && this.batch.length > 0) {
            await cb(null, this.batch, this.meta);
            this.batch = [];
            this.meta.rpcCalls = 0;
          }
        }

        let cursor = await this.puller.pullEvents({
          contract: con,
          fromBlock: this.fromBlock,
          toBlock: this.toBlock
        }, handler);
        let c = cursor;
        while(this.running && c) {
          c = await cursor.nextBatch(handler);
        }
        if(this.batch.length > 0) {
          await cb(null, this.batch, this.meta);
          this.batch = [];
          this.meta.rpcCalls = 0;
        }
        done();
      } catch (e) {
        this.running = false;
        if(this.batch.length > 0) {
          await cb(null, this.batch, this.meta);
          this.batch = [];
        }
        err(e);
      }
    });
  }

  stop() {
    this.running = false;
  }
}
