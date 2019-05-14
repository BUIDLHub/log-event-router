import Log from 'stream-logger';
import _ from 'lodash';

const log = new Log({component: "TxnBundler"});

export default class TxnBundler {
  constructor(props) {
    [
      'process',
      '_getTxn'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  process(ctx) {
    return new Promise(async (done,err)=>{
      let bundle = ctx.bundle;

      if(bundle.length === 0) {
        return done(bundle);
      }

      let web3 = ctx.web3;
      let hash = bundle.transactionHash.toLowerCase();

      let txn = null;
      try {
        log.debug("Requesting txn with hash", hash);
        txn = await this._getTxn({web3, hash});
        log.debug("Txn result", txn);
      } catch (e) {
        return err(e);
      }

      if(!txn) {
        log.warn("Missing txn with hash", hash);
        return done(bundle);
      }
      bundle.txn = txn;
      done(bundle);
    });

  }

  _getTxn({web3, hash}) {
    let cb = async (done,err) => {
      try {
        let ctx = {
          done,
          error: err,
          web3,
          hash,
          attempt: 1,
          maxTries: 10
        };
        _recursiveGetTxn(ctx);
      } catch (e) {
        err(e);
      }
    }

    return new Promise(cb);
  }
}

const _recursiveGetTxn = async ctx => {
  try {
    let txn = await ctx.web3.eth.getTransaction(ctx.hash);
    if(!txn) {
      if(ctx.attempt >= ctx.maxTries) {
        return ctx.error("Giving up on txn after " + ctx.maxTries + " attempts");
      }
      let ctx2 = {
        ...ctx,
        attempt: ctx.attempt + 1
      };
      _recursiveGetTxn(ctx2);
    } else {
      ctx.done(txn);
    }
  } catch (e) {
    if(ctx.attempt >= ctx.maxTries) {
      return ctx.error(e);
    }
    let ctx2 = {
      ...ctx,
      attempt: ctx.attempt + 1
    };
    _recursiveGetTxn(ctx2);
  }
}
