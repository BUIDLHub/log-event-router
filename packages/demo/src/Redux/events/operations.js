import {Creators} from './actions';
import _ from 'lodash';

const addType = (byType,event) => {
  let a = byType[event.event] || [];
  a.push(event);
  byType[event.event] = a;
}

const storeEvents = async (events, storage) => {
  let byDB = {};
  for(let i=0;i<events.length;++i) {
    let evt = events[i];
    let items = byDB[evt.event] || [];
    items.push({
      key: evt.id,
      value: evt
    });
    byDB[evt.event] = items;
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

  //runs on all txns
  stream.use(async (ctx, next)=>{
    let state = getState();
    let byType = {
      ...state.events.byType
    };
    let events = _.values(ctx.txn.logEvents);
    for(let i=0;i<events.length;++i) {
      let evt = events[i];
      addType(byType, evt);
    }
    dispatch(Creators.update(byType));
    next();
  });

  //txns where contract's breedWithAuto fn was called
  stream.use("breedWithAuto", async (ctx,next)=>{
    console.log("Breeding txn", ctx.txn);
    let events = _.values(ctx.txn.logEvents);
    await storeEvents(events, ctx.storage);
    next();
  });

  //txns where contract's giveBirth fn was called
  stream.use("giveBirth", async (ctx,next)=>{
    console.log("Birth txn", ctx.txn);
    let events = _.values(ctx.txn.logEvents);
    await storeEvents(events, ctx.storage);
    next();
  });
}

export default {
  init
}
