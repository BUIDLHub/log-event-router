'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _ethEventPuller = require('eth-event-puller');

var _ethEventPuller2 = _interopRequireDefault(_ethEventPuller);

var _EventHistory = require('./EventHistory');

var _EventHistory2 = _interopRequireDefault(_EventHistory);

var _Router = require('./Router');

var _Router2 = _interopRequireDefault(_Router);

var _yup = require('yup');

var yup = _interopRequireWildcard(_yup);

var _streamLogger = require('stream-logger');

var _streamLogger2 = _interopRequireDefault(_streamLogger);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var schema = yup.object().shape({
  web3Factory: yup.object().required("Missing event stream web3 factory function"),
  address: yup.string().required("Missing contract address for event stream")
});

var log = new _streamLogger2.default({ component: "EventStream" });

var testWeb3 = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(web3) {
    var sub;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            sub = undefined.web3.eth.subscribe("newBlockHeaders");
            _context.next = 3;
            return sub.unsubscribe();

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function testWeb3(_x) {
    return _ref.apply(this, arguments);
  };
}();

var EventStream = function (_EventEmitter) {
  _inherits(EventStream, _EventEmitter);

  function EventStream(props) {
    _classCallCheck(this, EventStream);

    var _this = _possibleConstructorReturn(this, (EventStream.__proto__ || Object.getPrototypeOf(EventStream)).call(this));

    schema.validateSync(props);

    //contract address to subscribe to
    var address = props.address;

    _this.web3Factory = props.web3Factory;
    if (typeof _this.web3Factory !== 'function') {
      throw new Error("Web3 factory is not a function");
    }

    //abi for decoding the events
    var abi = props.abi;
    if (!Array.isArray(abi)) {
      throw new Error("ABI is expected to be an array of field/event defs");
    }

    //web3 for setup
    var web3 = _this.web3Factory();

    //creating a contract has a side-effect of adding abi signature to every
    //function/event definition. We need these later to extract the function
    //context of event bundles.
    _this.contract = new web3.eth.Contract(abi, address, { address: address });

    //to recover historical data
    _this.eventHistory = props.eventHistory || new _EventHistory2.default();

    //to pull current events
    _this.eventPuller = props.eventPuller || new _ethEventPuller2.default();

    //utility to distribute txns with bundled events
    _this.router = new _Router2.default({ errorHandler: function errorHandler(e) {
        return _this.emit("error", e);
      } });
    ['start', 'use', 'stop', '_handleBlockBundles'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
    return _this;
  }

  _createClass(EventStream, [{
    key: 'use',
    value: function use() {
      var _router;

      (_router = this.router).use.apply(_router, arguments);
    }

    /**
     * Start the stream and start scanning from the fromBlock-toBlock range.
     * Optionally provide a specific event to query, filter options, and a
     * block lag to stay behind the top of the chain by a certain number of
     * blocks. Historical event recovery happens first and once that is complete,
     * event subscriptions begin and the async promise from this fn will complete.
     *
     * Be sure to install all router handlers before starting the stream
     */

  }, {
    key: 'start',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(_ref3) {
        var _this2 = this;

        var fromBlock = _ref3.fromBlock,
            toBlock = _ref3.toBlock,
            eventName = _ref3.eventName,
            options = _ref3.options,
            lag = _ref3.lag;
        var web3, latest, start, span, s, lastBlock, subHandler;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (fromBlock < 0) {
                  fromBlock = 0;
                }
                if (isNaN(lag)) {
                  lag = 0;
                }

                web3 = this.web3Factory();
                //see if we can subscribe

                _context3.prev = 3;
                _context3.next = 6;
                return testWeb3(web3);

              case 6:
                _context3.next = 11;
                break;

              case 8:
                _context3.prev = 8;
                _context3.t0 = _context3['catch'](3);

                this.pollWeb3 = true;

              case 11:

                //first need to recover missed events since last run
                latest = toBlock;

                if (latest) {
                  _context3.next = 17;
                  break;
                }

                _context3.next = 15;
                return web3.eth.getBlockNumber();

              case 15:
                latest = _context3.sent;

                latest -= lag;

              case 17:
                if (!(latest < fromBlock)) {
                  _context3.next = 19;
                  break;
                }

                throw new Error("Start block must come before end block: " + fromBlock + " > " + latest);

              case 19:
                start = fromBlock;
                span = latest - start;

                log.debug("Scanning blocks", start, "-", latest);
                s = Date.now();

                //while there is a gap in block scanning

              case 23:
                if (!(span > 0)) {
                  _context3.next = 36;
                  break;
                }

                _context3.next = 26;
                return this.eventHistory.recoverEvents({
                  fromBlock: start,
                  toBlock: latest,
                  eventName: eventName,
                  options: options,
                  contract: this.contract
                }, function (e, bundles) {
                  return _this2._handleBlockBundles(e, { web3: web3 }, bundles);
                });

              case 26:

                log.info("Finished recovering batch of events...");

                //reset the start for next iteration
                start = latest + 1;

                //grab the latest right now
                _context3.next = 30;
                return web3.eth.getBlockNumber();

              case 30:
                latest = _context3.sent;

                latest -= lag;

                //compute new span
                span = latest - start;
                log.info("New end block is", latest, "and new span is", span);
                _context3.next = 23;
                break;

              case 36:

                log.info("Finished recovering past events in", Date.now() - s, "ms");
                lastBlock = latest;

                subHandler = function () {
                  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(block) {
                    var _start;

                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            if (!block) {
                              _context2.next = 13;
                              break;
                            }

                            _context2.prev = 1;

                            log.info("Receiving new block", block.number);
                            //we start from the last block we pulled so that
                            //if there are missing notifications we still pull
                            //all the data
                            _start = lastBlock + 1;

                            if (!(_start < block.number)) {
                              _context2.next = 8;
                              break;
                            }

                            log.debug("Pulling events between blocks", _start, "-", block.number);
                            _context2.next = 8;
                            return _this2.eventPuller.pullEvents({
                              fromBlock: _start,
                              toBlock: block.number - lag,
                              eventName: eventName,
                              options: options,
                              contract: _this2.contract
                            }, function (e, bundles) {
                              if (bundles.length > 0) {
                                var hi = lastBlock;
                                bundles.forEach(function (b) {
                                  if (b.blockNumber > hi) {
                                    hi = b.blockNumber;
                                  }
                                });
                                lastBlock = hi;
                              }
                              _this2._handleBlockBundles(e, { web3: web3 }, bundles);
                            });

                          case 8:
                            _context2.next = 13;
                            break;

                          case 10:
                            _context2.prev = 10;
                            _context2.t0 = _context2['catch'](1);

                            _this2.emit("error", _context2.t0);

                          case 13:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this2, [[1, 10]]);
                  }));

                  return function subHandler(_x3) {
                    return _ref4.apply(this, arguments);
                  };
                }();

                this.sub = new SubManager({
                  web3Factory: this.web3Factory,
                  startBlock: lastBlock + 1,
                  handler: subHandler,
                  pollWeb3: this.pollWeb3
                });

                //now subscribe to new blocks and trigger event pulls on each
                //new block
                this.sub.start();

              case 41:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[3, 8]]);
      }));

      function start(_x2) {
        return _ref2.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'stop',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!this.sub) {
                  _context4.next = 4;
                  break;
                }

                _context4.next = 3;
                return this.sub.unsubscribe();

              case 3:
                this.sub = null;

              case 4:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function stop() {
        return _ref5.apply(this, arguments);
      }

      return stop;
    }()
  }, {
    key: '_handleBlockBundles',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(e, ctx, bundles) {
        var i;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!bundles) {
                  _context5.next = 15;
                  break;
                }

                log.debug("Getting", bundles.length, "bundles in stream callback");
                i = 0;

              case 3:
                if (!(i < bundles.length)) {
                  _context5.next = 15;
                  break;
                }

                _context5.prev = 4;
                _context5.next = 7;
                return this.router.process(ctx, bundles[i]);

              case 7:
                _context5.next = 12;
                break;

              case 9:
                _context5.prev = 9;
                _context5.t0 = _context5['catch'](4);

                log.error("Problem routing bundle", _context5.t0);

              case 12:
                ++i;
                _context5.next = 3;
                break;

              case 15:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[4, 9]]);
      }));

      function _handleBlockBundles(_x4, _x5, _x6) {
        return _ref6.apply(this, arguments);
      }

      return _handleBlockBundles;
    }()
  }]);

  return EventStream;
}(_events2.default);

exports.default = EventStream;


var POLL_PERIOD = 15000;

var SubManager = function () {
  function SubManager(props) {
    var _this3 = this;

    _classCallCheck(this, SubManager);

    this.web3Factory = props.web3Factory;
    this.startBlock = props.startBlock;
    this.pollWeb3 = props.pollWeb3;
    this.handler = props.handler;
    ['start', 'unsubscribe', '_startPoll'].forEach(function (fn) {
      return _this3[fn] = _this3[fn].bind(_this3);
    });
  }

  _createClass(SubManager, [{
    key: 'start',
    value: function start() {
      if (this.pollWeb3) {
        return this._startPoll();
      }

      log.info("Using new block subscriptions");
      this.web3 = this.web3Factory();
      this.sub = this.web3.eth.subscribe("newBlockHeaders");
      this.sub.on("data", this.handler);
    }
  }, {
    key: 'unsubscribe',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!this.sub) {
                  _context6.next = 6;
                  break;
                }

                _context6.next = 3;
                return this.sub.unsubscribe();

              case 3:
                this.sub = null;
                _context6.next = 7;
                break;

              case 6:
                if (this.toID) {
                  clearInterval(this.toID);
                  this.toID = null;
                }

              case 7:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function unsubscribe() {
        return _ref7.apply(this, arguments);
      }

      return unsubscribe;
    }()
  }, {
    key: '_startPoll',
    value: function _startPoll() {
      var _this4 = this;

      log.info("Using polling to get new blocks");

      var running = false;
      var poll = function () {
        var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
          var web3, latest, block;
          return regeneratorRuntime.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:

                  running = true;
                  web3 = _this4.web3Factory();
                  _context7.next = 4;
                  return web3.eth.getBlockNumber();

                case 4:
                  latest = _context7.sent;
                  _context7.prev = 5;

                  log.info("Getting new blocks from", _this4.startBlock, "to", latest);

                  if (!(latest === _this4.startBlock)) {
                    _context7.next = 9;
                    break;
                  }

                  return _context7.abrupt('return');

                case 9:
                  _context7.next = 11;
                  return web3.eth.getBlock(latest);

                case 11:
                  block = _context7.sent;

                  if (!block) {
                    _context7.next = 22;
                    break;
                  }

                  _this4.startBlock = latest;
                  _context7.prev = 14;
                  _context7.next = 17;
                  return _this4.handler(block);

                case 17:
                  _context7.next = 22;
                  break;

                case 19:
                  _context7.prev = 19;
                  _context7.t0 = _context7['catch'](14);

                  log.error("Problem calling subscription handler", _context7.t0);

                case 22:
                  _context7.prev = 22;

                  running = false;
                  return _context7.finish(22);

                case 25:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7, _this4, [[5,, 22, 25], [14, 19]]);
        }));

        return function poll() {
          return _ref8.apply(this, arguments);
        };
      }();

      this.toID = setInterval(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (running) {
                  _context8.next = 3;
                  break;
                }

                _context8.next = 3;
                return poll();

              case 3:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, _this4);
      })), POLL_PERIOD);
    }
  }]);

  return SubManager;
}();
//# sourceMappingURL=EventStream.js.map