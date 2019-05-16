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

  const buffer = Buffer.from(JSON.stringify(currentState));

  const ipfsData = await node.add(buffer);

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

  const stream = new EventStream({
    abi,
    address,
    web3Factory
  });
  stream.use(kittyAppStateStore.handleEvent);

  const latest = await web3.eth.getBlockNumber();
  const start = latest - 50;

  stream.start({
    fromBlock: start
  }).then(() => {
    session.isEventStreamSynced = true;
    generateIpfsSnapshot();
  });

};


main()
  .catch(err => {
    console.log(err);
  });
