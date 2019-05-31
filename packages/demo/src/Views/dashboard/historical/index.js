import {connect} from 'react-redux';
import View from './Historical';
import _ from 'lodash';
import {formatTimeLong} from 'Utils/time';
import {default as runOps} from 'Redux/speedTest/runs/operations';

const s2p = state => {
  let runs = state.speedTest.runs.byId;
  let running = state.speedTest.runs.running;

  let current = state.speedTest.runs.current;

  let timeData = [];
  let sizeData = [];
  let callData = [];
  let countData = [];
  let sizeLabels = [];
  let timeLabels = [];

  let all = _.values(runs);
  if(running) {
    //filter out current
    all = all.filter(r=>r!==current);
  }

  all.sort((a,b)=>{
    return a.startTime - b.startTime
  });

  all.forEach(r=>{
    if(r.endTime && r.startTime) {
      let rTime = r.endTime - r.startTime;
      let inSecs = rTime/1000;
      timeData.push(inSecs);
      let sum = r.summary;
      sizeData.push(sum.totalSize);
      callData.push(sum.rpcCalls);
      countData.push(sum.blockCount);
      sizeLabels.push(sum.blockCount.toLocaleString() + " blocks");
      timeLabels.push(formatTimeLong(r.startTime));
    }
  });
  return {
    data: {
      time: timeData,
      size: sizeData,
      calls: callData,
      blockCount: countData
    },
    sizeLabels,
    timeLabels
  }
}

const d2p = dispatch => {
  return {
    clearRuns: () => dispatch(runOps.clearRuns())
  }
}

export default connect(s2p, d2p)(View);
