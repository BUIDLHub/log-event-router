import _ from 'lodash';
import Log from 'stream-logger';

const log = new Log({component: "EthBlock"});

export default class EthBlock {
  constructor(props) {
    this.number = props?props.number:undefined;
    this.timestamp = props?props.timestamp:undefined;

    this._byHash = {};
    [
      'addEvent'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  get transactions() {
    return _.values(this._byHash);
  }

  get byHash() {
    return {
      ...this._byHash
    }
  }

  addEvent(evt) {
    let hash = evt.transactionHash;
    if(!hash) {
      throw new Error("Missing transactionHash in event");
    }
    hash = hash.toLowerCase();
    let bundle = this._byHash[hash];
    if(!bundle) {
      log.debug("Creating event bundle for hash", hash);
      bundle = new EventBundle({
        transactionHash: hash,
        transactionIndex: evt.transactionIndex,
        blockNumber: this.number,
        timestamp: this.timestamp
      });
      this._byHash[hash] = bundle;
    }
    bundle.addEvent(evt);
  }
}

class EventBundle {
  constructor(props) {
    this.transactionHash = props.transactionHash;
    this.transactionIndex = props.transactionIndex;
    this.blockNumber = props.blockNumber;
    this.timestamp = props.timestamp;

    this.allEvents = [];
    this.logEvents = {};
    [
      'addEvent'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  addEvent(evt) {
    this.allEvents.push(evt);
    this.allEvents.sort((a,b)=>a.logIndex-b.logIndex);
    let a = this.logEvents[evt.event] || [];
    a.push(evt);
    a.sort((a,b)=>a.logIndex-b.logIndex);
    this.logEvents[evt.event] = a;
  }

}
