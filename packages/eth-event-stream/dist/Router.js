'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Router = function () {
  function Router(props) {
    var _this = this;

    _classCallCheck(this, Router);

    this.globalHandlers = [];
    this.contextHandlers = {};
    this.errorHandler = props.errorHandler;

    ['use', 'process'].forEach(function (fn) {
      return _this[fn] = _this[fn].bind(_this);
    });
  }

  _createClass(Router, [{
    key: 'use',
    value: function use() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 0) {
        return this;
      }
      var context = args.shift();
      if (typeof context === 'string') {
        var ex = this.contextHandlers[context] || [];
        args.forEach(function (a) {
          return ex.push(a);
        });
        this.contextHandlers[context] = ex;
      } else {
        this.globalHandlers.push(context);
      }
      return this;
    }
  }, {
    key: 'process',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx, bundle) {
        var i, h, outB, _outB, tgt, _i, _h, _outB2, _outB3;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                ctx = _extends({}, ctx, {
                  bundle: bundle
                });

                _context.prev = 1;
                i = 0;

              case 3:
                if (!(i < this.globalHandlers.length)) {
                  _context.next = 20;
                  break;
                }

                h = this.globalHandlers[i];

                if (!(typeof h === 'function')) {
                  _context.next = 12;
                  break;
                }

                _context.next = 8;
                return h(ctx);

              case 8:
                outB = _context.sent;

                if (outB) {
                  ctx.bundle = outB;
                }
                _context.next = 17;
                break;

              case 12:
                if (!(typeof h.process === 'function')) {
                  _context.next = 17;
                  break;
                }

                _context.next = 15;
                return h.process(ctx);

              case 15:
                _outB = _context.sent;

                if (_outB) {
                  ctx.bundle = _outB;
                }

              case 17:
                ++i;
                _context.next = 3;
                break;

              case 20:
                tgt = this.contextHandlers[bundle.fnContext];

                if (!tgt) {
                  _context.next = 40;
                  break;
                }

                _i = 0;

              case 23:
                if (!(_i < tgt.length)) {
                  _context.next = 40;
                  break;
                }

                _h = tgt[_i];

                if (!(typeof _h === 'function')) {
                  _context.next = 32;
                  break;
                }

                _context.next = 28;
                return _h(ctx);

              case 28:
                _outB2 = _context.sent;

                if (_outB2) {
                  ctx.bundle = _outB2;
                }
                _context.next = 37;
                break;

              case 32:
                if (!(typeof _h.process === 'function')) {
                  _context.next = 37;
                  break;
                }

                _context.next = 35;
                return _h.process(ctx);

              case 35:
                _outB3 = _context.sent;

                if (_outB3) {
                  ctx.bundle = _outB3;
                }

              case 37:
                ++_i;
                _context.next = 23;
                break;

              case 40:
                _context.next = 45;
                break;

              case 42:
                _context.prev = 42;
                _context.t0 = _context['catch'](1);

                if (this.errorHandler) {
                  this.errorHandler(_context.t0);
                }

              case 45:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 42]]);
      }));

      function process(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return process;
    }()
  }]);

  return Router;
}();

exports.default = Router;
//# sourceMappingURL=Router.js.map