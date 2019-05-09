import EventEmitter from 'events';
import EventNormalizer from './EventNormalizer';
import EventPuller from './EventPuller';
import Router from './Router';
import * as yup from 'yup';

const schema = yup.object().shape({
  web3: yup.object().required("Missing event stream web3"),
  address: yup.string().required("Missing contract address for event stream")
});

export default class EventStream extends EventEmitter {
  constructor(props) {
    super();
    schema.validateSync(props);

    //contract address to subscribe to
    this.address = props.address;

    //web3 impl
    this.web3 = props.web3;

    //event subscription options (filters mainly)
    this.options = props.options;

    //specific event to listen for
    this.eventName = props.eventName;

    //abi for decoding the events
    let abi = props.abi;
    if(!Array.isArray(abi)) {
      throw new Error("ABI is expected to be an array of field/event defs");
    }

    //creating a contract has a side-effect of adding abi signature to every
    //function/event definition. We need these later to extract the function
    //context of event bundles.
    this.contract = new this.web3.eth.Contract(abi, this.address, {address: this.address});

    //used to pull in transactions that bundle up all events emitted together
    this.normalizer = new EventNormalizer({
      abi,
      web3: this.web3
    });

    //utility to pull and decode the events
    this.eventPuller = new EventPuller({
      abi,
      options: this.options,
      eventName: this.eventName,
      address: this.address,
      web3: this.web3,
      normalizer: this.normalizer
    });

    //utility to distribute txns with bundled events
    this.router = new Router({errorHandler: e=>this.emit("error", e)});

    [
      'start',
      'use',
      'stop'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  use() {
    this.router.use(...arguments);
  }

  /**
   * Start the stream and start scanning from the fromBlock-toBlock range.
   * Be sure to install all router handlers  before starting the stream
   */
  async start({fromBlock, toBlock}) {
    if(fromBlock < 0) {
      fromBlock = 0;
    }

    //callback for event puller.
    let cb = async (e, block) => {
      try {
        console.log("Received block", block.number);
        //route the block to the router for handling
        await this.router.process({}, block);
      } catch (e) {
        console.log("Problem routing data", e);
        this.emit("error", e);
      }
    };

    //first need to recover missed events since last run
    let latest = toBlock;
    if(!latest) {
      //go to the top of the current chain by default
      latest = await this.web3.eth.getBlockNumber();
    }

    if(latest < fromBlock) {
      throw new Error("Start block must come before end block: " + fromBlock + " > " + latest);
    }

    let start = fromBlock;
    let span = latest - start;
    console.log("Scanning blocks", start,"-",latest);

    //while there is a gap in block scanning
    while(span > 0) {
      //pull all events for the span
      await this.eventPuller.pullEvents({
        fromBlock: start,
        toBlock: latest
      }, cb);

      //reset the start for next iteration
      start = latest+1;

      //grab the latest right now
      latest = await this.web3.eth.getBlockNumber();

      //compute new span
      span = latest - start;
    }

    console.log("Finished recovering past events");

    //now subscribe to new blocks and trigger event pulls on each
    //new block
    this.sub = this.web3.eth.subscribe("newBlockHeaders")
    let lastBlock = latest;
    this.sub.on("data", async (block)=>{
      if(block) {
        try {
          console.log("Receiving new block", block.number);
          //we start from the last block we pulled so that
          //if there are missing notifications we still pull
          //all the data
          let start = lastBlock;

          console.log("Pulling events between blocks",start,"-",block.number);
          await this.eventPuller.pullEvents({
            fromBlock: start,
            toBlock: block.number
          }, async (e, normalizedBlock)=>{
            if(normalizedBlock.transactions.length > 0) {
              lastBlock = normalizedBlock.number+1;
            }
            try {
              await this.router.process({}, normalizedBlock);
            } catch (er) {
              this.emit("error", er);
            }
          });
        } catch (er) {
          this.emit("error", er);
        }
      }
    });
  }

  async stop() {
    if(this.sub) {
      await this.sub.unsubscribe();
      this.sub = null;
    }
  }
}
