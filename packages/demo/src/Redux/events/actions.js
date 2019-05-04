import {createActions} from 'reduxsauce';

const {Types, Creators} = createActions({
  initStart: null,
  initSuccess: ['events'],
  failure: ['error'],
  update: ['events']
},{prefix:"events."});
export {
  Types,
  Creators
}
