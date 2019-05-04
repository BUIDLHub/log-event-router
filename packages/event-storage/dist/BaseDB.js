"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sortData = exports.iterateSchema = exports.readAllSchema = exports.updateSchema = exports.removeSchema = exports.findSchema = exports.readSchema = exports.sortSchema = exports.storeBulkSchema = exports.storeSchema = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _yup = require("yup");

var yup = _interopRequireWildcard(_yup);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dbBaseSchema = yup.string().required("Missing database parameter");

var storeSchema = exports.storeSchema = yup.object().shape({
  //database where to store the data
  database: dbBaseSchema,

  //key to use for primary id
  key: yup.string().required("Need a key to store data"),

  //the data to store
  data: yup.object().required("Missing data object to store")
});

var storeBulkSchema = exports.storeBulkSchema = yup.object().shape({
  database: dbBaseSchema,

  items: yup.array().of(yup.object().shape({
    key: yup.string().required("Need a key to store data"),
    value: yup.object().required("Missing value object to store")
  }))
});

var sortSchema = exports.sortSchema = yup.object().shape({
  field: yup.string().required("Missing sort field name"),
  order: yup.string().required("Missing order")
});

var readSchema = exports.readSchema = yup.object().shape({

  database: dbBaseSchema,

  //or directly with key
  key: yup.string().required("Missing key to read by id"),

  limit: yup.number(),

  sort: yup.array().of(sortSchema)
});

var findSchema = exports.findSchema = yup.object().shape({
  database: dbBaseSchema,

  selector: yup.object().required("Must have a selector for finding by field"),

  limit: yup.number(),

  sort: yup.array().of(sortSchema).nullable()
});

var removeSchema = exports.removeSchema = yup.object().shape({
  database: dbBaseSchema,
  key: yup.string().required("Need key to remove data from database")
});

var updateSchema = exports.updateSchema = yup.object().shape({
  database: dbBaseSchema,
  key: yup.string().required("Missing database key"),
  data: yup.object().required("Missing data to update")
});

var readAllSchema = exports.readAllSchema = yup.object().shape({
  database: dbBaseSchema,
  limit: yup.number(),
  sort: yup.array().of(sortSchema)
});

var iterateSchema = exports.iterateSchema = yup.object().shape({
  database: dbBaseSchema
});

var sortData = exports.sortData = function sortData(ar, def) {
  ar.sort(function (a, b) {
    var fld = def.field;
    var o = def.order.toUpperCase();
    var isAsc = o === 'ASC';
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

var BaseDB = function () {
  function BaseDB(props) {
    var _this = this;

    _classCallCheck(this, BaseDB);

    this.dbs = {};
    this.next = props ? props.next : undefined;
    if (!this.next) {
      this.next = {};
    };

    ['_getDB'].forEach(function (fn) {
      _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(BaseDB, [{
    key: "_getDB",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(props, factory) {
        var db;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                db = this.dbs[props.database];

                if (db) {
                  _context.next = 6;
                  break;
                }

                _context.next = 4;
                return factory({ name: props.database });

              case 4:
                db = _context.sent;

                this.dbs[props.database] = db;

              case 6:
                return _context.abrupt("return", db);

              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _getDB(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return _getDB;
    }()
  }]);

  return BaseDB;
}();

exports.default = BaseDB;
//# sourceMappingURL=BaseDB.js.map