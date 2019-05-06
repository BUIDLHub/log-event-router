
export const reduxMiddleware = (dispatch,getState) => (ctx) => {
  ctx.dispatch = dispatch;
  ctx.getState = getState;
}
