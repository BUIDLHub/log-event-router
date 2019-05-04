import {createReducer} from 'reduxsauce';
import {Types} from './actions';

const INIT = {
  loading: false,
  error: null,
  web3: null
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
    web3: action.web3
  }
}

const fail = (state=INIT, action) => {
  return {
    ...state,
    loading: false,
    error: action.error
  }
}

const HANDLERS = {
  [Types.INIT_START]: loadReq,
  [Types.INIT_SUCCESS]: loadSuccess,
  [Types.FAILURE]: fail
}

export default createReducer(INIT, HANDLERS);
