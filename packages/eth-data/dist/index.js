'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _streamLogger = require('stream-logger');

var _streamLogger2 = _interopRequireDefault(_streamLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = new _streamLogger2.default({ component: "EthBlock" });

var EthBlock = function () {
  function EthBlock(props) {
    var _this = this;

    _classCallCheck(this, EthBlock);

    this.number = props ? props.number : undefined;
    this.timestamp = props ? props.timestamp : undefined;

    this._byHash = {};
    ['addEvent'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(EthBlock, [{
    key: 'addEvent',
    value: function addEvent(evt) {
      var hash = evt.transactionHash;
      if (!hash) {
        throw new Error("Missing transactionHash in event");
      }
      hash = hash.toLowerCase();
      var bundle = this._byHash[hash];
      if (!bundle) {
        log.debug("Creating event bundle for hash", hash);
        bundle = new EventBundle({
          transactionHash: hash,
          blockNumber: this.number,
          timestamp: this.timestamp
        });
        this._byHash[hash] = bundle;
      }
      bundle.addEvent(evt);
    }
  }, {
    key: 'bundles',
    get: function get() {
      return _lodash2.default.values(this._byHash);
    }
  }, {
    key: 'byHash',
    get: function get() {
      return _extends({}, this._byHash);
    }
  }]);

  return EthBlock;
}();

exports.default = EthBlock;

var EventBundle = function () {
  function EventBundle(props) {
    var _this2 = this;

    _classCallCheck(this, EventBundle);

    this.transactionHash = props.transactionHash;
    this.blockNumber = props.blockNumber;
    this.timestamp = props.timestamp;

    this._events = [];
    this._byName = {};
    ['addEvent'].forEach(function (fn) {
      return _this2[fn] = _this2[fn].bind(_this2);
    });
  }

  _createClass(EventBundle, [{
    key: 'addEvent',
    value: function addEvent(evt) {
      this._events.push(evt);
      var ex = this._byName[evt.event];
      if (ex) {
        log.debug("Event with name", evt.event, "matches existing item with same name");
        if (!Array.isArray(ex)) {
          var a = [ex, evt];
          this._byName[evt.event] = a;
        } else {
          ex.push(evt);
        }
      } else {
        log.debug("Storing event with name", evt.event);
        this._byName[evt.event] = evt;
      }
    }
  }, {
    key: 'length',
    get: function get() {
      return this._events.length;
    }
  }, {
    key: 'allEvents',
    get: function get() {
      return this._events;
    }
  }, {
    key: 'byName',
    get: function get() {
      return _extends({}, this._byName);
    }
  }]);

  return EventBundle;
}();
//# sourceMappingURL=index.js.map