import LocalForage from './LocalForage';

export const storageMiddleware = () => async (ctx, next) => {
  ctx.storage = LocalForage.instance;
  next();
}

export const storageInstance = () => LocalForage.instance;
