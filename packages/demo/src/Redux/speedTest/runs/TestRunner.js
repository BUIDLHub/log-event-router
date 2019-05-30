import * as yup from 'yup';
import {default as ops} from 'Redux/speedTest/runs/operations';

const schema = yup.object().shape({
  id: yup.string().required("Missing run ID"),
  refreshRate: yup.number().required("Missing UI refresh rate"),
  contract: yup.number().required("Missing contract ID"),
  rangeStart: yup.number().required("Missing block start range"),
  rangeEnd: yup.number().required("Missing block end range"),
  includeTXN: yup.boolean(),
  includeTimestamp: yup.boolean()
});

class MockRunner {
  constructor(interval) {
    this.interval = interval;
    [
      'start',
      'stop'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  start(run, cb) {
    let newRun = {
      ...schema.cast(run),
      summary: {
        blockCount: 0,
        txnCount: 0,
        eventCount: 0,
        totalSize: 0,
        rpcCalls: 0,
        startTime: Date.now()
      }
    };

    this.timer = setInterval(()=>{
      let totalBlocks = newRun.rangeEnd - newRun.rangeStart;
      console.log("Total blocks", totalBlocks, "current", newRun.summary.blockCount);

      if(newRun.summary.blockCount < totalBlocks) {
        console.log("Test runner incrementing counts");
        newRun.summary.blockCount += 10;
        newRun.summary.txnCount += 20;
        newRun.summary.eventCount += 22;
        newRun.summary.totalSize += 22000;
        newRun.summary.rpcCalls += 2;
        newRun.endTime = Date.now();
        console.log("Calling back cb...");
        cb(null, {
          ...newRun,
          summary: {
            ...newRun.summary
          }
        });
      } else {
        console.log("Run completed")
        clearInterval(this.timer);
        cb(null, {
          ...newRun,
          final: true,
          summary: {
            ...newRun.summary,
            endTime: Date.now()
          }
        });
        this.timer = null;
      }
    },this.interval);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }
}


export default class TestRunner {
  constructor(props) {
    schema.validateSync(props);
    this.runInfo = schema.cast(props);
    [
      'start',
      'stop'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  start() {
    return async (dispatch, getState) => {
      this.runner = new MockRunner(500);
      let lastTxnCount = 0;
      let refreshRate = this.runInfo.refreshRate;

      let cb = (e, run) => {
        if(e) {
          console.log("Problem in runner", e);
          dispatch(ops.failure(e));
        } else {
          let diff = run.summary.txnCount - lastTxnCount;
          if(diff >= refreshRate) {
            lastTxnCount = run.summary.txnCount;
            dispatch(ops.update(run));
          } else if(run.final) {
            dispatch(ops.update(run));
          }
        }

      }
      this.runner.start(this.runInfo, cb);
    }
  }

  stop() {
    if(this.runner) {
      this.runner.stop();
    }
    this.runner = null;
  }
}
