import {Creators} from './actions';
import _ from 'lodash';

const addType = (byType,event) => {

  let a = byType[event.event] || [];
  a.push(event);
  byType[event.event] = a;
}

const init = () => async (dispatch,getState) => {
  let stream = getState().stream.streams;
  stream.use("breedWithAuto", async (ctx,next)=>{
    console.log("Breeding txn", ctx.txn);
    let events = _.values(ctx.txn.logEvents);

    let state = getState();
    let byType = {
      ...state.events.byType
    };

    for(let i=0;i<events.length;++i) {
      let evt = events[i];

      ctx.storage.store({
        database: evt.event,
        key: evt.id,
        data: evt
      });
      addType(byType,evt)
    }
    dispatch(Creators.update(byType));
    next();
  });

  stream.use("giveBirth", (ctx,next)=>{
    console.log("Birth txn", ctx.txn);
    let events = _.values(ctx.txn.logEvents);

    let state = getState();
    let byType = {
      ...state.events.byType
    };
    for(let i=0;i<events.length;++i) {
      let evt = events[i];

      ctx.storage.store({
        database: evt.event,
        key: evt.id,
        data: evt
      });
      addType(byType,evt)
    }
    dispatch(Creators.update(byType));
    next();
  });
}

export default {
  init
}
