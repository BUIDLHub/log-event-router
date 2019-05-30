import {createReducer} from 'reduxsauce';
import {Types} from './actions';

const INIT = {
  loading: false,
  error: null,
  web3: null,
  latestBlock: 0,
  network: null
}

const loadReq = (state=INIT) => {
  return {
    ...state,
    loading: true,
    error: null
  }
}

const loadSuccess = (state=INIT, action) => {
  return {
    ...state,
    loading: false,
    web3: action.web3,
    latestBlock: action.latestBlock || 0,
    network: action.network
  }
}

const fail = (state=INIT, action) => {
  return {
    ...state,
    loading: false,
    error: action.error
  }
}

const network = (state=INIT, action) => {
  return {
    ...state,
    network: action.network
  }
}

const HANDLERS = {
  [Types.INIT_START]: loadReq,
  [Types.INIT_SUCCESS]: loadSuccess,
  [Types.FAILURE]: fail,
  [Types.CHANGE_NETWORK]: network
}

export default createReducer(INIT, HANDLERS);
