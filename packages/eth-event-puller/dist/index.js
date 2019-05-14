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

var log = new _streamLogger2.default({ component: "EventPuller" });

var EventPuller = function () {
  function EventPuller(props) {
    var _this = this;

    _classCallCheck(this, EventPuller);

    ['pullEvents', '_doPull'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(EventPuller, [{
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
          start: fromBlock,
          end: toBlock,
          eventName: eventName,
          options: options,
          contract: contract,
          done: done,
          err: err,
          increment: 0,
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

                log.info("Querying for logs in range", ctx.start, "-", ctx.end);
                config = _extends({}, ctx.options, {
                  fromBlock: ctx.start,
                  toBlock: ctx.end,
                  address: this.address
                });
                _context.prev = 3;
                contract = ctx.contract;
                evtName = ctx.eventName || "allEvents";
                start = Date.now();
                _context.next = 9;
                return contract.getPastEvents(evtName, config);

              case 9:
                events = _context.sent;

                events.sort(function (a, b) {
                  var diff = a.blockNumber - b.blockNumber;
                  if (diff) {
                    return diff;
                  }
                  return a.transactionIndex - b.transactionIndex;
                });

                byBlock = byBlockAndHash(events);


                log.info("Retrieved", events.length, "events in", Date.now() - start, "ms");

                _context.prev = 13;

                log.debug("ByBlock", byBlock);

                blocks = _lodash2.default.values(byBlock);

                log.debug("Sending", blocks.length, "blocks to callback");
                i = 0;

              case 18:
                if (!(i < blocks.length)) {
                  _context.next = 25;
                  break;
                }

                b = blocks[i];
                _context.next = 22;
                return cb(null, b.bundles);

              case 22:
                ++i;
                _context.next = 18;
                break;

              case 25:
                _context.next = 30;
                break;

              case 27:
                _context.prev = 27;
                _context.t0 = _context['catch'](13);

                log.error("Problem in callback", _context.t0);

              case 30:
                if (!(ctx.finalEnd > ctx.end)) {
                  _context.next = 36;
                  break;
                }

                //means we had to split into sub-queries
                next = _extends({}, ctx, {
                  start: ctx.end + 1,
                  end: ctx.end + 1 + Math.ceil(ctx.increment)
                });

                log.debug("Going to next pull segment", next);
                return _context.abrupt('return', this._doPull(next, cb));

              case 36:
                log.debug("Finished all segments");
                ctx.done();

              case 38:
                _context.next = 56;
                break;

              case 40:
                _context.prev = 40;
                _context.t1 = _context['catch'](3);

                if (!_context.t1.message.includes("more than 1000 results")) {
                  _context.next = 54;
                  break;
                }

                log.info("Have to split query apart");

                if (!(span <= 1)) {
                  _context.next = 46;
                  break;
                }

                throw _context.t1;

              case 46:
                //otherwise, cut the span in 1/2 and try again
                newSpan = Math.ceil(span / 2);

                if (!(newSpan === 0)) {
                  _context.next = 49;
                  break;
                }

                throw _context.t1;

              case 49:
                if (!(newSpan + ctx.start === ctx.start)) {
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
        }, _callee, this, [[3, 40], [13, 27]]);
      }));

      function _doPull(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return _doPull;
    }()
  }]);

  return EventPuller;
}();

exports.default = EventPuller;


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
//# sourceMappingURL=index.js.map