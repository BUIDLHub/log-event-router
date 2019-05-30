import {createActions} from 'reduxsauce';

const {Types, Creators} = createActions({
  initStart: null,
  initSuccess: ['contracts'],
  select: ['id'],
  add: ['contract'],
  failure: ['error']
}, {prefix: "contract."});
export {
  Types,
  Creators
}
