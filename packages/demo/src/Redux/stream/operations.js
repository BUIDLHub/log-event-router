import {Creators} from './actions';
import {EventStream} from 'eth-event-stream'
import {
  storageMiddleware,
  storageInstance
} from 'event-storage';
import axios from 'axios';
import _ from 'lodash';

const BASE_ABI_URL = "http://api.etherscan.io/api?module=contract&action=getabi&address=";
const CONTRACT = "0x06012c8cf97bead5deae237070f9587f8e7a266d";

const init = () => async (dispatch, getState) => {
  dispatch(Creators.initStart());
  let abiUrl = BASE_ABI_URL + CONTRACT;
  let r = await axios.get(abiUrl);
  let res = _.get(r, "data.result");
  if(!res) {
    return dispatch(Creators.initSuccess());
  }

  let abi = res;

  if(typeof res === 'string') {
    abi = JSON.parse(res);
  }
  if(!abi.length) {
    return dispatch(Creators.initSuccess());
  }
  let web3 = getState().chain.web3;

  let stream = new EventStream({
    abi,
    address: CONTRACT,
    web3Factory: () => web3
  }).withFunctionContext(true);

  stream.use(storageMiddleware());
  stream.use(async (ctx)=>{
    let txn = ctx.transaction;
    await ctx.storage.store({
      database: "LatestBlock",
      key: ""+txn.blockNumber,
      data: {
        blockNumber: txn.blockNumber,
        timestamp: txn.timestamp
      }
    });
  });

  dispatch(Creators.initSuccess(stream));
}

const start = () => async (dispatch,getState) => {
  dispatch(Creators.recoveryStart());

  let stream = getState().stream.streams;
  let web3 = getState().chain.web3;
  let latest = await web3.eth.getBlockNumber();
  let r = await storageInstance().readAll({
    database: "latestBlock",
    limit: 1,
    sort: [
      {
        field: "blockNumber",
        order: "DESC"
      }
    ]
  });
  let lastRead = r && r.length>0?r[0].blockNumber:latest-50;

  //TODO: get offset by reading highest block we've seen in prior run.
  try {
    await stream.start({fromBlock: lastRead, toBlock: latest, lag: 3});
    dispatch(Creators.recoveryFinished());
  } catch (e) {
    dispatch(Creators.failure(e));
  }
}

export default {
  init,
  start
}
