'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var homedir = require('os').homedir();
var baseDir = _path2.default.join(homedir, "log_event_streams");
var _read = function _read(dbName) {
  var f = _path2.default.join(baseDir, dbName);
  if (_fs2.default.existsSync(f)) {
    var data = _fs2.default.readFileSync(f, { encoding: "utf8" });
    return JSON.parse(data);
  }
  return {};
};

var _write = function _write(dbName, data) {
  if (!_fs2.default.existsSync(baseDir)) {
    _fs2.default.mkdirSync(baseDir, { recursive: true });
  }
  var f = _path2.default.join(baseDir, dbName);

  if (typeof data !== 'string') {
    data = JSON.stringify(data);
  }
  _fs2.default.writeFileSync(f, data);
};

var execCallback = function execCallback(prom, cb) {
  if (typeof cb !== 'function') {
    return;
  }

  prom.then(function (r) {
    return cb(null, r);
  }).catch(function (e) {
    return cb(e);
  });
};

var asProm = function asProm(fn) {
  return new Promise(function (done, err) {
    try {
      var r = fn();
      done(r);
    } catch (e) {
      err(e);
    }
  });
};

var LocalFSDriver = function () {
  function LocalFSDriver() {
    var _this = this;

    _classCallCheck(this, LocalFSDriver);

    this._driver = 'localFSDriver';
    this.data = {};
    ['_initStorage', 'clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(LocalFSDriver, [{
    key: '_initStorage',
    value: function _initStorage(options) {
      var _this2 = this;

      return asProm(function () {
        _this2.dbName = options.name;
        _this2.data = _read(options.name);
      });
    }
  }, {
    key: 'clear',
    value: function clear(callback) {
      var _this3 = this;

      var p = asProm(function () {
        _this3.data = {};
        _write(_this3.dbName, _this3.data);
      });
      execCallback(p, callback);
      return p;
    }
  }, {
    key: 'getItem',
    value: function getItem(key, callback) {
      var _this4 = this;

      var p = asProm(function () {
        return _this4.data[key];
      });
      execCallback(p, callback);
      return p;
    }
  }, {
    key: 'iterate',
    value: function iterate(iterator, successCallback) {
      var _this5 = this;

      var p = asProm(function () {
        var keys = _lodash2.default.keys(_this5.data);
        keys.sort();
        keys.forEach(function (k, i) {
          var v = _this5.data[k];
          iterator(v, k, i);
        });
      });
      execCallback(p, successCallback);
      return p;
    }
  }, {
    key: 'key',
    value: function key(n, callback) {
      var _this6 = this;

      var p = asProm(function () {
        var keys = _lodash2.default.keys(_this6.data);
        keys.sort();
        var k = keys[n];
        return _this6.data[k];
      });
      execCallback(p, callback);
      return p;
    }
  }, {
    key: 'keys',
    value: function keys(callback) {
      var _this7 = this;

      var p = asProm(function () {
        var keys = _lodash2.default.keys(_this7.data);
        keys.sort();
        return keys;
      });
      execCallback(p, callback);
      return p;
    }
  }, {
    key: 'length',
    value: function length(callback) {
      var _this8 = this;

      var p = asProm(function () {
        var keys = _lodash2.default.keys(_this8.data);
        return keys.length;
      });
      execCallback(p, callback);
      return p;
    }
  }, {
    key: 'removeItem',
    value: function removeItem(key, callback) {
      var _this9 = this;

      var p = asProm(function () {
        if (_this9.data[key]) {
          delete _this9.data[key];
          _write(_this9.dbName, _this9.data);
        }
      });
      execCallback(p, callback);
      return p;
    }
  }, {
    key: 'setItem',
    value: function setItem(key, value, callback) {
      var _this10 = this;

      var p = asProm(function () {
        _this10.data[key] = value;
        _write(_this10.dbName, _this10.data);
      });
      execCallback(p, callback);
      return p;
    }
  }]);

  return LocalFSDriver;
}();

exports.default = LocalFSDriver;
//# sourceMappingURL=LocalFSStorage.js.map