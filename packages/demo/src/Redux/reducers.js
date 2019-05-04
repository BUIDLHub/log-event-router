import { combineReducers } from 'redux';
import {reducer as toastrReducer} from 'react-redux-toastr'
import {default as init} from './init/reducers';
import {default as stream} from './stream/reducers';
import {default as chain} from './chain/reducers';
import {default as events} from './events/reducers';

/**
 * Collection of all dashboard state tree reducers
 */
export default combineReducers({
  toastr: toastrReducer,
  init,
  stream,
  chain,
  events
});
