"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _streamLogger = require("stream-logger");

var _streamLogger2 = _interopRequireDefault(_streamLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = new _streamLogger2.default({ component: "FnContext" });

var FnContext = function () {
  function FnContext(props) {
    var _this = this;

    _classCallCheck(this, FnContext);

    var abi = props.abi;
    if (!abi || !Array.isArray(abi)) {
      throw new Error("Expected an array of ABI in construtor");
    }
    this.fnSigs = {};
    abi.forEach(function (a) {

      if (a.type === 'function') {
        if (!a.signature) {
          throw new Error("ABI function is missing signature. " + "Either hash the fn name and inputs or use eth.Contract " + " to augment ABI with signature data");
        }
        _this.fnSigs[a.signature.toLowerCase()] = a;
      }
    });
    ['process'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(FnContext, [{
    key: "process",
    value: function process(ctx) {
      var _this2 = this;

      return new Promise(function (done, err) {
        var bundle = ctx.bundle;
        var txn = bundle.txn;
        if (!txn) {
          return done(bundle);
        }

        if (!txn.input) {
          done(bundle);
        }

        if (txn.input && txn.input.length > 2) {
          //get the fn signature (4-bytes plus 0x)
          var sig = txn.input.substring(0, 10);
          log.debug("FnSig from input", sig);

          //lookup the fn definition by this sig
          var def = _this2.fnSigs[sig];
          log.debug("Resolved fn definition", def);
          if (def) {
            //if we found a matching fn, tag the transaction with the
            //fn's name. This will be used downstream as a context for
            //all attached log events
            bundle.fnContext = def.name;
          } else {
            log.debug("Undefined function", sig);
            bundle.fnContext = sig;
          }
        } else {
          log.debug("No data input for fn context");
          bundle.fnContext = "no_input";
        }
        done(bundle);
      });
    }
  }]);

  return FnContext;
}();

exports.default = FnContext;
//# sourceMappingURL=index.js.map