import Log from 'stream-logger';
import EthBlock from 'eth-data';
import _ from 'lodash';

const log = new Log({component: "EventPuller"});

export default class EventPuller {
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
        start: fromBlock,
        end: toBlock,
        eventName,
        options,
        contract,
        done,
        err,
        increment: 0,
        finalEnd: toBlock
      };
      this._doPull(ctx, cb);
    })
  }

  async _doPull(ctx, cb) {
    let span = ctx.end - ctx.start;
    log.info("Querying for logs in range", ctx.start, "-", ctx.end);
    let config = {
      ...ctx.options,
      fromBlock: ctx.start,
      toBlock: ctx.end,
      address: this.address
    };

    try {
      let contract = ctx.contract;

      let evtName = ctx.eventName || "allEvents";
      let start = Date.now();
      let events = await contract.getPastEvents(evtName, config);
      events.sort((a,b)=>{
        let diff = a.blockNumber - b.blockNumber;
        if(diff) {
          return diff;
        }
        return a.transactionIndex - b.transactionIndex;
      });

      let byBlock = byBlockAndHash(events);

      log.info("Retrieved", events.length, "events in", (Date.now()-start),"ms");

      try {
        log.debug("ByBlock", byBlock);

        let blocks = _.values(byBlock);
        log.debug("Sending", blocks.length, "blocks to callback");
        for(let i=0;i<blocks.length;++i) {
          let b = blocks[i];
          await cb(null, b.bundles);
        }
      } catch (e) {
        log.error("Problem in callback", e);
      }

      if(ctx.finalEnd > ctx.end) {
        //means we had to split into sub-queries
        let next = {
          ...ctx,
          start: ctx.end+1,
          end: ctx.end + 1 + Math.ceil(ctx.increment)
        };
        log.debug("Going to next pull segment", next);
        return this._doPull(next, cb)

      } else {
        log.debug("Finished all segments");
        ctx.done();
      }

    } catch (e) {
      log.error("Problem in event puller", e);
      
      if(e.message.includes("more than 1000 results")) {
        log.info("Have to split query apart");
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
