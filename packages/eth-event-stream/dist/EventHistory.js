'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ethEventPuller = require('eth-event-puller');

var _ethEventPuller2 = _interopRequireDefault(_ethEventPuller);

var _streamLogger = require('stream-logger');

var _streamLogger2 = _interopRequireDefault(_streamLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = new _streamLogger2.default({ component: "EventHistory" });

var EventHistory = function () {
  function EventHistory(props) {
    var _this = this;

    _classCallCheck(this, EventHistory);

    this.puller = props ? props.eventPuller : undefined;
    if (!this.puller) {
      this.puller = new _ethEventPuller2.default();
    }

    ['recoverEvents'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(EventHistory, [{
    key: 'recoverEvents',
    value: function recoverEvents(_ref, callback) {
      var fromBlock = _ref.fromBlock,
          toBlock = _ref.toBlock,
          eventName = _ref.eventName,
          options = _ref.options,
          contract = _ref.contract;

      return this.puller.pullEvents({
        fromBlock: fromBlock,
        toBlock: toBlock,
        eventName: eventName,
        options: options,
        contract: contract
      }, callback);
    }
  }]);

  return EventHistory;
}();

exports.default = EventHistory;
//# sourceMappingURL=EventHistory.js.map