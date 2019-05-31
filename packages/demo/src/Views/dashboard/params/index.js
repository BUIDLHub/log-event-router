import {connect} from 'react-redux';
import Params from './Params';
import _ from 'lodash';
import {default as paramOps} from 'Redux/speedTest/params/operations';
import {default as runOps} from 'Redux/speedTest/runs/operations';
import {default as modalOps} from 'Redux/modals/operations';

const MAX_BLOCKS = 300000;
const APP_MODAL_ID = "addApp";

const s2p = state => {
  let data = {
    ...state.speedTest.params.data
  }

  let endRange = state.chain.latestBlock;
  let rangeMin = endRange - MAX_BLOCKS;
  let startRange = data['rangeStart'] || (endRange-500);
  let rate = data['refreshRate'];
  let con = data["contract"];
  if(!con) {
    let c = state.contract.selected || {};
    con = c.id;
  }

  let network = state.chain.network;
  data['contract'] = con;
  data['rangeEnd'] = endRange;
  data['rangeStart'] = startRange;
  data['rangeMin'] = rangeMin;
  data['network'] = network;
  data['refreshRate'] = rate || 50;

  return {
    contracts: _.values(state.contract.byId),
    paramData: data,
    running: state.speedTest.runs.running
  }
}

const d2p = dispatch => {
  return {
    newApp: () => {
      dispatch(modalOps.show(APP_MODAL_ID));
    },
    update: (data, field, value) => {
      let newData = {
        ...data,
        [field]: value
      }
      dispatch(paramOps.update(newData))
    },
    startRun: (paramData) => {
      dispatch(paramOps.update(paramData));
      dispatch(runOps.start());
    },
    stopRun: () => {
      dispatch(runOps.stop());
    }
  }
}

export default connect(s2p, d2p)(Params);
