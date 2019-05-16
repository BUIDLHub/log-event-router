import Puller from './';
import Web3 from 'web3';
import axios from 'axios';
import _ from 'lodash';

const BASE_ABI_URL = "https://api.etherscan.io/api?module=contract&action=getabi&address=";
const RPC_ENDPOINT = "https://main.infura.io";

const fetchABI = async (address) => {
  let abiUrl = BASE_ABI_URL + address;

  let r = await axios.get(abiUrl);
  let res = _.get(r, "data.result");
  if (!res) {
    throw new Error(`unable to fetch ABI from ${abiUrl}`);
  }

  let abi = res;
  if (typeof abi === 'string') {
    abi = JSON.parse(res);
  }

  if (!abi.length) {
    throw new Error(`unable to parse ABI: ${res}`);
  }

  return abi;
}

describe("BHubEventPuller", ()=>{
  it("should query for events", done=>{
    done();
    /*
    let fromBlock = 7739950;
    let toBlock = 7739955;
    let address = "0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208";
    let apiKey = "fill_in";


    fetchABI(address)
    .then(abi=>{
      let puller = new Puller({
        abi,
        apiKey,
        web3Factory: () => new Web3(RPC_ENDPOINT),
        queryHost: "http://localhost:5000"
      });

      let web3 = new Web3(RPC_ENDPOINT);

      puller.recoverEvents({
        fromBlock,
        toBlock,
        contract: new web3.eth.Contract(abi, address, {address}),

      }, (e, bundles)=>{
        console.log("Getting bundles from BHub", JSON.stringify(bundles, null, 2));
      }).then(done).catch(e=>done(e));

    })
    .catch(e=>done(e));
    */
  }).timeout(5000);
});
