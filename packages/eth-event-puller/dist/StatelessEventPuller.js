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

var log = new _streamLogger2.default({ component: "StatelessEventPuller" });

var StatelessEventPuller = function () {
  function StatelessEventPuller(props) {
    var _this = this;

    _classCallCheck(this, StatelessEventPuller);

    ['pullEvents', '_doPull'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(StatelessEventPuller, [{
    key: 'pullEvents',
    value: function pullEvents(_ref, cb) {
      var _this2 = this;

      var fromBlock = _ref.fromBlock,
          toBlock = _ref.toBlock,
          contract = _ref.contract,
          eventName = _ref.eventName,
          options = _ref.options;

      return new Promise(function (done, err) {
        var ctx = {
          //starting block to pull events from
          start: fromBlock,

          //ending block range
          end: toBlock,

          //optional specific event name to pull
          eventName: eventName,

          //same options you can pass to contract getPastEvents
          options: options,

          //contract to pull events from
          contract: contract,

          //all finished callback
          done: done,

          //any problems callback
          err: err,

          //any split increments to apply as we work towards end block
          increment: 0,

          //ultimately where to stop regardless of page splitting
          finalEnd: toBlock
        };

        _this2._doPull(ctx, cb);
      });
    }
  }, {
    key: '_doPull',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx, cb) {
        var span, config, contract, evtName, start, events, byBlock, blocks, i, b, next, newSpan;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                span = ctx.end - ctx.start;

                if (!(span < 0)) {
                  _context.next = 4;
                  break;
                }

                log.error("Invalid block range. Start is before end");
                //return ctx.err(new Error("Start block is after end block"));
                return _context.abrupt('return', ctx.done());

              case 4:

                log.info("Querying for logs in range", ctx.start, "-", ctx.end);
                config = _extends({}, ctx.options, {
                  fromBlock: ctx.start,
                  toBlock: ctx.end
                });
                _context.prev = 6;
                contract = ctx.contract;
                evtName = ctx.eventName || "allEvents";
                start = Date.now();
                _context.next = 12;
                return contract.getPastEvents(evtName, config);

              case 12:
                events = _context.sent;


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

                _context.prev = 16;
                blocks = _lodash2.default.values(byBlock);

                log.debug("Sending", blocks.length, "blocks to callback");
                //for each block
                i = 0;

              case 20:
                if (!(i < blocks.length)) {
                  _context.next = 27;
                  break;
                }

                b = blocks[i];
                //send back all transaction bundles

                _context.next = 24;
                return cb(null, b.transactions);

              case 24:
                ++i;
                _context.next = 20;
                break;

              case 27:
                _context.next = 32;
                break;

              case 29:
                _context.prev = 29;
                _context.t0 = _context['catch'](16);

                log.error("Problem in callback", _context.t0);

              case 32:
                if (!(ctx.finalEnd > ctx.end)) {
                  _context.next = 38;
                  break;
                }

                //split into sub-query
                next = _extends({}, ctx, {

                  //new start is 1 past current end
                  start: ctx.end + 1,

                  //new end is next increment in range
                  end: ctx.end + 1 + Math.ceil(ctx.increment)
                });


                log.debug("Going to next pull segment", next);
                return _context.abrupt('return', this._doPull(next, cb));

              case 38:
                log.debug("Finished all segments");
                //otherwise scan is complete
                ctx.done();

              case 40:
                _context.next = 56;
                break;

              case 42:
                _context.prev = 42;
                _context.t1 = _context['catch'](6);

                if (!_context.t1.message.includes("more than 1000 results")) {
                  _context.next = 54;
                  break;
                }

                log.info("Have to split query apart");

                if (!(span <= 1)) {
                  _context.next = 48;
                  break;
                }

                throw _context.t1;

              case 48:
                //otherwise, cut the span in 1/2 and try again
                newSpan = Math.ceil(span / 2);

                //if wec can't split any lower than 1, we bail

                if (!(newSpan === 0)) {
                  _context.next = 51;
                  break;
                }

                throw _context.t1;

              case 51:
                return _context.abrupt('return', this._doPull(_extends({}, ctx, {
                  increment: newSpan,
                  end: newSpan + ctx.start
                }), cb));

              case 54:
                log.error("Problem pulling events", _context.t1);
                ctx.err(_context.t1);

              case 56:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[6, 42], [16, 29]]);
      }));

      function _doPull(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return _doPull;
    }()
  }]);

  return StatelessEventPuller;
}();

exports.default = StatelessEventPuller;


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
//# sourceMappingURL=StatelessEventPuller.js.map