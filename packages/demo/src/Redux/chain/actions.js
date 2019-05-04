import {createActions} from 'reduxsauce';

const {Types, Creators} = createActions({
  initStart: null,
  initSuccess: ['web3'],
  failure: ['error']
}, {prefix: "chain."});
export {
  Types,
  Creators
}
