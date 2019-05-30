import {Creators} from './actions';
import * as dbNames from 'Storage/DBNames';
import Storage from 'Storage';
import _ from 'lodash';
import Runner from './AppSyncRunner'; //'./TestRunner';
import {registerDeps} from 'Redux/DepMiddleware';
import {Types as conTypes} from 'Redux/contract/actions';


class SyncWrapper {
  constructor(props) {
    this.run = {
      ...props,
      summary: {
        lastBlock: props.rangeStart,
        blockCount: 0,
        txnCount: 0,
        eventCount: 0,
        totalSize: 0,
        rpcCalls: 0,
        errors: 0
      }
    };
    console.log("Run params", {...this.run}, props);

    this.runner = new Runner({...this.run});
    delete this.run['web3Factory'];
    delete this.run['abi'];
    delete this.run['address'];

    [
      'start',
      'stop'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  start() {
    return (dispatch,getState)=>{
      dispatch(Creators.start());
      let newSummary = {
        ...this.run.summary
      };

      let cb = async (e, txns, meta) => {

        if(txns) {
          newSummary.startBlockTime = this.runner.startBlock.timestamp;
          newSummary.endBlockTime = this.runner.endBlock.timestamp;

          newSummary.txnCount += txns.length;
          if(meta && newSummary.lastBlock != meta.toBlock) {
            let delta = meta.toBlock - newSummary.lastBlock;
            newSummary.blockCount += delta;
            newSummary.lastBlock = meta.toBlock;
          }
          if(meta) {
            newSummary.rpcCalls += meta.rpcCalls;
          }
          newSummary.totalSize += JSON.stringify(txns).length;
          txns.forEach(t=>{
            if(!meta && newSummary.lastBlock !== t.blockNumber) {
              let delta = t.blockNumber - newSummary.lastBlock;
              newSummary.blockCount += delta;
              newSummary.lastBlock = t.blockNumber;
            }
            newSummary.eventCount += t.allEvents.length;
          });
          let newRun = {
            ...this.run,
            summary: {
              ...newSummary
            },
            endTime: Date.now()
          };

          await Storage.instance.create({
            database: dbNames.Runs,
            key: ""+newRun.id,
            data: newRun
          });
          dispatch(Creators.update(newRun));
        } else if(e) {
          console.log("Problem in app sync", e);
          newSummary.errors++;
        }
      }

      this.runner.start(cb).then(()=>{
        dispatch(this.stop());
      });
    }
  }

  stop() {
    return (dispatch) => {
      console.log("Stopping app sync test....");
      this.runner.stop();
      dispatch(Creators.stop());
      console.log("Test stopped");
    }
  }
}


const init = () => async (dispatch,getState) => {
  registerDeps(conTypes.SELECT, ()=>{
    let con = getState().contract.selected;
    console.log("Selected con", con);
    dispatch(loadRuns(con));
  });

  dispatch(Creators.initStart());
  let selCon = getState().contract.selected;
  dispatch(loadRuns(selCon));
}

const loadRuns = (app) => async (dispatch, getState) => {

  let r = await Storage.instance.find({
    database: dbNames.Runs,
    limit: 50,
    selector: {
      contract: app.id
    },
    sort: [
      {
        field: "startTime",
        order: "DESC"
      }
    ]
  });
  let runs = r.reduce((o,run)=>{
    if(typeof run === 'string') {
      run = JSON.parse(run);
    }
    o[run.id] = run;
    return o;
  },{});
  let mostRecent = null;
  if(r.length > 0) {
    mostRecent = runs[r[0].id];
  }

  dispatch(Creators.initSuccess(runs, mostRecent));
}

let currentRunner = null;
const start = () => async (dispatch, getState) => {
  let state = getState();
  let params = state.speedTest.params.data;
  let con = state.contract.selected;

  let newRun = {
    startTime: Date.now(),
    id: con.id + "_" + (_.values(state.speedTest.runs.byId).length+1),
    ...params
  };

  try {
    currentRunner = new SyncWrapper({
      ...newRun,
      address: con.address,
      abi: con.abi,
      web3Factory: ()=>getState().chain.web3
    });
    await Storage.instance.create({
      database: dbNames.Runs,
      key: ""+newRun.id,
      data: newRun
    });

    dispatch(Creators.update(newRun));
    dispatch(currentRunner.start());

  } catch (e){
    currentRunner = null;
    console.log("Problem with runner", e);
  }
}

const stop = () => async (dispatch, getState) => {
  if(currentRunner) {
    console.log("Stopping runner...");
    dispatch(currentRunner.stop());
    console.log("Stopped");
  }
}

const update = (run) => async dispatch => {
  await Storage.instance.create({
    database: dbNames.Runs,
    key: ""+run.id,
    data: run
  });
  return dispatch(Creators.update(run));
}

export default {
  init,
  start,
  stop,
  update
}
