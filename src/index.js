1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
require("babel-polyfill");
function middlewareFunc(defaultCodeFunc, middleWareFunc) {
  return async (req, res) => {

    try {
      const result = await middleWareFunc(req);

      if (result instanceof HttpResult) {
        return res.status(result.statusCode || 200).json(result.payload);
      }
      res.status(defaultCodeFunc(result)).json(result);

    }
    catch (err) {

      if (err instanceof HttpError) {
        return res.status(err.httpStatus || 500).send({ err: err.message });
      }

      res.status(500).send({ err: err && err.toString ? err.toString() : err });
    }
  }
}

export function jsonRouting(expressRouter) {

  expressRouter.expressGet = expressRouter.get;
  expressRouter.expressPost = expressRouter.post;
  expressRouter.expressPatch = expressRouter.patch;
  expressRouter.expressPut = expressRouter.put;
  expressRouter.expressDelete = expressRouter.delete;

  expressRouter.get = (path, middleWareFunc) => expressRouter.expressGet(path, middlewareFunc(r => 200, middleWareFunc));
  expressRouter.post = (path, middleWareFunc) => expressRouter.expressPost(path, middlewareFunc(r => r ? 202 : 204, middleWareFunc));
  expressRouter.patch = (path, middleWareFunc) => expressRouter.expressPatch(path, middlewareFunc(r => r ? 200 : 204, middleWareFunc));
  expressRouter.put = (path, middleWareFunc) => expressRouter.expressPut(path, middlewareFunc(r => r ? 200 : 204, middleWareFunc));
  expressRouter.delete = (path, middleWareFunc) => expressRouter.expressDelete(path, middlewareFunc(r => r ? 200 : 204, middleWareFunc));

  return expressRouter;

}

export class HttpResult {
  contructor(statusCode, payload) {
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.httpStatus = statusCode;
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

export class ConflictError extends HttpError {
  constructor(message) {
    super(message, 409)
  }
}

export class NotFoundError extends HttpError {
  constructor(message) {
    super(message, 404)
  }
}

export class NotAuthorizedError extends HttpError {
  constructor(message) {
    super(message, 401)
  }
}

export class BadRequestError extends HttpError {
  constructor(message) {
    super(message, 400)
  }
}

export class ServerError extends HttpError {
  constructor(message) {
    super(message, 400)
  }
}

export class Errors {
  static badRequestError(message) { return new BadRequestError(message) };
  static serverError(message) { return new ServerError(message) };
  static notAuthorizedError(message) { return new NotAuthorizedError(message) };
  static notFoundError(message) { return new NotFoundError(message) };
  static conflictError(message) { return new ConflictError(message) };
  static httpError(message, statusCode) { return new HttpError(message, statusCode) };
}