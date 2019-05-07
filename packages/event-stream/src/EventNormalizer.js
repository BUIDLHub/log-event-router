import * as yup from 'yup';
import _ from 'lodash';

const schema = yup.object().shape({
  web3: yup.object().required("Event normalizer requires a web3 instance"),
});

export default class EventNormalizer {
  constructor(props) {
    this.web3 = props.web3;
    let abi = props.abi;
    this.fnSigs = {};


    if(!Array.isArray(abi)) {
      throw new Error("Event normalizer requires abi array of event/function definitions");
    }

    abi.forEach(a=>{
      if(a.type === 'function') {
        if(a.signature) {
          this.fnSigs[a.signature] = a;
        }
      }
    });

    [
      'normalize'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  async normalize(event, history) {
    let retVals = event.returnValues;
    //convert big numbers to strings to simplify working with event fields
    _.keys(retVals).forEach(k=>{
      let d = retVals[k];
      if(d._ethersType === 'BigNumber') {
        retVals[k] = d.toString();
      }
    });

    let txn = history[event.transactionHash.toLowerCase()];

    if(!txn) {
      let start = Date.now();
      txn = await this.web3.eth.getTransaction(event.transactionHash);
      console.log("Retrieved txn in ", (Date.now()-start),"ms");
      if(txn) {
        history[txn.hash.toLowerCase()] = txn;

        if(txn.input && txn.input.length > 2) {

          //get the fn signature (4-bytes plus 0x)
          let sig = txn.input.substring(0, 10);

          //lookup the fn definition by this sig
          let def = this.fnSigs[sig];
          if(def) {
            //if we found a matching fn, tag the transaction with the
            //fn's name. This will be used downstream as a context for
            //all attached log events
            txn.fnContext = def.name;
          }
        } else {
          txn.fnContext = "no_input";
        }
        txn.logEvents = {};
      }
    }
    if(txn) {
      let le = {
        ...txn.logEvents
      };
      let ex = le[event.event];
      if(ex) {
        let a = [ex];
        a.push(event);
        le[event.event] = a;
      } else {
        le[event.event] = event;
      }
      txn.logEvents = le;
    }
  }
}
