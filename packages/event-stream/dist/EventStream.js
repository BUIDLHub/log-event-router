'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _EventNormalizer = require('./EventNormalizer');

var _EventNormalizer2 = _interopRequireDefault(_EventNormalizer);

var _EventPuller = require('./EventPuller');

var _EventPuller2 = _interopRequireDefault(_EventPuller);

var _Router = require('./Router');

var _Router2 = _interopRequireDefault(_Router);

var _yup = require('yup');

var yup = _interopRequireWildcard(_yup);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var schema = yup.object().shape({
  web3: yup.object().required("Missing event stream web3"),
  address: yup.string().required("Missing contract address for event stream")
});

var EventStream = function (_EventEmitter) {
  _inherits(EventStream, _EventEmitter);

  function EventStream(props) {
    _classCallCheck(this, EventStream);

    var _this = _possibleConstructorReturn(this, (EventStream.__proto__ || Object.getPrototypeOf(EventStream)).call(this));

    schema.validateSync(props);

    //contract address to subscribe to
    _this.address = props.address;

    //web3 impl
    _this.web3 = props.web3;

    //event subscription options (filters mainly)
    _this.options = props.options;

    //specific event to listen for
    _this.eventName = props.eventName;

    //abi for decoding the events
    var abi = props.abi;
    if (!Array.isArray(abi)) {
      throw new Error("ABI is expected to be an array of field/event defs");
    }

    //creating a contract has a side-effect of adding abi signature to every
    //function/event definition. We need these later to extract the function
    //context of event bundles.
    _this.contract = new _this.web3.eth.Contract(abi, _this.address, { address: _this.address });

    //used to pull in transactions that bundle up all events emitted together
    _this.normalizer = new _EventNormalizer2.default({
      abi: abi,
      web3: _this.web3
    });

    //utility to pull and decode the events
    _this.eventPuller = new _EventPuller2.default({
      abi: abi,
      options: _this.options,
      eventName: _this.eventName,
      address: _this.address,
      web3: _this.web3,
      normalizer: _this.normalizer
    });

    //utility to distribute txns with bundled events
    _this.router = new _Router2.default({ errorHandler: function errorHandler(e) {
        return _this.emit("error", e);
      } });

    ['start', 'use', 'stop'].forEach(function (fn) {
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
     * Be sure to install all router handlers  before starting the stream
     */

  }, {
    key: 'start',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(_ref2) {
        var _this2 = this;

        var fromBlock = _ref2.fromBlock,
            toBlock = _ref2.toBlock;
        var cb, latest, start, span, lastBlock;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (fromBlock < 0) {
                  fromBlock = 0;
                }

                //callback for event puller.

                cb = function () {
                  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(e, block) {
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.prev = 0;

                            console.log("Received block", block.number);
                            //route the block to the router for handling
                            _context.next = 4;
                            return _this2.router.process({}, block);

                          case 4:
                            _context.next = 10;
                            break;

                          case 6:
                            _context.prev = 6;
                            _context.t0 = _context['catch'](0);

                            console.log("Problem routing data", _context.t0);
                            _this2.emit("error", _context.t0);

                          case 10:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this2, [[0, 6]]);
                  }));

                  return function cb(_x2, _x3) {
                    return _ref3.apply(this, arguments);
                  };
                }();

                //first need to recover missed events since last run


                latest = toBlock;

                if (latest) {
                  _context4.next = 7;
                  break;
                }

                _context4.next = 6;
                return this.web3.eth.getBlockNumber();

              case 6:
                latest = _context4.sent;

              case 7:
                if (!(latest < fromBlock)) {
                  _context4.next = 9;
                  break;
                }

                throw new Error("Start block must come before end block: " + fromBlock + " > " + latest);

              case 9:
                start = fromBlock;
                span = latest - start;

                console.log("Scanning blocks", start, "-", latest);

                //while there is a gap in block scanning

              case 12:
                if (!(span > 0)) {
                  _context4.next = 22;
                  break;
                }

                _context4.next = 15;
                return this.eventPuller.pullEvents({
                  fromBlock: start,
                  toBlock: latest
                }, cb);

              case 15:

                //reset the start for next iteration
                start = latest + 1;

                //grab the latest right now
                _context4.next = 18;
                return this.web3.eth.getBlockNumber();

              case 18:
                latest = _context4.sent;


                //compute new span
                span = latest - start;
                _context4.next = 12;
                break;

              case 22:

                console.log("Finished recovering past events");

                //now subscribe to new blocks and trigger event pulls on each
                //new block
                this.sub = this.web3.eth.subscribe("newBlockHeaders");
                lastBlock = latest;

                this.sub.on("data", function () {
                  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(block) {
                    var _start;

                    return regeneratorRuntime.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            if (!block) {
                              _context3.next = 12;
                              break;
                            }

                            _context3.prev = 1;

                            console.log("Receiving new block", block.number);
                            //we start from the last block we pulled so that
                            //if there are missing notifications we still pull
                            //all the data
                            _start = lastBlock;


                            console.log("Pulling events between blocks", _start, "-", block.number);
                            _context3.next = 7;
                            return _this2.eventPuller.pullEvents({
                              fromBlock: _start,
                              toBlock: block.number
                            }, function () {
                              var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(e, normalizedBlock) {
                                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                                  while (1) {
                                    switch (_context2.prev = _context2.next) {
                                      case 0:
                                        if (normalizedBlock.transactions.length > 0) {
                                          lastBlock = normalizedBlock.number + 1;
                                        }
                                        _context2.prev = 1;
                                        _context2.next = 4;
                                        return _this2.router.process({}, normalizedBlock);

                                      case 4:
                                        _context2.next = 9;
                                        break;

                                      case 6:
                                        _context2.prev = 6;
                                        _context2.t0 = _context2['catch'](1);

                                        _this2.emit("error", _context2.t0);

                                      case 9:
                                      case 'end':
                                        return _context2.stop();
                                    }
                                  }
                                }, _callee2, _this2, [[1, 6]]);
                              }));

                              return function (_x5, _x6) {
                                return _ref5.apply(this, arguments);
                              };
                            }());

                          case 7:
                            _context3.next = 12;
                            break;

                          case 9:
                            _context3.prev = 9;
                            _context3.t0 = _context3['catch'](1);

                            _this2.emit("error", _context3.t0);

                          case 12:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this2, [[1, 9]]);
                  }));

                  return function (_x4) {
                    return _ref4.apply(this, arguments);
                  };
                }());

              case 26:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function start(_x) {
        return _ref.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'stop',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!this.sub) {
                  _context5.next = 4;
                  break;
                }

                _context5.next = 3;
                return this.sub.unsubscribe();

              case 3:
                this.sub = null;

              case 4:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function stop() {
        return _ref6.apply(this, arguments);
      }

      return stop;
    }()
  }]);

  return EventStream;
}(_events2.default);

exports.default = EventStream;
//# sourceMappingURL=EventStream.js.map