import {middlewareFunc} from './middlewareFunc';

export function jsonRouting(expressRouter, contextFunc) {
  expressRouter.expressGet = expressRouter.get;
  expressRouter.expressPost = expressRouter.post;
  expressRouter.expressPatch = expressRouter.patch;
  expressRouter.expressPut = expressRouter.put;
  expressRouter.expressDelete = expressRouter.delete;

  contextFunc = contextFunc || (req => req.context);
  expressRouter.get = (path, middleWareFunc) =>
    expressRouter.expressGet(
      path,
      middlewareFunc(
        r => (r === undefined ? 404 : 200),
        middleWareFunc,
        contextFunc
      )
    );
  expressRouter.post = (path, middleWareFunc) =>
    expressRouter.expressPost(
      path,
      middlewareFunc(r => (r ? 202 : 204), middleWareFunc, contextFunc)
    );
  expressRouter.patch = (path, middleWareFunc) =>
    expressRouter.expressPatch(
      path,
      middlewareFunc(r => (r ? 200 : 204), middleWareFunc, contextFunc)
    );
  expressRouter.put = (path, middleWareFunc) =>
    expressRouter.expressPut(
      path,
      middlewareFunc(r => (r ? 200 : 204), middleWareFunc, contextFunc)
    );
  expressRouter.delete = (path, middleWareFunc) =>
    expressRouter.expressDelete(
      path,
      middlewareFunc(r => (r ? 200 : 204), middleWareFunc, contextFunc)
    );

  return expressRouter;
}
