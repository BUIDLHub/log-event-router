import {createReducer} from 'reduxsauce';
import {Types} from './actions';

const INIT = {
  loading: false,
  error: null,
  byType: null
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
    byType: action.events
  }
}

const update = (state=INIT, action) => {
  return {
    ...state,
    byType: {
      ...action.events
    }
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
  [Types.FAILURE]: fail,
  [Types.UPDATE]: update
}

export default createReducer(INIT, HANDLERS);
