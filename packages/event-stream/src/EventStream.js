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

    this.address = props.address;
    this.web3 = props.web3;
    this.options = props.options;
    this.eventName = props.eventName;

    let abi = props.abi;
    if(!Array.isArray(abi)) {
      throw new Error("ABI is expected to be an array of field/event defs");
    }
    //creating a contract has a side-effect of adding abi signature to every
    //function/event definition. We need these later to extract the function
    //context of event bundles.
    this.contract = new this.web3.eth.Contract(abi, this.address, {address: this.address});

    this.normalizer = new EventNormalizer({
      abi,
      web3: this.web3
    });
    this.eventPuller = new EventPuller({
      abi,
      options: this.options,
      eventName: this.eventName,
      address: this.address,
      web3: this.web3,
      normalizer: this.normalizer
    });
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

  async start({fromBlock}) {
    if(fromBlock < 0) {
      fromBlock = 0;
    }

    console.log("Scanning from block", fromBlock);

    let cb = async (e, block) => {
      try {
        console.log("Received block", block);
        await this.router.process({}, block);
      } catch (e) {
        console.log("Problem routing data", e);
        this.emit("error", e);
      }
    };

    //first need to recover missed events since last run
    let latest = await this.web3.eth.getBlockNumber();
    let start = fromBlock;
    let span = latest - start;
    while(span > 0) {
      //keep trying until we've closed the gap with the latest
      //block
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
        console.log("Receiving new block", block.number);
        let start = lastBlock;
        lastBlock = block.blockNumber;
        await this.eventPuller.pullEvents({
          fromBlock: start,
          toBlock: block.blockNumber
        }, async (e, normalizedBlock)=>{
          try {
            await this.router.process({}, normalizedBlock);
          } catch (er) {
            this.emit("error", er);
          }
        });
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
