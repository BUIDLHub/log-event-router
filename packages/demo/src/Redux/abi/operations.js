import axios from 'axios';
import _ from 'lodash';

const BASE_ABI_URL = "http://api.etherscan.io/api?module=contract&action=getabi&address=";

const getABI = address => async dispatch => {
  let abiUrl = BASE_ABI_URL + address;
  let r = await axios.get(abiUrl);
  let res = _.get(r, "data.result");
  if(!res) {
    return null;
  }

  let abi = res;

  if(typeof res === 'string') {
    abi = JSON.parse(res);
  }
  if(!abi.length) {
    return null;
  }
  return abi;
}

export default {
  getABI
}
