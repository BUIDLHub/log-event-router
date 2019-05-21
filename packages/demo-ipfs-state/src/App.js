import React from 'react';

import Web3 from 'web3';
import IPFS from 'ipfs';
import {EventStream} from 'eth-event-stream';
import KittyAppStateStore from './shared';

const NETWORK = process.env.NETWORK || 'mainnet';
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || `wss://${NETWORK}.infura.io/ws`;

const web3Factory = () => {
  return new Web3(RPC_ENDPOINT);
}

class App extends React.Component {

  constructor(props) {
    super(props);
    const ipfs = new IPFS();
    ipfs.once('ready', () => {
      console.log('ipfs ready...');
    });

    const kittyAppStateStore = new KittyAppStateStore();

    const web3 = web3Factory();

    this.state = {
      ipfs,
      kittyAppStateStore,
      web3
    };
  }

  async componentDidMount() {

    const {ipfs, kittyAppStateStore, web3} = this.state;
    const abi = await kittyAppStateStore.getABI();
    const address = kittyAppStateStore.getConfig('contractAddress');

    const stream = new EventStream({abi, address, web3Factory});

    stream.use(kittyAppStateStore.handleEvent);

    this.setState({
      ipfs,
      kittyAppStateStore,
      stream,
      web3
    });

    /*
      // TODO: looks like upon resume, we might have hit a infura node that was a little behind???
      Uncaught (in promise) Error: Start block must come before end block: 7763779 > 7763775
        at e.<anonymous> (client.js:35)
        at c (client.js:17)
        at Generator._invoke (client.js:17)
        at Generator.t.<computed> [as next] (client.js:17)
        at n (client.js:35)
        at client.js:35
      */

  }

  render() {
    const {ipfs, kittyAppStateStore, stream, web3} = this.state;
    return (<KittyApp kittyAppStateStore={kittyAppStateStore} ipfs={ipfs} stream={stream} web3={web3} />);
  }

}

class KittyApp extends React.Component {

  constructor(props) {
    super();
    this.state = {};
    this._startStream = this._startStream.bind(this);
    this._syncState = this._syncState.bind(this);
    this._handleStateInputChange = this._handleStateInputChange.bind(this);
  }

  componentDidMount() {
    const {kittyAppStateStore, web3} = this.props;
    kittyAppStateStore.subscribe(this._syncState);
    this._syncState();
    // TODO: we can remove this after we can listen for updates from EventStream
    // FOR NOW, WE DO THIS SO WE CAN UPDATE TO THE LATEST BLOCK IN THE UI
    web3.eth.subscribe('newBlockHeaders', () => {
      setTimeout(this._syncState, 250);
    });
  }

  _handleStateInputChange(e) {
    let initialState = null;
    let ipfsHash = null;

    const value = e.target ? e.target.value : null;

    if (value) {
      try {
        initialState = JSON.parse(value)
      } catch(e) {
        console.log("could not parse json, assuming ipfs hash...");
        ipfsHash = value;
      }
    }

    this.setState({
      initialState,
      ipfsHash
    });
  }

  _syncState() {
    this.setState(this.props.kittyAppStateStore.getState());
  }

  async _startStream() {
    const {ipfs, kittyAppStateStore, stream, web3} = this.props;
    const {initialState, ipfsHash} = this.state;

    if (initialState) {
      kittyAppStateStore.loadState(initialState);
    } else if (ipfsHash) {
      console.log('fetching state from ipfs: ' + ipfsHash);
      const ipfsData = await ipfs.cat(ipfsHash);
      const ipfsState = JSON.parse(ipfsData.toString());
      kittyAppStateStore.loadState(ipfsState);
    } else {
      kittyAppStateStore.initializeState();
    }



    const lag = kittyAppStateStore.getConfig('lag');
    const currentState = kittyAppStateStore.getState();

    const lastProcessedBlock = currentState.blockchain
      ? currentState.blockchain.currentBlock
      : null;

    const latest = await web3.eth.getBlockNumber();

    // FIXME: this seems confusing
    const fromBlock = lastProcessedBlock || (latest - (2000 + lag));

    this.setState({startingBlock: fromBlock, startingTime: Date.now(), latestBlock: latest, syncing: true});

    stream.start({
      fromBlock, lag/* TODO: what would happen if our clients didn't match wrt lag? */
    }).then((data) => {
      const syncDelay = Date.now() - this.state.startingTime;
      this.setState({syncDelay, syncing: false});
    });

  }

  render() {

    const {kittyAppStateStore} = this.props;
    const {blockchain, latestBlock, startingBlock, syncDelay, syncing} = this.state;
    const currentBlock = blockchain ? blockchain.currentBlock : null;

    const catBoxes = [];
    for (let i = 0; i < 9; i++) {
      let bs = {};
      try {
        bs = this.state.boxState[i];
      } catch (e) {}
      const isCurrent = this.state.lastUpdatedBox === i;
      const catBox = (<KittyBox key={i} {...bs} isCurrent={isCurrent}/>)
      catBoxes.push(catBox);
    }

    const currentStatePretty = JSON.stringify(kittyAppStateStore.getState(), null, 2);

    return (
      <div className="flex-grid">
        <div className="col">
          <header className="text-center">
            Initial State
          </header>
          <StateInput onChange={this._handleStateInputChange}/>
        </div>

        <div className="col">
          <header>
            <input type="button" value="---> Start App! <---" onClick={this._startStream} style={{float: 'left', marginRight: '10px'}}/>
            <ProgressArea currentBlock={currentBlock} latestBlock={latestBlock} startingBlock={startingBlock} syncDelay={syncDelay}/>
          </header>
          <div className={"flex-container kitty-app " + (syncing ? 'grayscale' : '')} id="without-snapshot">
            {catBoxes}
          </div>
        </div>

        <div className="col">
          <header className="text-center">
            Current State
          </header>
          <StateInput readOnly={true} value={currentStatePretty}/>
        </div>
      </div>
    );
  }
}

const BASE_IMAGE_URL = 'https://storage.googleapis.com/ck-kitty-image/0x06012c8cf97bead5deae237070f9587f8e7a266d';


class KittyBox extends React.PureComponent {

  render() {
    const {color, kittyId, hash, isCurrent} = this.props;

    let summary = 'Incomplete Data';

    let url = null;
    if (kittyId) {
      url = BASE_IMAGE_URL + '/' + kittyId + '.png';
      summary = kittyId
    }

    const className = "flex-item box " + (
      isCurrent
      ? 'current'
      : '');

    const style = {
      background: color
    }

    return (<div className={className} style={style} dataHash={hash}>
      <img src={url} alt="Kitty"/>
      <p>{summary}</p>
    </div>);

  }
}

    class StateInput extends React.PureComponent {
      render() {
        const {onChange, readOnly, value} = this.props;
        return (<textarea
                  className='initial-state'
                  placeholder='can be empty, json, or ipfs...'
                  onChange={onChange}
                  readOnly={readOnly} value={value} />
              );
      }
    }

    class ProgressArea extends React.PureComponent {

      render() {

        const {currentBlock, latestBlock, startingBlock, syncDelay} = this.props;

        const startingBlocksBehind = latestBlock - startingBlock;
        const blocksProcessed = currentBlock - startingBlock;
        const value = Math.ceil(100 * (blocksProcessed / startingBlocksBehind));

        const blocksBehind = latestBlock - currentBlock;
        let summary = "";

        const progressStyle = {};

        if (syncDelay) {
          progressStyle.display = "none";
          summary = Math.floor(syncDelay / 1000) + " seconds to fetch " + startingBlocksBehind + " blocks...";
          summary += "; currentBlock: " + currentBlock;
        } else if (blocksBehind > 0) {
          summary = blocksBehind + ' blocks behind...';
        }

        return (<div className="progress-area">
          <progress style={progressStyle} max={100} value={value}></progress>
          <span className="summary">{summary}</span>
        </div>);

      }

    }

    export default App;
