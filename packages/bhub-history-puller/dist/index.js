'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _streamLogger = require('stream-logger');

var _streamLogger2 = _interopRequireDefault(_streamLogger);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _ethData = require('eth-data');

var _ethData2 = _interopRequireDefault(_ethData);

var _ethEventPuller = require('eth-event-puller');

var _ethEventPuller2 = _interopRequireDefault(_ethEventPuller);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_HOST = "https://buidlhub.com";
var ENDPOINT = "/api/logEvents";

var log = new _streamLogger2.default({ component: "BHubHistoryPuller" });

var BHubHistoryPuller = function () {
  function BHubHistoryPuller(props) {
    var _this = this;

    _classCallCheck(this, BHubHistoryPuller);

    this.abi = props.abi;
    this.apiKey = props.apiKey;
    this.host = props.queryHost || DEFAULT_HOST;
    this.bhubUrl = this.host + ENDPOINT;

    this.web3Factory = props.web3Factory;

    if (!Array.isArray(this.abi)) {
      throw new Error("Expected ABI to be an array of definitions");
    }
    if (!this.apiKey) {
      throw new Error("Expecting valid BUIDLHub API key");
    }

    if (typeof this.web3Factory !== 'function') {
      throw new Error("Expected a web3 factory function");
    }

    this.puller = new _ethEventPuller2.default();

    ['recoverEvents', '_getEvents'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(BHubHistoryPuller, [{
    key: 'recoverEvents',
    value: function recoverEvents(_ref, callback) {
      var _this2 = this;

      var fromBlock = _ref.fromBlock,
          toBlock = _ref.toBlock,
          contract = _ref.contract,
          eventName = _ref.eventName,
          options = _ref.options;

      return this.puller.pullEvents({
        fromBlock: fromBlock,
        toBlock: toBlock,
        eventName: eventName,
        options: options,
        contract: {
          getPastEvents: function getPastEvents(eventName, config) {
            return _this2._getEvents(_extends({}, config, {
              contract: contract
            }));
          }
        }
      }, callback);
    }
  }, {
    key: '_getEvents',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref3) {
        var _this3 = this;

        var fromBlock = _ref3.fromBlock,
            toBlock = _ref3.toBlock,
            eventName = _ref3.eventName,
            options = _ref3.options,
            contract = _ref3.contract;

        var sigs, fnSigs, web3, r, eMsg, hits, allEvents, _loop, i;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(fromBlock > toBlock)) {
                  _context.next = 2;
                  break;
                }

                throw new Error("From block comes before To block");

              case 2:

                if (!this.eventSigs) {
                  sigs = {};
                  fnSigs = {};

                  this.abi.forEach(function (a) {
                    if (a.type === 'event') {
                      if (!a.signature) {
                        throw new Error("ABI is missing sigature fields. Use web3.eth.Contract to assign signature to fields");
                      }
                      sigs[a.signature] = a;
                    } else if (a.type === 'function') {
                      if (!a.signature) {
                        throw new Error("ABI is missing sigature fields. Use web3.eth.Contract to assign signature to fields");
                      }
                      fnSigs[a.signature] = a;
                    }
                  });
                  this.fnSigs = fnSigs;
                  this.eventSigs = sigs;
                }

                web3 = this.web3Factory();

                log.info("Pulling history from url", this.bhubUrl);
                log.info("Pulling history in range", fromBlock, " - ", toBlock, " with address", contract.options.address);
                _context.next = 8;
                return (0, _axios2.default)({
                  method: "POST",
                  url: this.bhubUrl,
                  data: {
                    fromBlock: fromBlock,
                    toBlock: toBlock,
                    address: contract.options.address,
                    network: 1, //only supports MAIN net right now
                    apiKey: this.apiKey
                  }
                });

              case 8:
                r = _context.sent;
                eMsg = _lodash2.default.get(r, "data.error");

                if (!eMsg) {
                  _context.next = 12;
                  break;
                }

                throw new Error(eMsg);

              case 12:
                hits = _lodash2.default.get(r, "data.hits", []);

                log.info("received", hits.length, "events from BHub");
                allEvents = [];

                _loop = function _loop(i) {
                  var h = hits[i];
                  h.logs.forEach(function (l) {
                    var topics = l.topics;
                    var data = l.data;
                    var addr = l.address;
                    var logIndex = l.logIndex;
                    var def = _this3.eventSigs[topics[0]];
                    if (def) {
                      topics.shift();
                      if (data && !data.startsWith("0x")) {
                        data = "0x" + data;
                      }
                      var _r = web3.eth.abi.decodeLog(def.inputs, data, topics);
                      _lodash2.default.keys(_r).forEach(function (k) {
                        var d = _r[k];
                        if (d._ethersType === 'BigNumber') {
                          _r[k] = d.toString();
                        }
                      });
                      allEvents.push({
                        blockNumber: h.blockNumber,
                        event: def.name,
                        transactionHash: h.transactionHash,
                        transactionIndex: h.transactionIndex,
                        logIndex: logIndex,
                        address: addr,
                        returnValues: _r
                      });
                    }
                  });
                };

                for (i = 0; i < hits.length; ++i) {
                  _loop(i);
                }
                return _context.abrupt('return', allEvents);

              case 18:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _getEvents(_x) {
        return _ref2.apply(this, arguments);
      }

      return _getEvents;
    }()
  }]);

  return BHubHistoryPuller;
}();

exports.default = BHubHistoryPuller;
//# sourceMappingURL=index.js.map