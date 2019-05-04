
export const reduxMiddleware = (dispatch, getState) => (ctx, next) => {
  ctx.dispatch = dispatch;
  ctx.getState = getState;
  next();
};
//# sourceMappingURL=index.js.map