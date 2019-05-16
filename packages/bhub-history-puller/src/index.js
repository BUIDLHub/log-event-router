import axios from 'axios';
import Log from 'stream-logger';
import _ from 'lodash';
import EthBlock from 'eth-data';
import Puller from 'eth-event-puller';

const DEFAULT_HOST = "https://buidlhub.com";
const ENDPOINT = "/api/logEvents";

const log = new Log({component: "BHubHistoryPuller"});

export default class BHubHistoryPuller {
  constructor(props) {
    this.abi = props.abi;
    this.apiKey = props.apiKey;
    this.host = props.queryHost || DEFAULT_HOST;
    this.bhubUrl = this.host + ENDPOINT;

    this.web3Factory = props.web3Factory;

    if(!Array.isArray(this.abi)) {
      throw new Error("Expected ABI to be an array of definitions");
    }
    if(!this.apiKey) {
      throw new Error("Expecting valid BUIDLHub API key");
    }

    if(typeof this.web3Factory !== 'function') {
      throw new Error("Expected a web3 factory function");
    }

    this.puller = new Puller();

    [
      'recoverEvents',
      '_getEvents'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  recoverEvents({
    fromBlock,
    toBlock,
    contract,
    eventName,
    options
  }, callback) {
    return this.puller.pullEvents({
      fromBlock,
      toBlock,
      eventName,
      options,
      contract: {
        getPastEvents: (eventName, config) => {
          return this._getEvents({
            ...config,
            contract
          })
        }
      }
    }, callback);
  }

  async _getEvents({
    fromBlock,
    toBlock,
    eventName,
    options,
    contract
  }) {

    if(fromBlock > toBlock) {
      throw new Error("From block comes before To block");
    }

    if(!this.eventSigs) {
      let sigs = {};
      let fnSigs = {};
      this.abi.forEach(a=>{
        if(a.type === 'event') {
          if(!a.signature) {
            throw new Error("ABI is missing sigature fields. Use web3.eth.Contract to assign signature to fields");
          }
          sigs[a.signature] = a;
        } else if(a.type === 'function') {
          if(!a.signature) {
            throw new Error("ABI is missing sigature fields. Use web3.eth.Contract to assign signature to fields");
          }
          fnSigs[a.signature] = a;
        }
      });
      this.fnSigs = fnSigs;
      this.eventSigs = sigs;
    }

    let web3 = this.web3Factory();
    log.info("Pulling history from url", this.bhubUrl);
    log.info("Pulling history in range", fromBlock, " - ", toBlock, " with address", contract.options.address);
    let r = await axios({
      method: "POST",
      url: this.bhubUrl,
      data: {
        fromBlock,
        toBlock,
        address: contract.options.address,
        network: 1, //only supports MAIN net right now
        apiKey: this.apiKey
      }
    });
    let eMsg = _.get(r, "data.error");
    if(eMsg) {
      throw new Error(eMsg);
    }

    let hits = _.get(r, "data.hits", []);
    log.info("received", hits.length,"events from BHub");
    let allEvents = [];

    for(let i=0;i<hits.length;++i) {
      let h = hits[i];
      h.logs.forEach(l=>{
        let topics = l.topics;
        let data = l.data;
        let addr = l.address;
        let logIndex = l.logIndex;
        let def = this.eventSigs[topics[0]];
        if(def) {
          topics.shift();
          if(data && !data.startsWith("0x")) {
            data = "0x" + data;
          }
          let r = web3.eth.abi.decodeLog(def.inputs, data, topics);
          _.keys(r).forEach(k=>{
            let d = r[k];
            if(d._ethersType === 'BigNumber') {
              r[k] = d.toString();
            }
          });
          allEvents.push({
            blockNumber: h.blockNumber,
            event: def.name,
            transactionHash: h.transactionHash,
            transactionIndex: h.transactionIndex,
            logIndex: logIndex,
            address: addr,
            returnValues: r
          });
        }
      });
    }
    return allEvents;
  }

}
