import {Types} from './actions';
import {createReducer} from 'reduxsauce';

const INIT = {
  data: {}
}

const update = (state=INIT, action) => {
  return {
    ...state,
    data: action.data
  }
}

const clear = (state=INIT) => {
  return {
    ...state,
    data: {}
  }
}

const HANDLERS = {
  [Types.UPDATE]: update,
  [Types.CLEAR]: clear
}

export default createReducer(INIT, HANDLERS);
