const randomColor = require('randomcolor');
const axios = require('axios');

const NETWORK = 'mainnet';
const CONTRACT = "0x06012c8cf97bead5deae237070f9587f8e7a266d";
const BASE_ABI_URL = "https://api.etherscan.io/api?module=contract&action=getabi&address=";

class KittyAppStateStore {

  constructor() {
    this.session = {};
    this.callbacks = [];
    this.exportState = this.exportState.bind(this);
    this.loadState = this.loadState.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.getConfig = this.getConfig.bind(this);
    this._invokeSubscribers = this._invokeSubscribers.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.initializeState();
  }

  subscribe(callback) {
    this.callbacks.push(callback);
  }

  _invokeSubscribers() {
    this.callbacks.forEach((callback) => {
      callback.apply();
    })
  }

  async _fetchABI(address) {
    let abiUrl = BASE_ABI_URL + CONTRACT;

    let r = await axios.get(abiUrl);
    let res = r.data ? r.data.result : null;
    if (!res) {
      throw new Error(`unable to fetch ABI from ${abiUrl}`);
    }

    let abi = res;
    if (typeof abi === 'string') {
      abi = JSON.parse(res);
    }

    if (!abi.length) {
      throw new Error(`unable to parse ABI: ${res}`);
    }

    return abi;
  }

  _getBoxPosition(transactionHash) {
    //very simple hashing function
     var hash = 0;
     for (var i = 0; i < transactionHash.length; i++) {
         var charCode = transactionHash.charCodeAt(i);
         hash += charCode;
     }
     return hash % this.getConfig('maxBoxes');
  }

  async getABI() {
    if (! this.session.abi) {
      this.session.abi = await this._fetchABI(CONTRACT);
    }
    return this.session.abi;
  }

  initializeState() {
    this.state = {
      blockchain: {
        network: NETWORK,
      },
      lastUpdatedBox: 0,
      boxState: [],
      config: {
        contractAddress: CONTRACT,
        lag: 500,
        maxBoxes: 9
      }
    }
  }

  loadState(newState) {
    if (typeof newState !== 'object') {
      throw new Error("state mst be a object");
    }
    console.log('setting state to ', newState);
    this.state = newState;
    this._invokeSubscribers();
  }

  getState() {
    return this.state;
  }

  getConfig(name) {
    return this.state.config[name];
  }

  exportState() {
    return JSON.stringify(this.state, null, 2);
  }

  handleEvent(ctx) {

    const txn = ctx.transaction;
    if (! txn) {
      console.log("WARNING: NO TXN DETECTED", ctx);
      return;
    }

    const {
      allEvents,
      // blockNumber,
      transactionHash
    } = txn;

    // FIXME
    const blockNumber = txn.blockNumber - this.getConfig('lag');

    // protect against re-processing blocks when resuming from snapshot
    if (this.state.blockchain.currentBlock && this.state.blockchain.currentBlock > blockNumber) {
      return;
    }

    // reset current transaction index for new block
    if (this.state.blockchain.currentBlock !== blockNumber) {
      this.state.blockchain.currentTransaction = 0;
    }

    this.state.blockchain.currentBlock = blockNumber;

    const birthEvents = allEvents.filter(it => it.event === 'Birth');

    birthEvents.forEach((birthEvent) => {
      const { transactionIndex } = birthEvent;

      // don't re-process the same events, this is required when resuming from a
      // state snapshot, as we don't know if our snapshot contains all events
      // within the 'currentBlock'
      if (this.state.blockchain.currentTransaction >= transactionIndex) {
        return;
      }

      this.state.blockchain.currentTransaction = transactionIndex;
      const color = randomColor({seed: transactionHash});
      const kittyId = birthEvent.returnValues ? birthEvent.returnValues.kittyId : null;

      const boxState = {
        blockNumber,
        transactionIndex,
        hash: transactionHash,
        color,
        kittyId
      };

      const boxIndex = this._getBoxPosition(transactionHash);
      this.state.boxState[boxIndex] = boxState;
      this.state.lastUpdatedBox = boxIndex;
      this._invokeSubscribers();
    })

  };

  eventLogger(ctx) {
    try {
      console.log(ctx);
    } catch (e) {
      console.error(e);
    }
  };

}
module.exports = KittyAppStateStore;
