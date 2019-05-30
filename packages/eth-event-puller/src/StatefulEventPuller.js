import Log from 'stream-logger';
import EthBlock from 'eth-data';
import _ from 'lodash';

const log = new Log({component: "StatefulEventPuller"});

const MIN_BLOCK_RANGE = 100;

export default class StatefulEventPuller {
  constructor(props) {
    [
      'pullEvents'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  pullEvents(props, cb) {
    let cursor = new Cursor(props);
    return cursor.init(cb);
  }
}


class Cursor {
  constructor(props) {
    this.fromBlock = props.fromBlock;
    this.toBlock = props.toBlock;
    this.finalEnd = props.toBlock;
    this.increment = 0;
    this.contract = props.contract;
    this.eventName = props.eventName;
    this.options = props.options;
    this.totalPages = 1;
    this.meta = {
      rpcCalls: 0,
      fromBlock: 0,
      toBlock: 0
    };

    [
      'init',
      'nextBatch',
      '_pull'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  async init(cb) {
    return new Promise((done,err)=>{
      this._pull(done, err, cb);
    });
  }

  async nextBatch(cb) {
    return new Promise((done,err)=>{
      this._pull(done, err, cb);
    })
  }

  async _pull(done, err, cb) {
    let span = this.toBlock - this.fromBlock;

    if(span < 0) {
      log.error("Invalid block range. Start is before end", this.fromBlock, this.toBlock);
      //return err(new Error("Start block is after end block"));
      return done(undefined);
    }

    log.info("Querying", span, "blocks for logs in range", this.fromBlock, "-", this.toBlock);
    let config = {
      ...this.options,
      fromBlock: this.fromBlock,
      toBlock: this.toBlock
    };

    try {
      let contract = this.contract;

      let evtName = this.eventName || "allEvents";
      let start = Date.now();
      this.meta.rpcCalls++;
      this.meta.fromBlock = this.fromBlock;
      this.meta.toBlock = this.toBlock;
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
        let meta = {
          ...this.meta
        };
        for(let i=0;i<blocks.length;++i) {
          let b = blocks[i];
          //send back all transaction bundles

          await cb(null, b.transactions, meta);
        }
        this.meta = {
          rpcCalls: 0
        }
      } catch (e) {
        log.error("Problem in callback", e);
      }

      //if there is more in the entire block range
      log.debug("Final end",this.finalEnd,"Current end",this.toBlock);
      if(this.finalEnd > this.toBlock) {
        let start = this.toBlock + 1;
        if(this.increment < MIN_BLOCK_RANGE) {
          this.increment = MIN_BLOCK_RANGE;
        }
        let end = this.toBlock + 1 + this.increment;

        log.debug("Going to next segement", start, end);
        this.fromBlock = start;
        this.toBlock = Math.min(end, this.finalEnd);
        done(this);
      } else {
        log.debug("Finished all segments");
        //otherwise scan is complete
        done(undefined);
      }
    } catch (e) {


      //yes, hacky, but Infura docs specific have this as what to look
      //for to adjust block range
      if(e.message.includes("more than 1000 results")) {

        if(span <= 1) {
          //we've already reduced it as much as we can reduce
          //the span so have to bail out.
          throw e;
        }

        //otherwise, cut the span in 1/2 and try again
        let newSpan = Math.ceil(span/2)-0;

        //if wec can't split any lower than 1, we bail
        if(newSpan === 0) {
          throw e;
        }

        log.info("Have to split query apart", span, newSpan);
        let totalSpan = this.finalBlock - this.fromBlock;

        this.increment = newSpan;
        this.totalPages = Math.ceil(totalSpan / this.increment);
        this.toBlock = newSpan + this.fromBlock;
        this._pull(done, err, cb);
      } else {
        log.error("Problem pulling events", e);
        err(e);
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
