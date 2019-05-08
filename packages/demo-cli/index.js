const axios = require('axios');
const _ = require('lodash');

const Web3 = require('web3');
const {
  EventStream
} = require('event-stream');

const {
  storageMiddleware,
  storageInstance
} = require("event-storage");


const NETWORK = 'mainnet';
const RPC_ENDPOINT = `wss://${NETWORK}.infura.io/ws`
const BASE_ABI_URL = "https://api.etherscan.io/api?module=contract&action=getabi&address=";
const CONTRACT = "0x06012c8cf97bead5deae237070f9587f8e7a266d";


const fetchABI = async (address) => {
  let abiUrl = BASE_ABI_URL + CONTRACT;

  let r = await axios.get(abiUrl);
  let res = _.get(r, "data.result");
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


const main = async () => {

  const abi = await fetchABI(CONTRACT);

  console.log(`setting up web3`);
  const web3 = new Web3(RPC_ENDPOINT);

  console.log(`setting up stream`);
  const stream = new EventStream({
    abi,
    address: CONTRACT,
    web3
  });

  const eventLogger = async (ctx) => {
    let txn = ctx.txn;
    await ctx.storage.store({
      database: "LastBlock",
      key: "lastBlock",
      data: {
        blockNumber: txn.blockNumber,
        timestamp: txn.timestamp
      }
    });

    console.log('received events...');
    console.log(JSON.stringify(ctx, null, 2));
  }

  stream.use(storageMiddleware());
  stream.use(eventLogger);

  let r = await storageInstance().readAll({
    database: "LastBlock",
    sort: [
      {
        field: "blockNumber",
        order: "DESC"
      }
    ],
    limit: 1
  });

  let start = r[0]?r[0].blockNumber:0;
  if(!start) {
    const latest = await web3.eth.getBlockNumber();
    start = latest - 10;
  }

  await stream.start({
    fromBlock: start
  });
}

main()
  .then(text => {
    console.log(text);
  })
  .catch(err => {
    console.error(err);
  });

// allow process to run forever
// process.stdin.resume();
// or callback approach:
function listen() {
  console.log('listening...');
  setTimeout(listen, 5000);
}
listen();
