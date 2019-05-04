import {Creators} from './actions';
import {EventStream} from 'event-stream'
import {storageMiddleware} from 'event-storage';
import {reduxMiddleware} from 'event-redux';
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
    //eventName: "Birth",
    address: CONTRACT,
    web3
  });
  stream.use(storageMiddleware());
  stream.use(reduxMiddleware(dispatch,getState));

  dispatch(Creators.initSuccess(stream));
}

const start = () => async (dispatch,getState) => {
  let stream = getState().stream.streams;
  let web3 = getState().chain.web3;
  let latest = await web3.eth.getBlockNumber();
  //TODO: get offset by reading highest block we've seen in prior run.
  await stream.start({fromBlock: latest-50});
}

export default {
  init,
  start
}
