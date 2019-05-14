'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _streamLogger = require('stream-logger');

var _streamLogger2 = _interopRequireDefault(_streamLogger);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = new _streamLogger2.default({ component: "TxnBundler" });

var TxnBundler = function () {
  function TxnBundler(props) {
    var _this = this;

    _classCallCheck(this, TxnBundler);

    ['process', '_getTxn'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(TxnBundler, [{
    key: 'process',
    value: function process(ctx) {
      var _this2 = this;

      return new Promise(function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(done, err) {
          var bundle, web3, hash, txn;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  bundle = ctx.bundle;

                  if (!(bundle.length === 0)) {
                    _context.next = 3;
                    break;
                  }

                  return _context.abrupt('return', done(bundle));

                case 3:
                  web3 = ctx.web3;
                  hash = bundle.transactionHash.toLowerCase();
                  txn = null;
                  _context.prev = 6;

                  log.debug("Requesting txn with hash", hash);
                  _context.next = 10;
                  return _this2._getTxn({ web3: web3, hash: hash });

                case 10:
                  txn = _context.sent;

                  log.debug("Txn result", txn);
                  _context.next = 17;
                  break;

                case 14:
                  _context.prev = 14;
                  _context.t0 = _context['catch'](6);
                  return _context.abrupt('return', err(_context.t0));

                case 17:
                  if (txn) {
                    _context.next = 20;
                    break;
                  }

                  log.warn("Missing txn with hash", hash);
                  return _context.abrupt('return', done(bundle));

                case 20:
                  bundle.txn = txn;
                  done(bundle);

                case 22:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2, [[6, 14]]);
        }));

        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }());
    }
  }, {
    key: '_getTxn',
    value: function _getTxn(_ref2) {
      var _this3 = this;

      var web3 = _ref2.web3,
          hash = _ref2.hash;

      var cb = function () {
        var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(done, err) {
          var ctx;
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  try {
                    ctx = {
                      done: done,
                      error: err,
                      web3: web3,
                      hash: hash,
                      attempt: 1,
                      maxTries: 10
                    };

                    _recursiveGetTxn(ctx);
                  } catch (e) {
                    err(e);
                  }

                case 1:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this3);
        }));

        return function cb(_x3, _x4) {
          return _ref3.apply(this, arguments);
        };
      }();

      return new Promise(cb);
    }
  }]);

  return TxnBundler;
}();

exports.default = TxnBundler;


var _recursiveGetTxn = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(ctx) {
    var txn, ctx2, _ctx;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return ctx.web3.eth.getTransaction(ctx.hash);

          case 3:
            txn = _context3.sent;

            if (txn) {
              _context3.next = 11;
              break;
            }

            if (!(ctx.attempt >= ctx.maxTries)) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt('return', ctx.error("Giving up on txn after " + ctx.maxTries + " attempts"));

          case 7:
            ctx2 = _extends({}, ctx, {
              attempt: ctx.attempt + 1
            });

            _recursiveGetTxn(ctx2);
            _context3.next = 12;
            break;

          case 11:
            ctx.done(txn);

          case 12:
            _context3.next = 20;
            break;

          case 14:
            _context3.prev = 14;
            _context3.t0 = _context3['catch'](0);

            if (!(ctx.attempt >= ctx.maxTries)) {
              _context3.next = 18;
              break;
            }

            return _context3.abrupt('return', ctx.error(_context3.t0));

          case 18:
            _ctx = _extends({}, ctx, {
              attempt: ctx.attempt + 1
            });

            _recursiveGetTxn(_ctx);

          case 20:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[0, 14]]);
  }));

  return function _recursiveGetTxn(_x5) {
    return _ref4.apply(this, arguments);
  };
}();
//# sourceMappingURL=index.js.map