import {combineReducers} from 'redux';
import {default as params} from './params/reducers';
import {default as runs} from './runs/reducers';

export default combineReducers(
  {
    params,
    runs
  }
)
