import {createActions} from 'reduxsauce';

const {Types, Creators} = createActions({
  initStart: null,
  initSuccess: ['streams'],
  failure: ['error']
},{prefix: "stream."});
export {
  Types,
  Creators
}
