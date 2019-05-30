import {Creators} from './actions';
import * as dbNames from 'Storage/DBNames';
import Storage from 'Storage';
import {default as abiOps} from 'Redux/abi/operations';
import {Types as paramTypes} from 'Redux/speedTest/params/actions';
import {registerDeps} from 'Redux/DepMiddleware';
import _ from 'lodash';

const KITTY_CORE = "0x06012c8cf97bead5deae237070f9587f8e7a266d";

const select = (id) => dispatch => {
  dispatch(Creators.select(id));
}

const init = () => async (dispatch,getState) => {

  registerDeps(paramTypes.UPDATE, ()=>{
    let data = getState().speedTest.params.data;
    let con = data["contract"];
    console.log("Contract param", con);
    
    let selCon = getState().contract.selected;
    if(!selCon || selCon.id !== con) {
      dispatch(Creators.select(con));
    }
  });

  dispatch(Creators.initStart());
  try {

    let r = await Storage.instance.readAll({
      database: dbNames.Contracts,
      limit: 1000
    });

    let cons = r.reduce((o,c)=>{
      if(typeof c === 'string') {
        c = JSON.parse(c);
      }
      if(typeof c.abi === 'string') {
        c.abi = JSON.parse(c.abi);
      }
      o[c.id] = c;
      return o;
    }, {});

    if(r.length === 0) {
      console.log("Setting up default KittyCore contract...");
      let s = Date.now();
      //by default, we retrieve kittycore as a base contract starting point
      let abi = await dispatch(abiOps.getABI(KITTY_CORE));
      console.log("Retrieved ABI in", (Date.now()-s),"ms");

      let con = {
        id: 1,
        address: KITTY_CORE,
        name: "KittyCore",
        abi: JSON.stringify(abi),
        network: 1
      };
      s = Date.now();
      await Storage.instance.create({
        database: dbNames.Contracts,
        key: ""+con.id,
        data: con
      });
      cons = {
        1: con
      };

    }
    dispatch(Creators.initSuccess(cons));
  } catch (e) {
    console.log("Problem reading contracts", e);
    dispatch(Creators.failure(e));
  }
}

const addApp = app => async (dispatch, getState) => {
  let numCons = _.keys(getState().contract.byId).length;
  let con = {
    ...app,
    id: numCons+1
  };
  await Storage.instance.create({
    database: dbNames.Contracts,
    key: ""+con.id,
    data: con
  });
  dispatch(Creators.add(con));
  dispatch(Creators.select(con.id));
}

export default {
  init,
  select,
  addApp
}
