
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

  async process(ctx, bundle) {

    ctx = {
      ...ctx,
      bundle
    };

    try {
      for(let i=0;i<this.globalHandlers.length;++i) {
        let h = this.globalHandlers[i];
        if(typeof h === 'function') {
          let outB = await h(ctx);
          if(outB) {
            ctx.bundle = outB;
          }
        } else if(typeof h.process === 'function') {
          let outB = await h.process(ctx);
          if(outB) {
            ctx.bundle = outB;
          }
        }
      }

      let tgt = this.contextHandlers[bundle.fnContext];
      if(tgt) {
        for(let i=0;i<tgt.length;++i) {
          let h = tgt[i];
          if(typeof h === 'function') {
            let outB = await h(ctx);
            if(outB) {
              ctx.bundle = outB;
            }
          } else if(typeof h.process === 'function') {
            let outB = await h.process(ctx);
            if(outB) {
              ctx.bundle = outB;
            }
          }
        }
      }

    } catch (e) {
      if(this.errorHandler) {
        this.errorHandler(e);
      }
    }
  }
}
