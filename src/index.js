if (!global._babelPolyfill) {
  require('babel-polyfill')
}
import ExtendableError from 'es6-error';

function middlewareFunc(defaultCodeFunc, middleWareFunc, contextFunc) {
  return async (req, res) => {

    try {
      const result = await middleWareFunc(req, contextFunc(req));

      if (result instanceof HttpResult) {
        if (result.headers) {
          for (let header in Object.keys(result.headers)) {
            res.set(header, result.headers[header]);
          }
        }
        return res.status(result.statusCode || 200).json(result.payload);
      }
      res.status(defaultCodeFunc(result)).json(result);

    }
    catch (err) {

      if (err instanceof ProblemDetailsError) {
        const { detail, type, instance, httpStatus: status } = err;
        return res.status(status).contentType('application/problem+json').send(JSON.stringify({
          detail, type, instance, status
        }));
      }
      if (err instanceof HttpError) {
        return res.status(err.httpStatus || 500).send({ err: err.message });
      }

      res.status(500).send({ err: err && err.toString ? err.toString() : err });
    }
  }
}

export function jsonRouting(expressRouter, contextFunc) {

  expressRouter.expressGet = expressRouter.get;
  expressRouter.expressPost = expressRouter.post;
  expressRouter.expressPatch = expressRouter.patch;
  expressRouter.expressPut = expressRouter.put;
  expressRouter.expressDelete = expressRouter.delete;

  contextFunc = contextFunc || (req => req.context);
  expressRouter.get = (path, middleWareFunc) => expressRouter.expressGet(path, middlewareFunc(r => r == undefined ? 404 : 200, middleWareFunc, contextFunc));
  expressRouter.post = (path, middleWareFunc) => expressRouter.expressPost(path, middlewareFunc(r => r ? 202 : 204, middleWareFunc, contextFunc));
  expressRouter.patch = (path, middleWareFunc) => expressRouter.expressPatch(path, middlewareFunc(r => r ? 200 : 204, middleWareFunc, contextFunc));
  expressRouter.put = (path, middleWareFunc) => expressRouter.expressPut(path, middlewareFunc(r => r ? 200 : 204, middleWareFunc, contextFunc));
  expressRouter.delete = (path, middleWareFunc) => expressRouter.expressDelete(path, middlewareFunc(r => r ? 200 : 204, middleWareFunc, contextFunc));

  return expressRouter;

}

export class HttpResult {
  constructor(statusCode, payload, headers) {
    this.statusCode = statusCode;
    this.payload = payload;
    this.headers = headers;
  }
}

export class HttpError extends ExtendableError {
  constructor(message, statusCode) {
    super(message);
    this.httpStatus = statusCode;
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

export class ProblemDetailsError extends HttpError {
  constructor({ detail, type, instance, status }) {
    super(detail, status);
    this.detail = detail;
    this.type = type;
    this.instance = instance;
  }
}

export class Errors {
  static badRequestError(message) { return new BadRequestError(message) };
  static serverError(message) { return new ServerError(message) };
  static notAuthorizedError(message) { return new NotAuthorizedError(message) };
  static notFoundError(message) { return new NotFoundError(message) };
  static conflictError(message) { return new ConflictError(message) };
  static httpError(message, statusCode) { return new HttpError(message, statusCode) };
  static problemDetailsError(payload) { return new ProblemDetailsError(payload) };
}
