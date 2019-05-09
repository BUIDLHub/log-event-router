import * as yup from 'yup';
import _ from 'lodash';

const schema = yup.object().shape({
  address: yup.string().required("Missing contract address"),
  web3: yup.object().required("Missing web3"),
  normalizer: yup.object().required("Missing event normalizer")
});

export default class EventPuller {
  constructor(props) {
    schema.validateSync(props);
    this.abi = props.abi;
    this.web3 = props.web3;
    this.options = props.options;
    this.eventName = props.eventName;
    this.normalizer = props.normalizer;
    this.address = props.address;
    this.contract = new this.web3.eth.Contract(this.abi, this.address, {address: this.address});
    [
      'pullEvents',
      '_doPull'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  pullEvents({fromBlock, toBlock}, cb) {
    return new Promise(async (done,err)=>{
      let ctx = {
        start: fromBlock,
        end: toBlock,
        history: {},
        increment: 0,
        finalEnd: toBlock,
        done,
        err
      };
      this._doPull(ctx, cb);
    });
  }

  async _doPull(ctx, cb) {
    let span = ctx.end - ctx.start;
    console.log("Querying for logs in range", ctx.start, "-", ctx.end);
    let config = {
      ...this.options,
      fromBlock: ctx.start,
      toBlock: ctx.end,
      address: this.address
    };

    try {
      let evtName = this.eventName || "allEvents";
      let start = Date.now();
      let events = await this.contract.getPastEvents(evtName, config);
      console.log("Retrieved", events.length, "events in", (Date.now()-start),"ms");

      //make sure we're sorted by ascending block number
      events.sort((a,b)=>{
        return a.blockNumber - b.blockNumber
      });

      //now with sorted blocks, we can normalize and then announce based on
      //block changes
      let block = events.length>0?events[0].blockNumber:0;
      let fromChain = await this.web3.eth.getBlock(block);
      let currentBlock = {
        number: block,
        transactions: [],
        timestamp: fromChain
      };

      for(let i=0;i<events.length;++i) {
        let evt = events[i];
        evt.timestamp = currentBlock.timestamp;

        if(evt.blockNumber !== block) {
          fromChain = await this.web3.eth.getBlock(evt.blockNumber);

          //new block, convert what we've built up to transaction set
          currentBlock.transactions = _.values(ctx.history);
          //ordered by txn index
          currentBlock.transactions.sort((a,b)=>{
            return a.transactionIndex - b.transactionIndex
          });
          try {
            await cb(null, currentBlock);
          } catch (e) {
            console.log("Problem sending event block to callback", e);
          }
          currentBlock = {
            number: evt.blockNumber,
            transactions: [],
            timestamp: fromChain.timestamp
          };
          ctx.history = {};
          block = evt.blockNumber;
        }
        try {
          console.log("Normalizing event's transaction from block: " + evt.blockNumber);
          await this.normalizer.normalize(evt,ctx.history);
          console.log("Txn normalized");
        } catch (e) {
          console.log("Problem normalizing", e);
        }

      }

      if(_.values(ctx.history).length > 0) {
        //new block, convert what we've built up to transaction set
        currentBlock.transactions = _.values(ctx.history);
        //ordered by txn index
        currentBlock.transactions.sort((a,b)=>{
          return a.transactionIndex - b.transactionIndex
        });
        try {
          await cb(null, currentBlock);
        } catch (e) {
          console.log("Problem sending event block to callback", e);
        }
      }

      if(ctx.finalEnd > ctx.end) {
        //means we had to split into sub-queries
        let next = {
          ...ctx,
          start: ctx.end+1,
          end: ctx.end + 1 + Math.ceil(ctx.increment)
        };
        console.log("Going to next pull segment", next);
        return this._doPull(next, cb)

      } else {
        console.log("Finished all segments");
        ctx.done();
      }

    } catch (e) {
      if(e.message.includes("more than 1000 results")) {
        console.log("Have to split query apart");
        if(span <= 1) {
          //we've already reduced it as much as we can reduce
          //the span so have to bail out.
          throw e;
        }
        //otherwise, cut the span in 1/2 and try again
        let newSpan = Math.ceil(span/2);
        if(newSpan === 0) {
          throw e;
        }

        if(newSpan + ctx.start === ctx.start) {
          throw e;
        }

        return this._doPull({
          ...ctx,
          increment: newSpan,
          end: newSpan + ctx.start
        }, cb);
      } else {
        console.log("Problem pulling events", e);
        ctx.err(e);
      }
    }
  }
}
