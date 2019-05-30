import {Creators} from './actions';

const update = (params) => (dispatch,getState) => {
  let data = {
    ...getState().speedTest.params.data,
    ...params
  }
  dispatch(Creators.update(data));
}

const clear = () => dispatch => {
  return dispatch(Creators.clear());
}

export default {
  update,
  clear
}
