import {Types} from './actions';
import {createReducer} from 'reduxsauce';
import _ from 'lodash';

const INIT = {
  loading: false,
  error: null,
  byId: [],
  selected: null
}

const initStart = (state=INIT) => {
  return {
    ...state,
    loading: true,
    error: null
  }
}

const initSuccess = (state=INIT, action) => {

  return {
    ...state,
    loading: false,
    byId: action.contracts,
    selected: _.values(action.contracts)[0]
  }
}

const fail = (state=INIT, action) => {
  return {
    ...state,
    loading: false,
    error: action.error
  }
}

const select = (state=INIT, action) => {
  return {
    ...state,
    loading: false,
    selected: state.byId[action.id]
  }
}

const add = (state=INIT, action) => {
  let byId = {
    ...state.byId,
    [action.contract.id]: action.contract
  };
  return {
    ...state,
    byId
  }
}

const HANDLERS = {
  [Types.INIT_START]: initStart,
  [Types.INIT_SUCCESS]: initSuccess,
  [Types.FAILURE]: fail,
  [Types.ADD]: add,
  [Types.SELECT]: select
}

export default createReducer(INIT, HANDLERS);
