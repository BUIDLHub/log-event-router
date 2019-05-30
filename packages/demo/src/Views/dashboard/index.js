import {connect} from 'react-redux';
import DB from './Dashboard';
import {default as runOps} from 'Redux/speedTest/runs/operations';
import {default as paramOps} from 'Redux/speedTest/params/operations';

const s2p = state => {
  return {

  }
}

const d2p = dispatch => {
  return {
    startRun: () => {
      let params = {
        refreshRate: 100,
        contractId: 1,
        rangeStart: 7857480,
        rangeEnd: 7857482,
        includeTXN: true,
        includeTimestamp: true
      };
      dispatch(paramOps.update(params));
      dispatch(runOps.start());
    },

    stopRun: () => {
      dispatch(runOps.stop());
    }
  }
}

export default connect(s2p,d2p)(DB);
