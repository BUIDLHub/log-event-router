import EventEmitter from 'events';
import Puller from 'eth-event-puller';
import EventHistory from './EventHistory';
import Router from './Router';
import * as yup from 'yup';
import Log from 'stream-logger';
import _ from 'lodash';

const schema = yup.object().shape({
  web3Factory: yup.object().required("Missing event stream web3 factory function"),
  address: yup.string().required("Missing contract address for event stream")
});

const log = new Log({component: "EventStream"});

const testWeb3 = async web3 => {
  let sub = this.web3.eth.subscribe("newBlockHeaders");
  await sub.unsubscribe();
}

export default class EventStream extends EventEmitter {
  constructor(props) {
    super();
    schema.validateSync(props);

    //contract address to subscribe to
    let address = props.address;

    this.web3Factory = props.web3Factory;
    if(typeof this.web3Factory !== 'function') {
      throw new Error("Web3 factory is not a function");
    }

    //abi for decoding the events
    let abi = props.abi;
    if(!Array.isArray(abi)) {
      throw new Error("ABI is expected to be an array of field/event defs");
    }

    //web3 for setup
    let web3 = this.web3Factory();

    //creating a contract has a side-effect of adding abi signature to every
    //function/event definition. We need these later to extract the function
    //context of event bundles.
    this.contract = new web3.eth.Contract(abi, address, {address: address});

    //to recover historical data
    this.eventHistory = props.eventHistory || new EventHistory();

    //to pull current events
    this.eventPuller = props.eventPuller || new Puller();

    //utility to distribute txns with bundled events
    this.router = new Router({errorHandler: e=>this.emit("error", e)});
    [
      'start',
      'use',
      'stop',
      '_handleBlockBundles'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  use() {
    this.router.use(...arguments);
  }

  /**
   * Start the stream and start scanning from the fromBlock-toBlock range.
   * Be sure to install all router handlers  before starting the stream
   */
  async start({
    fromBlock,
    toBlock,
    eventName,
    options
  }) {
    if(fromBlock < 0) {
      fromBlock = 0;
    }

    let web3 = this.web3Factory();
    //see if we can subscribe
    try {
      await testWeb3(web3);
    } catch (e) {
      this.pollWeb3 = true;
    }

    //first need to recover missed events since last run
    let latest = toBlock;
    if(!latest) {
      //go to the top of the current chain by default
      latest = await web3.eth.getBlockNumber();
    }

    if(latest < fromBlock) {
      throw new Error("Start block must come before end block: " + fromBlock + " > " + latest);
    }

    let start = fromBlock;
    let span = latest - start;
    log.debug("Scanning blocks", start,"-",latest);
    let s = Date.now();

    //while there is a gap in block scanning
    while(span > 0) {
      //pull all events for the span
      await this.eventHistory.recoverEvents({
        fromBlock: start,
        toBlock: latest,
        eventName,
        options,
        contract: this.contract
      }, (e, bundles)=>this._handleBlockBundles(e, {web3}, bundles));

      log.info("Finished recovering batch of events...");

      //reset the start for next iteration
      start = latest+1;

      //grab the latest right now
      latest = await web3.eth.getBlockNumber();

      //compute new span
      span = latest - start;
      log.info("New end block is", latest, "and new span is", span);
    }

    log.info("Finished recovering past events in", (Date.now()-s),"ms");
    let lastBlock = latest;

    let subHandler = async (block)=>{
      if(block) {
        try {
          log.info("Receiving new block", block.number);
          //we start from the last block we pulled so that
          //if there are missing notifications we still pull
          //all the data
          let start = lastBlock+1;
          if(start < block.number) {
            log.debug("Pulling events between blocks",start,"-",block.number);
            await this.eventPuller.pullEvents({
              fromBlock: start,
              toBlock: block.number,
              eventName,
              options,
              contract: this.contract
            }, (e, bundles)=>{
              if(bundles.length > 0) {
                let hi = lastBlock;
                bundles.forEach(b=>{
                  if(b.blockNumber > hi) {
                    hi = b.blockNumber;
                  }
                });
                lastBlock = hi;
              }
              this._handleBlockBundles(e, {web3}, bundles)
            });
          }
        } catch (er) {
          this.emit("error", er);
        }
      }
    };

    this.sub = new SubManager({
      web3Factory: this.web3Factory,
      startBlock: lastBlock+1,
      handler: subHandler,
      pollWeb3: this.pollWeb3
    });

    //now subscribe to new blocks and trigger event pulls on each
    //new block
    this.sub.start();
  }

  async stop() {
    if(this.sub) {
      await this.sub.unsubscribe();
      this.sub = null;
    }
  }

  async _handleBlockBundles(e, ctx, bundles) {
    if(bundles) {
      log.debug("Getting",bundles.length,"bundles in stream callback");
      for(let i=0;i<bundles.length;++i) {
        try {
          await this.router.process(ctx, bundles[i]);
        } catch (e) {
          log.error("Problem routing bundle", e);
        }
      }
    }
  }
}


const POLL_PERIOD = 15000;
class SubManager {
  constructor(props) {
    this.web3Factory = props.web3Factory;
    this.startBlock = props.startBlock;
    this.pollWeb3 = props.pollWeb3;
    this.handler = props.handler;
    [
      'start',
      'unsubscribe',
      '_startPoll'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  start() {
    if(this.pollWeb3) {
      return this._startPoll();
    }

    log.info("Using new block subscriptions");
    this.web3 = this.web3Factory();
    this.sub = this.web3.eth.subscribe("newBlockHeaders")
    this.sub.on("data", this.handler);
  }

  async unsubscribe() {
    if(this.sub) {
      await this.sub.unsubscribe();
      this.sub = null;
    } else if(this.toID) {
      clearInterval(this.toID);
      this.toID = null;
    }
  }

  _startPoll() {
    log.info("Using polling to get new blocks");

    let running = false;
    let poll = async () => {

      running = true;
      let web3 = this.web3Factory();
      let latest = await web3.eth.getBlockNumber();
      try {
        log.info("Getting new blocks from", this.startBlock,"to",latest);

        if(latest === this.startBlock) {
          return;
        }
        let block = await web3.eth.getBlock(latest);
        if(block) {
          this.startBlock = latest;
          try {
            await this.handler(block);
          } catch (e) {
            log.error("Problem calling subscription handler", e);
          }
        }

        /*
        for(let i=this.startBlock;i<=latest;++i) {
          let block = await web3.eth.getBlock(i);
          this.startBlock = i+1;
          try {
            await this.handler(block);
          } catch (e) {
            log.error("Problem calling subscription handler", e);
          }
        }
        */
      } finally {
        running = false;
      }
    }

    this.toID = setInterval(async ()=>{
      if(!running) {
        await poll()
      }
    }, POLL_PERIOD);
  }
}
