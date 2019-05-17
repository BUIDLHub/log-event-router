'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _streamLogger = require('stream-logger');

var _streamLogger2 = _interopRequireDefault(_streamLogger);

var _ethData = require('eth-data');

var _ethData2 = _interopRequireDefault(_ethData);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = new _streamLogger2.default({ component: "StatefulEventPuller" });

var StatefulEventPuller = function () {
  function StatefulEventPuller(props) {
    var _this = this;

    _classCallCheck(this, StatefulEventPuller);

    ['pullEvents'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(StatefulEventPuller, [{
    key: 'pullEvents',
    value: function pullEvents(props, cb) {
      var cursor = new Cursor(props);
      return cursor.init(cb);
    }
  }]);

  return StatefulEventPuller;
}();

exports.default = StatefulEventPuller;

var Cursor = function () {
  function Cursor(props) {
    var _this2 = this;

    _classCallCheck(this, Cursor);

    this.fromBlock = props.fromBlock;
    this.toBlock = props.toBlock;
    this.finalEnd = props.toBlock;
    this.increment = 0;
    this.contract = props.contract;
    this.eventName = props.eventName;
    this.options = props.options;
    this.totalPages = 1;

    ['init', 'nextBatch', '_pull'].forEach(function (fn) {
      return _this2[fn] = _this2[fn].bind(_this2);
    });
  }

  _createClass(Cursor, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(cb) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', new Promise(function (done, err) {
                  _this3._pull(done, err, cb);
                }));

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init(_x) {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'nextBatch',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(cb) {
        var _this4 = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', new Promise(function (done, err) {
                  _this4._pull(done, err, cb);
                }));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function nextBatch(_x2) {
        return _ref2.apply(this, arguments);
      }

      return nextBatch;
    }()
  }, {
    key: '_pull',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(done, err, cb) {
        var span, config, contract, evtName, start, events, byBlock, blocks, i, b, _start, end, newSpan, totalSpan;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                span = this.toBlock - this.fromBlock;

                if (!(span < 0)) {
                  _context3.next = 4;
                  break;
                }

                log.error("Invalid block range. Start is before end", this.fromBlock, this.toBlock);
                //return err(new Error("Start block is after end block"));
                return _context3.abrupt('return', done(undefined));

              case 4:

                log.info("Querying for logs in range", this.fromBlock, "-", this.toBlock);
                config = _extends({}, this.options, {
                  fromBlock: this.fromBlock,
                  toBlock: this.toBlock
                });
                _context3.prev = 6;
                contract = this.contract;
                evtName = this.eventName || "allEvents";
                start = Date.now();
                _context3.next = 12;
                return contract.getPastEvents(evtName, config);

              case 12:
                events = _context3.sent;


                //always make sure events are sorted by block and txn index
                events.sort(function (a, b) {
                  var diff = a.blockNumber - b.blockNumber;
                  if (diff) {
                    return diff;
                  }
                  return a.transactionIndex - b.transactionIndex;
                });

                //convert to consistent block structure
                byBlock = byBlockAndHash(events);


                log.info("Retrieved", events.length, "events in", Date.now() - start, "ms");

                _context3.prev = 16;
                blocks = _lodash2.default.values(byBlock);

                log.debug("Sending", blocks.length, "blocks to callback");
                //for each block
                i = 0;

              case 20:
                if (!(i < blocks.length)) {
                  _context3.next = 27;
                  break;
                }

                b = blocks[i];
                //send back all transaction bundles

                _context3.next = 24;
                return cb(null, b.transactions);

              case 24:
                ++i;
                _context3.next = 20;
                break;

              case 27:
                _context3.next = 32;
                break;

              case 29:
                _context3.prev = 29;
                _context3.t0 = _context3['catch'](16);

                log.error("Problem in callback", _context3.t0);

              case 32:

                //if there is more in the entire block range
                log.debug("Final end", this.finalEnd, "Current end", this.toBlock);
                if (this.finalEnd > this.toBlock) {
                  _start = this.toBlock + 1;
                  end = this.toBlock + 1 + this.increment;

                  log.debug("Going to next segement", _start, end);
                  this.fromBlock = _start;
                  this.toBlock = end;
                  done(this);
                } else {
                  log.debug("Finished all segments");
                  //otherwise scan is complete
                  done(undefined);
                }
                _context3.next = 54;
                break;

              case 36:
                _context3.prev = 36;
                _context3.t1 = _context3['catch'](6);

                if (!_context3.t1.message.includes("more than 1000 results")) {
                  _context3.next = 52;
                  break;
                }

                log.info("Have to split query apart");

                if (!(span <= 1)) {
                  _context3.next = 42;
                  break;
                }

                throw _context3.t1;

              case 42:
                //otherwise, cut the span in 1/2 and try again
                newSpan = Math.ceil(span / 2);

                //if wec can't split any lower than 1, we bail

                if (!(newSpan === 0)) {
                  _context3.next = 45;
                  break;
                }

                throw _context3.t1;

              case 45:
                totalSpan = this.finalBlock - this.fromBlock;


                this.increment = newSpan;
                this.totalPages = Math.ceil(totalSpan / this.increment);
                this.toBlock = newSpan + this.fromBlock;
                this._pull(done, err, cb);
                _context3.next = 54;
                break;

              case 52:
                log.error("Problem pulling events", _context3.t1);
                err(_context3.t1);

              case 54:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[6, 36], [16, 29]]);
      }));

      function _pull(_x3, _x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return _pull;
    }()
  }]);

  return Cursor;
}();

var byBlockAndHash = function byBlockAndHash(events) {
  return events.reduce(function (o, e) {
    var retVals = e.returnValues;
    _lodash2.default.keys(retVals).forEach(function (k) {
      var d = retVals[k];
      if (d._ethersType === 'BigNumber') {
        retVals[k] = d.toString();
      }
    });
    var block = o[e.blockNumber] || new _ethData2.default({
      number: e.blockNumber
    });
    block.addEvent(e);
    o[e.blockNumber] = block;
    return o;
  }, {});
};
//# sourceMappingURL=StatefulEventPuller.js.map