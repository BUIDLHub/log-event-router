import {StatelessEventPuller as Puller} from 'eth-event-puller';
import Log from 'stream-logger';

const log = new Log({component: "EventHistory"});

export default class EventHistory {
  constructor(props) {
    this.puller = props?props.eventPuller:undefined;
    if(!this.puller) {
      this.puller = new Puller();
    }

    [
      'recoverEvents'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  recoverEvents({
    fromBlock,
    toBlock,
    eventName,
    options,
    contract
  }, callback) {
    return this.puller.pullEvents({
      fromBlock,
      toBlock,
      eventName,
      options,
      contract
    }, callback);
  }
}
