
export default class Router {
  constructor(props) {
    this.globalHandlers = [];
    this.contextHandlers = {};
    this.errorHandler = props.errorHandler;

    [
      'use',
      'process'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  use(...args) {
    if(args.length === 0) {
      return this;
    }
    let context = args.shift();
    if(typeof context === 'string') {
      let ex = this.contextHandlers[context] || [];
      args.forEach(a=>ex.push(a));
      this.contextHandlers[context] = ex;
    } else {
      this.globalHandlers.push(context);
    }
    return this;
  }

  async process(ctx, txn) {

    ctx = {
      ...ctx,
      transaction: txn
    };

    try {
      for(let i=0;i<this.globalHandlers.length;++i) {
        let h = this.globalHandlers[i];
        let outTxn = null;
        if(typeof h === 'function') {
          outTxn = await h(ctx);
        } else if(typeof h.process === 'function') {
          outTxn = await h.process(ctx);
        }
        if(outTxn) {
          ctx.transaction = outTxn;
        }
      }
      let fnCtx = ctx.transaction.fnContext;
      if(fnCtx) {
        let tgt = this.contextHandlers[fnCtx];
        if(tgt) {
          for(let i=0;i<tgt.length;++i) {
            let h = tgt[i];
            let outTxn = null;
            if(typeof h === 'function') {
              outTxn = await h(ctx);
            } else if(typeof h.process === 'function') {
              outTxn = await h.process(ctx);
            }
          }
          ctx.transaction = outTxn;
        }
      }

    } catch (e) {
      if(this.errorHandler) {
        this.errorHandler(e);
      }
    }
  }
}
