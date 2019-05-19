import {createActions} from 'reduxsauce';

const {Types, Creators} = createActions({
  initStart: null,
  initSuccess: ['streams'],
  recoveryStart: null,
  recoveryFinished: null,
  failure: ['error']
},{prefix: "stream."});
export {
  Types,
  Creators
}
