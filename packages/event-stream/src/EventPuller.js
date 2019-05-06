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
      console.log("Retrieved", events.length,"events in",(Date.now()-start),"ms");

      //make sure we're sorted by ascending block number
      events.sort((a,b)=>{
        return a.blockNumber - b.blockNumber
      });

      //now with sorted blocks, we can normalize and then announce based on
      //block changes
      let block = events.length>0?events[0].blockNumber:0;
      let currentBlock = {
        blockNumber: block,
        transactions: []
      };

      for(let i=0;i<events.length;++i) {
        let evt = events[i];

        if(evt.blockNumber !== block) {
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
            blockNumber: evt.blockNumber,
            transactions: []
          };
          ctx.history = {};
          block = evt.blockNumber;
        }
        await this.normalizer.normalize(evt,ctx.history);
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

      if(ctx.finalEnd !== ctx.end) {
        //means we had to split into sub-queries
        return this._doStart({
          ...ctx,
          end: Math.ceil(ctx.increment) + ctx.start
        }, cb)
      } else {
        ctx.done();
      }
    } catch (e) {
      if(e.message.includes("more than 1000 results")) {
        if(span <= 1) {
          //we've already reduced it as much as we can reduce
          //the span so have to bail out.
          throw e;
        }
        //otherwise, cut the span in 1/2 and try again
        return this._doStart({
          ...ctx,
          increment: span,
          end: Math.ceil(span/2) + ctx.start
        }, cb);
      }
    }
  }
}
