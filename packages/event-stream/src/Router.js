
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

  async process(ctx, block) {
    let txns = block.transactions;
    for(let i=0;i<txns.length;++i) {
      let t = txns[i];
      let enrichedCtx = {
        ...ctx
      };
      try {
        let sub = new SubContext({
          baseContext: enrichedCtx,
          txn: t,
          handlers: this.globalHandlers
        });
        enrichedCtx = sub.ctx;
        await sub.next();
        let tgt = this.contextHandlers[t.fnContext];
        if(tgt) {
          let sub = new SubContext({
            baseContext: enrichedCtx,
            txn: t,
            handlers: tgt
          });
          await sub.next();
        }
      } catch (e) {
        if(this.errorHandler) {
          this.errorHandler(e);
        }
      }
    }
  }
}

class SubContext {
  constructor(props) {
    this.ctx = {
      ...props.baseContext,
      txn: props.txn
    };
    this.handlers = props.handlers;
    this.index = 0;
    [
      'next'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  next() {
    return new Promise(async (done,err)=>{
      let nxt = async () => {
        let h = this.handlers[this.index];
        ++this.index;
        if(h) {
          try {
            if(typeof h === 'function') {
              await h(this.ctx, nxt);
            } else if(typeof h.process === 'function'){
              await h.process(this.ctx, nxt);
            }
          } catch (e) {
            err(e);
          }
        } else {
          done();
        }
      }
      let h = this.handlers[0];
      ++this.index;
      if(h) {
        try {
          if(typeof h === 'function') {
            await h(this.ctx, nxt);
          } else if(typeof h.process === 'function') {
            await h.process(this.ctx, nxt);
          }
        } catch (e) {
          err(e);
        }
      } else {
        done();
      }
    });

  }
}
