import {createActions} from 'reduxsauce';

const {Types, Creators} = createActions({
  update: ['data'],
  clear: null
},{prefix: "speedTest.params."});

export {
  Types,
  Creators
}
