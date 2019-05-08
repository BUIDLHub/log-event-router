'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _localforage = require('localforage');

var _localforage2 = _interopRequireDefault(_localforage);

var _localforageSetitems = require('localforage-setitems');

var _BaseDB2 = require('./BaseDB');

var _BaseDB3 = _interopRequireDefault(_BaseDB2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _LocalFSStorage = require('./LocalFSStorage');

var _LocalFSStorage2 = _interopRequireDefault(_LocalFSStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

(0, _localforageSetitems.extendPrototype)(_localforage2.default);

var canStoreInLN = function canStoreInLN() {
  try {

    localStorage.setItem("__test", "true");

    var i = localStorage.getItem("__test");
    console.log("LS test", i);
    if (!i) {
      return false;
    }
    localStorage.removeItem("__test");
    return true;
  } catch (e) {
    console.log("Problem storing LS", e);
    return false;
  }
};

var localStorageValid = function localStorageValid() {
  console.log("Testing local storage");
  return typeof localStorage !== 'undefined' && 'setItem' in localStorage && canStoreInLS();
};

var dbFactory = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(props) {
    var db;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _localforage2.default.createInstance({
              name: props.name,
              driver: "localFSDriver"
            });

          case 2:
            db = _context.sent;
            return _context.abrupt('return', db);

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function dbFactory(_x) {
    return _ref.apply(this, arguments);
  };
}();

var _buildSortFn = function _buildSortFn(props) {
  if (!props.sort) {
    props.sort = [{
      field: "blockNumber",
      order: "desc"
    }];
  }

  var sorter = function sorter(set, fld, isAsc) {
    set.sort(function (a, b) {
      var av = a[fld];
      var bv = b[fld];
      if (av > bv) {
        return isAsc ? 1 : -1;
      }
      if (av < bv) {
        return isAsc ? -1 : 1;
      }
      return 0;
    });
  };
  return function (set) {
    props.sort.forEach(function (s) {
      sorter(set, s.field, s.order.toUpperCase() === 'ASC');
    });
  };
};

var inst = null;

var LocalForage = function (_BaseDB) {
  _inherits(LocalForage, _BaseDB);

  _createClass(LocalForage, null, [{
    key: 'instance',
    get: function get() {

      if (!inst) {
        if (!localStorageValid()) {
          console.log("Installing local FS driver...");
          var local = new _LocalFSStorage2.default();
          _localforage2.default.defineDriver(local);
        }
        inst = new LocalForage();
      }
      return inst;
    }
  }]);

  function LocalForage(props) {
    _classCallCheck(this, LocalForage);

    var _this = _possibleConstructorReturn(this, (LocalForage.__proto__ || Object.getPrototypeOf(LocalForage)).call(this, props));

    _this.querySizeLimit = props ? props.querySizeLimit || 50 : 50;

    ['store', 'storeBulk', 'read', 'readAll', 'find', 'update', 'remove', 'removeDB', 'iterate'].forEach(function (fn) {
      _this[fn] = _this[fn].bind(_this);
    });
    return _this;
  }

  _createClass(LocalForage, [{
    key: 'removeDB',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(name) {
        var db;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                db = this.dbs[name];

                if (db) {
                  _context2.next = 3;
                  break;
                }

                return _context2.abrupt('return');

              case 3:
                console.log("Dropping DB", name);
                db.dropInstance();
                this.dbs[name] = undefined;

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function removeDB(_x2) {
        return _ref2.apply(this, arguments);
      }

      return removeDB;
    }()
  }, {
    key: 'store',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(props) {
        var db;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _BaseDB2.storeSchema.validateSync(props);
                _context3.next = 3;
                return this._getDB(props, dbFactory);

              case 3:
                db = _context3.sent;
                _context3.prev = 4;
                _context3.next = 7;
                return db.setItem(props.key, props.data);

              case 7:
                _context3.next = 12;
                break;

              case 9:
                _context3.prev = 9;
                _context3.t0 = _context3['catch'](4);

                console.log("Problem storing to", props.database, _context3.t0);

              case 12:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[4, 9]]);
      }));

      function store(_x3) {
        return _ref3.apply(this, arguments);
      }

      return store;
    }()
  }, {
    key: 'storeBulk',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(props) {
        var db;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _BaseDB2.storeBulkSchema.validateSync(props);
                _context4.next = 3;
                return this._getDB(props, dbFactory);

              case 3:
                db = _context4.sent;
                _context4.prev = 4;
                _context4.next = 7;
                return db.setItems(props.items);

              case 7:
                _context4.next = 12;
                break;

              case 9:
                _context4.prev = 9;
                _context4.t0 = _context4['catch'](4);

                console.log("Problem storing items", props.database, _context4.t0);

              case 12:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[4, 9]]);
      }));

      function storeBulk(_x4) {
        return _ref4.apply(this, arguments);
      }

      return storeBulk;
    }()
  }, {
    key: 'read',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(props) {
        var db, r;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _BaseDB2.readSchema.validateSync(props);
                _context5.next = 3;
                return this._getDB(props, dbFactory);

              case 3:
                db = _context5.sent;
                _context5.next = 6;
                return db.getItem(props.key);

              case 6:
                r = _context5.sent;
                return _context5.abrupt('return', r ? [r] : []);

              case 8:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function read(_x5) {
        return _ref5.apply(this, arguments);
      }

      return read;
    }()
  }, {
    key: 'readAll',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(props) {
        var db, set, sortFn, limit, filterFn;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _BaseDB2.readAllSchema.validateSync(props);
                _context6.next = 3;
                return this._getDB(props, dbFactory);

              case 3:
                db = _context6.sent;
                set = [];
                sortFn = _buildSortFn(props);
                limit = props.limit || this.querySizeLimit;
                filterFn = props.filterFn;
                _context6.next = 10;
                return db.iterate(function (v, k, itNum) {
                  if (itNum > limit) {
                    return set;
                  }
                  if (filterFn) {
                    if (filterFn(v, k, itNum)) {
                      set.push(v);
                    }
                  } else {
                    set.push(v);
                  }
                });

              case 10:
                if (sortFn) {
                  sortFn(set);
                }
                return _context6.abrupt('return', set);

              case 12:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function readAll(_x6) {
        return _ref6.apply(this, arguments);
      }

      return readAll;
    }()
  }, {
    key: 'iterate',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(props) {
        var db;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _BaseDB2.iterateSchema.validateSync(props);

                if (!(typeof props.callback !== 'function')) {
                  _context7.next = 3;
                  break;
                }

                throw new Error("Missing callback function");

              case 3:
                _context7.next = 5;
                return this._getDB(props, dbFactory);

              case 5:
                db = _context7.sent;
                _context7.next = 8;
                return db.iterate(props.callback);

              case 8:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function iterate(_x7) {
        return _ref7.apply(this, arguments);
      }

      return iterate;
    }()
  }, {
    key: 'find',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(props) {
        var db, set, sortFn, limit, selKeys, offset, includeTotal, skipping, endLength, total;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _BaseDB2.findSchema.validateSync(props);
                _context8.next = 3;
                return this._getDB(props, dbFactory);

              case 3:
                db = _context8.sent;
                set = [];
                sortFn = _buildSortFn(props);
                limit = props.limit || this.querySizeLimit;
                selKeys = _lodash2.default.keys(props.selector);
                offset = props.offset || 0;
                includeTotal = props.includeTotal;
                skipping = offset > 0;
                endLength = offset + limit;
                total = 0;
                _context8.next = 15;
                return db.iterate(function (dbVal, dbKey, itNum) {
                  var allMatch = true;
                  //filter based on selectors first. This way we make
                  //sure paging and sorting work with the same dataset
                  //each time. This is terribly slow but localforage/indexedDB
                  //doesn't offer skipping records. An optimization might be
                  //to keep our own index of record counts so that at a minimum
                  //we're not running through entire set each time. Skipping would
                  //still require walk from beginning. I don't know what happens if
                  //records are inserted during paging operation...would we miss an
                  //item if it's key were iterated earlier than the page we skipped?
                  //This needs more thought.
                  for (var i = 0; i < selKeys.length; ++i) {
                    var p = selKeys[i];
                    var tgt = props.selector[p];
                    var v = dbVal[p];
                    if (!isNaN(v) && !isNaN(tgt)) {
                      v -= 0;
                      tgt -= 0;
                    }
                    if (v !== tgt) {
                      allMatch = false;
                      break;
                    }
                  }
                  if (allMatch) {
                    ++total;
                    if (!skipping && set.length < endLength) {
                      set.push(dbVal);
                    } else if (!skipping && set.length >= endLength && !includeTotal) {
                      return set;
                    }
                  }

                  skipping = total < offset || set.length > offset + limit;
                });

              case 15:

                if (sortFn) {
                  sortFn(set);
                }

                if (!includeTotal) {
                  _context8.next = 18;
                  break;
                }

                return _context8.abrupt('return', {
                  total: total,
                  data: set
                });

              case 18:
                return _context8.abrupt('return', set);

              case 19:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function find(_x8) {
        return _ref8.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(props) {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _BaseDB2.updateSchema.validateSync(props);

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function update(_x9) {
        return _ref9.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(props) {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _BaseDB2.removeSchema.validateSync(props);

              case 1:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function remove(_x10) {
        return _ref10.apply(this, arguments);
      }

      return remove;
    }()
  }]);

  return LocalForage;
}(_BaseDB3.default);

exports.default = LocalForage;
//# sourceMappingURL=LocalForage.js.map