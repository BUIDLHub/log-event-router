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
  let latestBlock = 0;
  let network = null;
  if(ethProvider) {

    web3 = new Web3(ethProvider);
    let acts = await ethProvider.enable();
    if(!acts) {
      //user denied access to app
      web3 = null;
    }
    latestBlock = await web3.eth.getBlockNumber();
    network = await web3.eth.net.getNetworkType();

    ethProvider.on("networkChanged", id=>{
      dispatch(Creators.networkChanged(id));
    });
  }
  dispatch(Creators.initSuccess(web3, latestBlock, network));
}

export default {
  init
}
