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

  get bundles() {
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
    this.blockNumber = props.blockNumber;
    this.timestamp = props.timestamp;

    this._events = [];
    this._byName = {};
    [
      'addEvent'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  addEvent(evt) {
    this._events.push(evt);
    let ex = this._byName[evt.event];
    if(ex) {
      log.debug("Event with name", evt.event, "matches existing item with same name");
      if(!Array.isArray(ex)) {
        let a = [ex, evt];
        this._byName[evt.event] = a;
      } else {
        ex.push(evt);
      }
    } else {
      log.debug("Storing event with name", evt.event);
      this._byName[evt.event] = evt;
    }
  }

  get length() {
    return this._events.length;
  }

  get allEvents() {
    return this._events;
  }

  get byName() {
    return {
      ...this._byName
    }
  }
}
