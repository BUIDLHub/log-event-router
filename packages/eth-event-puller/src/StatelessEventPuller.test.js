import {StatelessEventPuller} from './';
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

describe("StatlessEventPuller", ()=>{
  it("Should split when too large", done=>{
    let events = buildEvents(2500);

    let puller = new StatelessEventPuller();

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
    puller.pullEvents({
      fromBlock: 0,
      toBlock: 3000,
      contract: con
    }, (err, bundles)=>{
      if(err) {
        throw err;
      }
      bundles.forEach(b=>{
        totalReceived += b.allEvents.length;
      });

    }).then(()=>{
      if(totalReceived !== events.length) {
        done("Total did not match all events: " + totalReceived + " != " + events.length);
      } else {
        console.log("Total recieved", totalReceived);
        done();
      }
    });

  });
});
