import { combineReducers } from 'redux';
import {reducer as toastrReducer} from 'react-redux-toastr'
import {default as init} from './init/reducers';
import {default as stream} from './stream/reducers';
import {default as chain} from './chain/reducers';
import {default as events} from './events/reducers';
import {default as contract} from './contract/reducers';
import {default as speedTest} from './speedTest/reducers';
import {default as modals} from './modals/reducers';

/**
 * Collection of all dashboard state tree reducers
 */
export default combineReducers({
  toastr: toastrReducer,
  init,
  stream,
  chain,
  events,
  contract,
  speedTest,
  modals
});
