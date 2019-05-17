const randomColor = require('randomcolor');
const axios = require('axios');

const NETWORK = 'mainnet';
const CONTRACT = "0x06012c8cf97bead5deae237070f9587f8e7a266d";
const BASE_ABI_URL = "https://api.etherscan.io/api?module=contract&action=getabi&address=";

class KittyAppStateStore {

  constructor() {
    this.session = {};
    this.exportState = this.exportState.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.initializeState();
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

  async getABI() {
    if (! this.session.abi) {
      this.session.abi = await this._fetchABI(CONTRACT);
    }
    return this.session.abi;
  }

  initializeState() {
    this.state = {
      blockchain: {
        network: 'mainnet',
        // startingBlock: start,
        // startingTime: Date.now(),
        // latestBlock: latest
      },
      currentBlockIndex: -1,
      boxState: [],
      config: {
        contractAddress: CONTRACT,
        lag: 500,
        maxBoxes: 9
      }
    }
  }

  loadState(newState) {
    console.log('setting state to ', newState);
    this.state = newState;
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

    if (! this.session) {
      this.session = {
        startingBlock: start,
        startingTime: Date.now(),
        latestBlock: latest
      }
    }

    const txn = ctx.transaction;
    if (! txn) {
      console.log("WARNING: NO TXN DETECTED", ctx);
      return;
    }

    const {
      // blockNumber,
      transactionIndex,
      transactionHash
    } = txn;

    // FIXME
    const blockNumber = txn.blockNumber - this.getConfig('lag');

    // protect against re-processing blocks when resuming from snapshot
    if (this.state.blockchain.currentBlock && this.state.blockchain.currentBlock > blockNumber) {
      return;
    }
    if (this.state.blockchain.currentBlock != blockNumber) {
      this.state.blockchain.currentTransaction = 0;
    }

    this.state.blockchain.currentBlock = blockNumber;

    let birthEvents = bundle.byName['Birth'];
    // TODO: this error logic seems awkward
    if (! birthEvents) {
      return;
    }

    if (! Array.isArray(birthEvents)) {
      birthEvents = [birthEvents];
    }

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

      const currentBlockIndex = (this.state.currentBlockIndex + 1) % this.state.config.maxBoxes;
      this.state.currentBlockIndex = currentBlockIndex;
      this.state.boxState[currentBlockIndex] = boxState;

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
