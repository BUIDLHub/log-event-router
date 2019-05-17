import {StatefulEventPuller} from './';
import _ from 'lodash';

const buildEvents = (count) => {
  let events = [];
  for(let i=0;i<count;++i) {
    events.push({
      blockNumber: i,
      transactionHash: `${i}`,
      event: "FakeEvent",
      returnValues: {
        field1: "value" + i
      }
    });
  }
  return events;
}

describe("StatefulEventPuller", ()=>{
  it("Should pull events on demand", done=>{
    let events = buildEvents(2500);

    let puller = new StatefulEventPuller();

    let getEvents = async (eventName, options) => {
      if(!eventName || eventName === 'allEvents') {
        eventName = "FakeEvent";
      }
      let span = options.toBlock - options.fromBlock;
      if(span > 300) {
        throw new Error("more than 1000 results");
      }
      let start = options.fromBlock;
      let end = Math.min(events.length,options.toBlock+1);
      if(start > end) {
        return [];
      }

      let set = events.slice(start, end);
      return set;
    }

    let con = {
      getPastEvents: getEvents
    };

    let totalReceived = 0;
    let txnHandler = (err, txns)=>{
      if(err) {
        throw err;
      }
      txns.forEach(t=>{
        totalReceived += t.allEvents.length;
      });
    }

    let recursivePaging = cursor => {
      if(cursor) {
        cursor.nextBatch(txnHandler).then(recursivePaging);
      } else if(totalReceived !== events.length) {
        done("Total did not match all events: " + totalReceived + " != " + events.length);
      } else {
        console.log("Total recieved", totalReceived);
        done();
      }
    }

    puller.pullEvents({
      fromBlock: 0,
      toBlock: 3000,
      contract: con
    }, txnHandler).then(recursivePaging);
  });
});
