import {createReducer} from 'reduxsauce';
import {Types} from './actions';

const INIT = {
  loading: false,
  error: null,
  streams: null
}

const start = (state=INIT) => {
  return {
    ...state,
    loading: true,
    error: null
  }
}

const success = (state=INIT, action) => {
  return {
    ...state,
    loading: false,
    streams: action.streams
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
  [Types.INIT_START]: start,
  [Types.INIT_SUCCESS]: success,
  [Types.FAILURE]: fail
}

export default createReducer(INIT, HANDLERS);
