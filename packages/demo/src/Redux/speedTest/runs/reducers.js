import {createReducer} from 'reduxsauce';
import {Types} from './actions';

const INIT = {
  loading: false,
  running: false,
  error: null,
  byId: {},
  current: null
}

const init = (state=INIT) => {
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
    byId: action.runs,
    current: action.recent
  }
}

const start = (state=INIT) => {
  return {
    ...state,
    running: true,
    error: null
  }
}

const stop = (state=INIT) => {
  return {
    ...state,
    running: false
  }
}

const fail = (state=INIT, action) => {
  return {
    ...state,
    loading: false,
    error: action.error
  }
}

const update = (state=INIT, action) => {
  let run = action.run;
  let byId = {
    ...state.byId,
    [run.id]: run
  }
  return {
    ...state,
    byId,
    current: run
  }
}

const HANDLERS = {
  [Types.INIT_START]: init,
  [Types.INIT_SUCCESS]: initSuccess,
  [Types.FAILURE]: fail,
  [Types.START]: start,
  [Types.STOP]: stop,
  [Types.UPDATE]: update
}

export default createReducer(INIT, HANDLERS);
