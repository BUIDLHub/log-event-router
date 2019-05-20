const KittyAppStateStore = require('./shared');
const Web3 = require('web3');
const IPFS = require('ipfs');
const {
  EventStream
} = require('eth-event-stream');

const kittyAppStateStore = new KittyAppStateStore();

const node = new IPFS();

const session = {
  isEventStreamSynced: false,
  isConnectedToIpfs: false,
  lastSnapshot: null
};

// FIXME:
const RPC_ENDPOINT = "wss://mainnet.infura.io/ws";

const generateIpfsSnapshot = async () => {
  if (session.isEventStreamSynced == false || session.isConnectedToIpfs == false) {
    return;
  }
  const currentState = kittyAppStateStore.exportState();

  const buffer = IPFS.Buffer.from(currentState);

  const ipfsData = await node.add({
    path:'data.json',
    content: buffer
  });

  console.log("***************************************************************");
  console.log('')
  console.log('state located at:     /ipfs/' + ipfsData[0].hash);
  console.log(ipfsData);
  console.log('');
  console.log("***************************************************************");
};

const web3Factory = () => {
  return new Web3(RPC_ENDPOINT);
}


const main = async (initialState) => {

  if (initialState) {
    kittyAppStateStore.loadState(initialState);
  }

  node.on('ready', () => {
    session.isConnectedToIpfs = true;
    generateIpfsSnapshot();
  });


  const abi = await kittyAppStateStore.getABI();
  const address = kittyAppStateStore.getConfig('contractAddress');
  const lag = kittyAppStateStore.getConfig('lag');

  const web3 = web3Factory();

  // FIXME: passing lag here maybe should throw an error???
  const stream = new EventStream({
    abi,
    address,
    lag,
    web3Factory
  });
  stream.use(kittyAppStateStore.handleEvent);

  const latest = await web3.eth.getBlockNumber();
  const start = latest - (2000+lag);

  stream.start({
    fromBlock: start,
    lag
  }).then(() => {
    session.isEventStreamSynced = true;
    generateIpfsSnapshot();
  });

};


main()
  .catch(err => {
    console.log(err);
  });
