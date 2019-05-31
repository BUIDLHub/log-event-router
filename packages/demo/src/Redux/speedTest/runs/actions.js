import {createActions} from 'reduxsauce';

const {Types, Creators} = createActions({
  initStart: null,
  initSuccess: ['runs', 'recent'],
  update: ['run'],
  start: null,
  stop: null,
  clearRuns: ['id'],
  failure: ['error']
}, {prefix: "speedTest.runs."});

export {
  Types,
  Creators
}
