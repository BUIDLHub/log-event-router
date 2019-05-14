import Log from 'stream-logger';

const log = new Log({component: "FnContext"});

export default class FnContext {
  constructor(props) {
    let abi = props.abi;
    if(!abi || !Array.isArray(abi)) {
      throw new Error("Expected an array of ABI in construtor");
    }
    this.fnSigs = {};
    abi.forEach(a=>{

      if(a.type === 'function') {
        if(!a.signature) {
          throw new Error("ABI function is missing signature. "  +
                         "Either hash the fn name and inputs or use eth.Contract " +
                         " to augment ABI with signature data");
        }
        this.fnSigs[a.signature.toLowerCase()] = a;
      }
    });
    [
      'process'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  process(ctx) {
    return new Promise((done,err)=>{
      let bundle = ctx.bundle;
      let txn = bundle.txn;
      if(!txn) {
        return done(bundle);
      }

      if(!txn.input) {
        done(bundle);
      }

      if(txn.input && txn.input.length > 2) {
        //get the fn signature (4-bytes plus 0x)
        let sig = txn.input.substring(0, 10);
        log.debug("FnSig from input", sig);

        //lookup the fn definition by this sig
        let def = this.fnSigs[sig];
        log.debug("Resolved fn definition", def);
        if(def) {
          //if we found a matching fn, tag the transaction with the
          //fn's name. This will be used downstream as a context for
          //all attached log events
          bundle.fnContext = def.name;
        } else {
          log.debug("Undefined function", sig);
          bundle.fnContext = sig;
        }
      } else {
        log.debug("No data input for fn context");
        bundle.fnContext = "no_input";
      }
      done(bundle);
    });
  }
}
