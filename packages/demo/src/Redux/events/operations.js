import {Creators} from './actions';
import _ from 'lodash';
import {
  RECOVERY_END
} from 'eth-event-stream';


const storeEvents = async (byType, storage) => {
  let byDB = {};
  let types = _.keys(byType);
  for(let i=0;i<types.length;++i) {
    let events = byType[types[i]];
    events.forEach(evt=>{
      let items = byDB[evt.event] || [];
      items.push({
        key: evt.id,
        value: evt
      });
      byDB[evt.event] = items;
    });
  }
  let dbs = _.keys(byDB);
  for(let i=0;i<dbs.length;++i) {
    let db = dbs[i];
    let items = byDB[db];
    await storage.storeBulk({
      database: db,
      items
    });
  }
}

const init = () => async (dispatch,getState) => {
  let stream = getState().stream.streams;
  let recovery = {};

  stream.on(RECOVERY_END, ()=>{
    if(_.keys(recovery).length > 0) {
      dispatch(Creators.update(recovery));
      recovery = {};
    }
  });

  //runs on all txns
  stream.use(async (ctx)=>{
    let state = getState();

    let byType = null;
    if(state.stream.loading) {
      byType = recovery;
    } else {
      byType = {
        ...state.events.byType,
        ...recovery
      };
      recovery = {};
    }

    let types = _.keys(ctx.transaction.logEvents);
    types.forEach(t=>{
      let set = ctx.transaction.logEvents[t];
      let ex = byType[t] || [];
      ex = [
        ...ex,
        ...set.map(e=>{e.fnContext=ctx.transaction.fnContext; return e})
      ];
      byType[t] = ex;
    })
    if(!state.stream.loading) {
      dispatch(Creators.update(byType));
    }
  });

  //txns where contract's breedWithAuto fn was called
  stream.use("breedWithAuto", async (ctx)=>{
    console.log("Breeding txn", ctx.transaction);
    await storeEvents(ctx.transaction.logEvents, ctx.storage);
  });

  //txns where contract's giveBirth fn was called
  stream.use("giveBirth", async (ctx)=>{
    console.log("Birth txn", ctx.transaction);
    await storeEvents(ctx.transaction.logEvents, ctx.storage);
  });
}

export default {
  init
}
