import {Creators} from './actions';
import Web3 from 'web3';

const init = () => async (dispatch, getState) => {
  //set up web3
  dispatch(Creators.initStart());
  let ethProvider = window.ethereum;
  if(!ethProvider && window.web3){
    ethProvider =  window.web.currentProvider;
  }
  let web3 = null;
  if(ethProvider) {

    web3 = new Web3(ethProvider);
    let acts = await ethProvider.enable();
    if(!acts) {
      //user denied access to app
      web3 = null;
    }
  }
  dispatch(Creators.initSuccess(web3));
}

export default {
  init
}
