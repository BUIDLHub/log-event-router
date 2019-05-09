'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _yup = require('yup');

var yup = _interopRequireWildcard(_yup);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var schema = yup.object().shape({
  address: yup.string().required("Missing contract address"),
  web3: yup.object().required("Missing web3"),
  normalizer: yup.object().required("Missing event normalizer")
});

var EventPuller = function () {
  function EventPuller(props) {
    var _this = this;

    _classCallCheck(this, EventPuller);

    schema.validateSync(props);
    this.abi = props.abi;
    this.web3 = props.web3;
    this.options = props.options;
    this.eventName = props.eventName;
    this.normalizer = props.normalizer;
    this.address = props.address;
    this.contract = new this.web3.eth.Contract(this.abi, this.address, { address: this.address });
    ['pullEvents', '_doPull'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(EventPuller, [{
    key: 'pullEvents',
    value: function pullEvents(_ref, cb) {
      var _this2 = this;

      var fromBlock = _ref.fromBlock,
          toBlock = _ref.toBlock;

      return new Promise(function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(done, err) {
          var ctx;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  ctx = {
                    start: fromBlock,
                    end: toBlock,
                    history: {},
                    increment: 0,
                    finalEnd: toBlock,
                    done: done,
                    err: err
                  };

                  _this2._doPull(ctx, cb);

                case 2:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2);
        }));

        return function (_x, _x2) {
          return _ref2.apply(this, arguments);
        };
      }());
    }
  }, {
    key: '_doPull',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx, cb) {
        var span, config, evtName, start, events, block, fromChain, currentBlock, i, evt, next, newSpan;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                span = ctx.end - ctx.start;

                console.log("Querying for logs in range", ctx.start, "-", ctx.end);
                config = _extends({}, this.options, {
                  fromBlock: ctx.start,
                  toBlock: ctx.end,
                  address: this.address
                });
                _context2.prev = 3;
                evtName = this.eventName || "allEvents";
                start = Date.now();
                _context2.next = 8;
                return this.contract.getPastEvents(evtName, config);

              case 8:
                events = _context2.sent;

                console.log("Retrieved", events.length, "events in", Date.now() - start, "ms");

                //make sure we're sorted by ascending block number
                events.sort(function (a, b) {
                  return a.blockNumber - b.blockNumber;
                });

                //now with sorted blocks, we can normalize and then announce based on
                //block changes
                block = events.length > 0 ? events[0].blockNumber : 0;
                _context2.next = 14;
                return this.web3.eth.getBlock(block);

              case 14:
                fromChain = _context2.sent;
                currentBlock = {
                  number: block,
                  transactions: [],
                  timestamp: fromChain
                };
                i = 0;

              case 17:
                if (!(i < events.length)) {
                  _context2.next = 50;
                  break;
                }

                evt = events[i];

                evt.timestamp = currentBlock.timestamp;

                if (!(evt.blockNumber !== block)) {
                  _context2.next = 37;
                  break;
                }

                _context2.next = 23;
                return this.web3.eth.getBlock(evt.blockNumber);

              case 23:
                fromChain = _context2.sent;


                //new block, convert what we've built up to transaction set
                currentBlock.transactions = _lodash2.default.values(ctx.history);
                //ordered by txn index
                currentBlock.transactions.sort(function (a, b) {
                  return a.transactionIndex - b.transactionIndex;
                });
                _context2.prev = 26;
                _context2.next = 29;
                return cb(null, currentBlock);

              case 29:
                _context2.next = 34;
                break;

              case 31:
                _context2.prev = 31;
                _context2.t0 = _context2['catch'](26);

                console.log("Problem sending event block to callback", _context2.t0);

              case 34:
                currentBlock = {
                  number: evt.blockNumber,
                  transactions: [],
                  timestamp: fromChain.timestamp
                };
                ctx.history = {};
                block = evt.blockNumber;

              case 37:
                _context2.prev = 37;

                console.log("Normalizing event's transaction from block: " + evt.blockNumber);
                _context2.next = 41;
                return this.normalizer.normalize(evt, ctx.history);

              case 41:
                console.log("Txn normalized");
                _context2.next = 47;
                break;

              case 44:
                _context2.prev = 44;
                _context2.t1 = _context2['catch'](37);

                console.log("Problem normalizing", _context2.t1);

              case 47:
                ++i;
                _context2.next = 17;
                break;

              case 50:
                if (!(_lodash2.default.values(ctx.history).length > 0)) {
                  _context2.next = 61;
                  break;
                }

                //new block, convert what we've built up to transaction set
                currentBlock.transactions = _lodash2.default.values(ctx.history);
                //ordered by txn index
                currentBlock.transactions.sort(function (a, b) {
                  return a.transactionIndex - b.transactionIndex;
                });
                _context2.prev = 53;
                _context2.next = 56;
                return cb(null, currentBlock);

              case 56:
                _context2.next = 61;
                break;

              case 58:
                _context2.prev = 58;
                _context2.t2 = _context2['catch'](53);

                console.log("Problem sending event block to callback", _context2.t2);

              case 61:
                if (!(ctx.finalEnd > ctx.end)) {
                  _context2.next = 67;
                  break;
                }

                //means we had to split into sub-queries
                next = _extends({}, ctx, {
                  start: ctx.end + 1,
                  end: ctx.end + 1 + Math.ceil(ctx.increment)
                });

                console.log("Going to next pull segment", next);
                return _context2.abrupt('return', this._doPull(next, cb));

              case 67:
                console.log("Finished all segments");
                ctx.done();

              case 69:
                _context2.next = 87;
                break;

              case 71:
                _context2.prev = 71;
                _context2.t3 = _context2['catch'](3);

                if (!_context2.t3.message.includes("more than 1000 results")) {
                  _context2.next = 85;
                  break;
                }

                console.log("Have to split query apart");

                if (!(span <= 1)) {
                  _context2.next = 77;
                  break;
                }

                throw _context2.t3;

              case 77:
                //otherwise, cut the span in 1/2 and try again
                newSpan = Math.ceil(span / 2);

                if (!(newSpan === 0)) {
                  _context2.next = 80;
                  break;
                }

                throw _context2.t3;

              case 80:
                if (!(newSpan + ctx.start === ctx.start)) {
                  _context2.next = 82;
                  break;
                }

                throw _context2.t3;

              case 82:
                return _context2.abrupt('return', this._doPull(_extends({}, ctx, {
                  increment: newSpan,
                  end: newSpan + ctx.start
                }), cb));

              case 85:
                console.log("Problem pulling events", _context2.t3);
                ctx.err(_context2.t3);

              case 87:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[3, 71], [26, 31], [37, 44], [53, 58]]);
      }));

      function _doPull(_x3, _x4) {
        return _ref3.apply(this, arguments);
      }

      return _doPull;
    }()
  }]);

  return EventPuller;
}();

exports.default = EventPuller;
//# sourceMappingURL=EventPuller.js.map