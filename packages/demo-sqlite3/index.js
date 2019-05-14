require("dotenv").config();

const axios = require('axios');
const _ = require('lodash');
const util = require('util');
const sqlite3 = require('sqlite3').verbose();
const Web3 = require('web3');

const {
  EventStream
} = require('eth-event-stream');

const {
  storageMiddleware,
  storageInstance
} = require("event-storage");


const NETWORK = 'mainnet';
const RPC_ENDPOINT = process.env.RPC_ENDPOINT; //`wss://${NETWORK}.infura.io/ws`
const BASE_ABI_URL = "https://api.etherscan.io/api?module=contract&action=getabi&address=";
const CONTRACT = process.env.CONTRACT; //"0x06012c8cf97bead5deae237070f9587f8e7a266d";


const asyncify = (target) => {
  target.getAsync = util.promisify(target.get);
  target.allAsync = util.promisify(target.all);
  target.runAsync = util.promisify(target.run);
}

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

const db = new sqlite3.Database('test.db');
asyncify(db);

const main = async () => {

  console.log(`setting up database...`);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      name TEXT,
      value BLOB
    )`);
  await db.runAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_name ON settings (name);
    `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS transfer (
      from_address TEXT,
      to_address TEXT,
      tokens UNSIGNED BIG INT,
      block_number UNSIGNED BIG INT,
      block_timestamp DATE,
      block_hash TEXT,
      txn_index UNSIGNED INT,
      txn_hash TEXT
    )`);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS approval (
      token_owner TEXT,
      spender TEXT,
      tokens UNSIGNED BIG INT,
      block_number UNSIGNED BIG INT,
      block_timestamp DATE,
      block_hash TEXT,
      txn_index UNSIGNED INT,
      txn_hash TEXT
    )`);


  const recordTransfer = db.prepare(`
    INSERT INTO transfer VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  asyncify(recordTransfer);

  const recordApproval = db.prepare(`
    INSERT INTO approval VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  asyncify(recordApproval);

  const recordSetting = db.prepare(`
    INSERT OR REPLACE INTO settings(name, value) VALUES(?, ?);
  `);
  asyncify(recordSetting);

  const getSetting = db.prepare(`
    SELECT value FROM settings WHERE name = ?;
  `);
  asyncify(getSetting);

  console.log(`fetching abi...`);
  const abi = await fetchABI(CONTRACT);

  console.log(`setting up web3`);
  const web3 = new Web3(RPC_ENDPOINT);

  console.log(`setting up stream`);
  const stream = new EventStream({
    abi,
    address: CONTRACT,
    web3Factory: () => new Web3(RPC_ENDPOINT)
  });

  const eventLogger = async (ctx) => {
    let bundle = ctx.bundle;
    //let txn = ctx.txn;
    const {blockNumber} = bundle;
    console.log({blockNumber});
  };

  const eventRecorder = async (ctx) => {
    let bundle = ctx.bundle;

    const transferEvent = bundle.byName['Transfer'];
    if (transferEvent) {
      await recordTransfer.runAsync(
        transferEvent.returnValues.from,
        transferEvent.returnValues.to,
        transferEvent.returnValues.tokens,
        transferEvent.blockNumber,
        (transferEvent.blockTimestamp || Date.now()), /* FIXME */
        transferEvent.blockHash,
        transferEvent.transactionIndex,
        transferEvent.transactionHash
      );
    }

    const approvalEvent = bundle.byName['Approval'];
    if (approvalEvent) {
      await recordApproval.runAsync(
        approvalEvent.returnValues.tokenOwner,
        approvalEvent.returnValues.spender,
        approvalEvent.returnValues.tokens,
        approvalEvent.blockNumber,
        (approvalEvent.blockTimestamp || Date.now()), /* FIXME */
        approvalEvent.blockHash,
        approvalEvent.transactionIndex,
        approvalEvent.transactionHash
      );
    }

    await recordSetting.runAsync("last_block", bundle.blockNumber);
  };

  //stream.use(storageMiddleware());
  stream.use(eventLogger);
  stream.use(eventRecorder);

  let start = await getSetting.getAsync("last_block");
  if(start) {
    start = start['value'];
  } else {
    const latest = await web3.eth.getBlockNumber();
    start = latest - 10;
  }

  await stream.start({
    fromBlock: start
  });
}

function exitHandler(options, exitCode) {
  // cleanup db connection...
  db.close();

  if (options.exit) {
    process.exit();
  }
}

// //do something when app is closing
// process.on('exit', exitHandler.bind(null, {cleanup:true}));
//
// //catches ctrl+c event
// process.on('SIGINT', exitHandler.bind(null, {exit:true}));
//
// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
// process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
//
// //catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

// allow process to run forever
// process.stdin.resume();
// or callback approach:
function listen() {
  console.log('listening...');
  setTimeout(listen, 5000);
}
listen();

main()
  .then(text => {
    console.log(text);
  })
  .catch(err => {
    console.log("ERROR:");
    console.log(err);
  });
