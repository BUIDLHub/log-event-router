'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storageInstance = exports.storageMiddleware = undefined;

var _LocalForage = require('./LocalForage');

var _LocalForage2 = _interopRequireDefault(_LocalForage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var storageMiddleware = exports.storageMiddleware = function storageMiddleware() {
  return function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              ctx.storage = _LocalForage2.default.instance;

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
};

var storageInstance = exports.storageInstance = function storageInstance() {
  return _LocalForage2.default.instance;
};
//# sourceMappingURL=index.js.map