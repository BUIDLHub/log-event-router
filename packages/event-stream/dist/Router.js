'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Router = function () {
  function Router(props) {
    var _this = this;

    _classCallCheck(this, Router);

    this.globalHandlers = [];
    this.contextHandlers = {};
    this.errorHandler = props.errorHandler;

    ['use', 'process'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(Router, [{
    key: 'use',
    value: function use() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 0) {
        return this;
      }
      var context = args.shift();
      if (typeof context === 'string') {
        var ex = this.contextHandlers[context] || [];
        args.forEach(function (a) {
          return ex.push(a);
        });
        this.contextHandlers[context] = ex;
      } else {
        this.globalHandlers.push(context);
      }
      return this;
    }
  }, {
    key: 'process',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx, block) {
        var txns, i, t, enrichedCtx, sub, tgt, _sub;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                txns = block.transactions;
                i = 0;

              case 2:
                if (!(i < txns.length)) {
                  _context.next = 23;
                  break;
                }

                t = txns[i];
                enrichedCtx = _extends({}, ctx);
                _context.prev = 5;
                sub = new SubContext({
                  baseContext: enrichedCtx,
                  txn: t,
                  handlers: this.globalHandlers
                });

                enrichedCtx = sub.ctx;
                _context.next = 10;
                return sub.next();

              case 10:
                tgt = this.contextHandlers[t.fnContext];

                if (!tgt) {
                  _context.next = 15;
                  break;
                }

                _sub = new SubContext({
                  baseContext: enrichedCtx,
                  txn: t,
                  handlers: tgt
                });
                _context.next = 15;
                return _sub.next();

              case 15:
                _context.next = 20;
                break;

              case 17:
                _context.prev = 17;
                _context.t0 = _context['catch'](5);

                if (this.errorHandler) {
                  this.errorHandler(_context.t0);
                }

              case 20:
                ++i;
                _context.next = 2;
                break;

              case 23:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[5, 17]]);
      }));

      function process(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return process;
    }()
  }]);

  return Router;
}();

exports.default = Router;

var SubContext = function () {
  function SubContext(props) {
    var _this2 = this;

    _classCallCheck(this, SubContext);

    this.ctx = _extends({}, props.baseContext, {
      txn: props.txn
    });
    this.handlers = props.handlers;
    this.index = 0;
    ['next'].forEach(function (fn) {
      return _this2[fn] = _this2[fn].bind(_this2);
    });
  }

  _createClass(SubContext, [{
    key: 'next',
    value: function next() {
      var _this3 = this;

      return new Promise(function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(done, err) {
          var nxt, h;
          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  nxt = function () {
                    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                      var h;
                      return regeneratorRuntime.wrap(function _callee2$(_context2) {
                        while (1) {
                          switch (_context2.prev = _context2.next) {
                            case 0:
                              h = _this3.handlers[_this3.index];

                              ++_this3.index;

                              if (!h) {
                                _context2.next = 19;
                                break;
                              }

                              _context2.prev = 3;

                              if (!(typeof h === 'function')) {
                                _context2.next = 9;
                                break;
                              }

                              _context2.next = 7;
                              return h(_this3.ctx, nxt);

                            case 7:
                              _context2.next = 12;
                              break;

                            case 9:
                              if (!(typeof h.process === 'function')) {
                                _context2.next = 12;
                                break;
                              }

                              _context2.next = 12;
                              return h.process(_this3.ctx, nxt);

                            case 12:
                              _context2.next = 17;
                              break;

                            case 14:
                              _context2.prev = 14;
                              _context2.t0 = _context2['catch'](3);

                              err(_context2.t0);

                            case 17:
                              _context2.next = 20;
                              break;

                            case 19:
                              done();

                            case 20:
                            case 'end':
                              return _context2.stop();
                          }
                        }
                      }, _callee2, _this3, [[3, 14]]);
                    }));

                    return function nxt() {
                      return _ref3.apply(this, arguments);
                    };
                  }();

                  h = _this3.handlers[0];

                  ++_this3.index;

                  if (!h) {
                    _context3.next = 20;
                    break;
                  }

                  _context3.prev = 4;

                  if (!(typeof h === 'function')) {
                    _context3.next = 10;
                    break;
                  }

                  _context3.next = 8;
                  return h(_this3.ctx, nxt);

                case 8:
                  _context3.next = 13;
                  break;

                case 10:
                  if (!(typeof h.process === 'function')) {
                    _context3.next = 13;
                    break;
                  }

                  _context3.next = 13;
                  return h.process(_this3.ctx, nxt);

                case 13:
                  _context3.next = 18;
                  break;

                case 15:
                  _context3.prev = 15;
                  _context3.t0 = _context3['catch'](4);

                  err(_context3.t0);

                case 18:
                  _context3.next = 21;
                  break;

                case 20:
                  done();

                case 21:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this3, [[4, 15]]);
        }));

        return function (_x3, _x4) {
          return _ref2.apply(this, arguments);
        };
      }());
    }
  }]);

  return SubContext;
}();
//# sourceMappingURL=Router.js.map