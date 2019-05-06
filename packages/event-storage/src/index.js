import LocalForage from './LocalForage';

export const storageMiddleware = () => async (ctx) => {
  ctx.storage = LocalForage.instance;
}

export const storageInstance = () => LocalForage.instance;
