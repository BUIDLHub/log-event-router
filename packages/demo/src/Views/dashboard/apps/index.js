import {connect} from 'react-redux';
import Modal from './AppModal';
import {default as modalOps} from 'Redux/modals/operations';
import {default as abiOps} from 'Redux/abi/operations';
import {default as conOps} from 'Redux/contract/operations';
import _ from 'lodash';


const ID = "addApp";

const s2p = state => {
  let data = state.modals.data[ID] || {};

  return {
    showing: state.modals.visible[ID],
    data: data,
    loading: state.modals.loading[ID],
    error: state.modals.errors[ID]
  }
}

const d2p = (dispatch) => {
  return {
    cancel: () => {
      dispatch(modalOps.hide(ID))
    },
    collect: data => {
      dispatch(modalOps.collect(ID, data));
      if(data.address && !data.abi) {
        dispatch(abiOps.getABI(data.address))
        .then(abi=>{
          dispatch(modalOps.collect(ID, {
            ...data,
            abi: JSON.stringify(abi)
          }));
        });
      }
    },

    onSubmit: async data => {

      dispatch(modalOps.isLoading(ID, true));

      return dispatch(conOps.addApp(data))
              .then(()=>{
                dispatch(modalOps.clear(ID));
                dispatch(modalOps.isLoading(ID, false));
                dispatch(modalOps.hide(ID))
              }).catch(e=>{
                dispatch(modalOps.failure(ID, e));
              });

    }
  }
}

export default connect(s2p, d2p)(Modal);
