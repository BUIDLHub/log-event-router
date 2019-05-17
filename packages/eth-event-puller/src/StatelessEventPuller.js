import Log from 'stream-logger';
import EthBlock from 'eth-data';
import _ from 'lodash';

const log = new Log({component: "StatelessEventPuller"});

export default class StatelessEventPuller {
  constructor(props) {
    [
      'pullEvents',
      '_doPull'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  pullEvents({
    fromBlock,
    toBlock,
    contract,
    eventName,
    options
  }, cb) {
    return new Promise((done,err)=>{
      let ctx = {
        //starting block to pull events from
        start: fromBlock,

        //ending block range
        end: toBlock,

        //optional specific event name to pull
        eventName,

        //same options you can pass to contract getPastEvents
        options,

        //contract to pull events from
        contract,

        //all finished callback
        done,

        //any problems callback
        err,

        //any split increments to apply as we work towards end block
        increment: 0,

        //ultimately where to stop regardless of page splitting
        finalEnd: toBlock
      };

      this._doPull(ctx, cb);
    })
  }

  async _doPull(ctx, cb) {
    let span = ctx.end - ctx.start;
    if(span < 0) {
      log.error("Invalid block range. Start is before end");
      //return ctx.err(new Error("Start block is after end block"));
      return ctx.done();
    }

    log.info("Querying for logs in range", ctx.start, "-", ctx.end);
    let config = {
      ...ctx.options,
      fromBlock: ctx.start,
      toBlock: ctx.end
    };

    try {
      let contract = ctx.contract;

      let evtName = ctx.eventName || "allEvents";
      let start = Date.now();
      let events = await contract.getPastEvents(evtName, config);

      //always make sure events are sorted by block and txn index
      events.sort((a,b)=>{
        let diff = a.blockNumber - b.blockNumber;
        if(diff) {
          return diff;
        }
        return a.transactionIndex - b.transactionIndex;
      });

      //convert to consistent block structure
      let byBlock = byBlockAndHash(events);

      log.info("Retrieved", events.length, "events in", (Date.now()-start),"ms");

      try {

        let blocks = _.values(byBlock);
        log.debug("Sending", blocks.length, "blocks to callback");
        //for each block
        for(let i=0;i<blocks.length;++i) {
          let b = blocks[i];
          //send back all transaction bundles
          await cb(null, b.transactions);
        }
      } catch (e) {
        log.error("Problem in callback", e);
      }

      //if there is more in the entire block range
      if(ctx.finalEnd > ctx.end) {
        //split into sub-query
        let next = {
          ...ctx,

          //new start is 1 past current end
          start: ctx.end+1,

          //new end is next increment in range
          end: ctx.end + 1 + Math.ceil(ctx.increment)
        };

        log.debug("Going to next pull segment", next);
        return this._doPull(next, cb)
      } else {
        log.debug("Finished all segments");
        //otherwise scan is complete
        ctx.done();
      }

    } catch (e) {

      //yes, hacky, but Infura docs specific have this as what to look
      //for to adjust block range
      if(e.message.includes("more than 1000 results")) {
        log.info("Have to split query apart");
        if(span <= 1) {
          //we've already reduced it as much as we can reduce
          //the span so have to bail out.
          throw e;
        }
        //otherwise, cut the span in 1/2 and try again
        let newSpan = Math.ceil(span/2);

        //if wec can't split any lower than 1, we bail
        if(newSpan === 0) {
          throw e;
        }

        //recursive call to get new range
        return this._doPull({
          ...ctx,
          increment: newSpan,
          end: newSpan + ctx.start
        }, cb);
      } else {
        log.error("Problem pulling events", e);
        ctx.err(e);
      }
    }
  }
}

const byBlockAndHash = (events) => {
  return events.reduce((o,e)=>{
    let retVals = e.returnValues;
    _.keys(retVals).forEach(k=>{
      let d = retVals[k];
      if(d._ethersType === 'BigNumber') {
        retVals[k] = d.toString();
      }
    });
    let block = o[e.blockNumber] || new EthBlock({
      number: e.blockNumber
    });
    block.addEvent(e);
    o[e.blockNumber] = block;
    return o;
  },{});
}
