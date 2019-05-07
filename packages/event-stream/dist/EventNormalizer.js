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
  web3: yup.object().required("Event normalizer requires a web3 instance")
});

var EventNormalizer = function () {
  function EventNormalizer(props) {
    var _this = this;

    _classCallCheck(this, EventNormalizer);

    this.web3 = props.web3;
    var abi = props.abi;
    this.fnSigs = {};

    if (!Array.isArray(abi)) {
      throw new Error("Event normalizer requires abi array of event/function definitions");
    }

    abi.forEach(function (a) {
      if (a.type === 'function') {
        if (a.signature) {
          _this.fnSigs[a.signature] = a;
        }
      }
    });

    ['normalize'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(EventNormalizer, [{
    key: 'normalize',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(event, history) {
        var retVals, txn, start, sig, def, le, ex, a;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                retVals = event.returnValues;
                //convert big numbers to strings to simplify working with event fields

                _lodash2.default.keys(retVals).forEach(function (k) {
                  var d = retVals[k];
                  if (d._ethersType === 'BigNumber') {
                    retVals[k] = d.toString();
                  }
                });

                txn = history[event.transactionHash.toLowerCase()];

                if (txn) {
                  _context.next = 10;
                  break;
                }

                start = Date.now();
                _context.next = 7;
                return this.web3.eth.getTransaction(event.transactionHash);

              case 7:
                txn = _context.sent;

                console.log("Retrieved txn in ", Date.now() - start, "ms");
                if (txn) {
                  history[txn.hash.toLowerCase()] = txn;

                  if (txn.input && txn.input.length > 2) {

                    //get the fn signature (4-bytes plus 0x)
                    sig = txn.input.substring(0, 10);

                    //lookup the fn definition by this sig

                    def = this.fnSigs[sig];

                    if (def) {
                      //if we found a matching fn, tag the transaction with the
                      //fn's name. This will be used downstream as a context for
                      //all attached log events
                      txn.fnContext = def.name;
                    }
                  } else {
                    txn.fnContext = "no_input";
                  }
                  txn.logEvents = {};
                }

              case 10:
                if (txn) {
                  le = _extends({}, txn.logEvents);
                  ex = le[event.event];

                  if (ex) {
                    a = [ex];

                    a.push(event);
                    le[event.event] = a;
                  } else {
                    le[event.event] = event;
                  }
                  txn.logEvents = le;
                }

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function normalize(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return normalize;
    }()
  }]);

  return EventNormalizer;
}();

exports.default = EventNormalizer;
//# sourceMappingURL=EventNormalizer.js.map