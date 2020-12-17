import {Request, Response, Router} from 'express';
import {PathParams} from 'express-serve-static-core';
import {HttpResult} from './HttpResult';

/**
 * Params for constructing the jsonRouter.
 */
export type JsonRouterParams<TContext = unknown> = {
  contextSelector?: ContextSelector<TContext>;
  expressRouter: Router;
  logger?: Logger;
};

/**
 * Configures an express.Router instance as a JsonRouter, adding the 'jsonXXX'
 * api which routes requests through Tibber's jsonMiddleware.
 */
export type JsonRouting<TContext = unknown> = {
  (jsonRouterParams: JsonRouterParams<TContext>): JsonRouter<TContext>;
};

/**
 * Where relevant, extracts a context object from the express Request instance.
 */
export type ContextSelector<TContext> = (request: Request) => TContext;

/**
 * A JsonRouter is an express.Router instance that also provides shorthand HTTP methods
 * using Tibber's jsonMiddleware under the 'jsonXXX' naming convention.
 *
 * Poke changing for feat.
 */
export type JsonRouter<TContext> = Router & {
  jsonDelete: JsonRouteMatcher<TContext>;
  jsonGet: JsonRouteMatcher<TContext>;
  jsonPatch: JsonRouteMatcher<TContext>;
  jsonPost: JsonRouteMatcher<TContext>;
  jsonPut: JsonRouteMatcher<TContext>;
};

/**
 * Defines the JsonRequestHandler that is to be used for a specific path.
 */
export type JsonRouteMatcher<TContext> = {
  <TPayload>(
    path: PathParams,
    handler: JsonRequestHandler<TContext, TPayload>
  ): JsonRouter<TContext>;
};

/**
 * The JsonRequestHandler to be implemented by the consuming service.
 *
 * This handler differs from express' default handlers by only receiving
 * the Request object and (optionally) a Context instance that has been
 * extracted from the Request by the JsonRouter.
 *
 * It is expected that the handler returns a JsonRequestHandlerResult.
 */
export type JsonRequestHandler<TContext, TPayload> = (
  req: Request,
  ctx?: TContext
) => JsonRequestHandlerResult<TPayload>;

/**
 * The allowable return types of a JsonRequestHandler. A JsonRequestHandler
 * may return undefined, an HTTP status code (number) or an HttpResult
 * encapsulating a TPayload instance.
 */
export type JsonRequestHandlerResult<TPayload> =
  | undefined
  | HttpResult<TPayload>
  | TPayload
  | number;

/**
 * The Logger interface whose implementation is to be supplied by the consuming service.
 */
export interface Logger {
  debug?(...args: any[]): unknown;
  error?(...args: any[]): unknown;
  info?(...args: any[]): unknown;
}

/**
 * Maps the JsonRequestHandlerResult of a JsonRequestHandler to the Response
 * object, and provides standard error handling semantics for all 'jsonXXX'
 * api calls.
 *
 * An HttpStatusCodeSelector can be provided to define custom logic for handling
 * HTTP Status Codes returned in the JsonRequestHandlerResult.
 *
 * A ContextSelector can be provided to extract a Context instance from the
 * Request instance, and pass it as an argument to the JsonRequestHandler.
 *
 * An Logger instance, if provided, will receive error messages raised during
 * request handling.
 */
export type JsonMiddleware = {
  <TContext, TPayload>(
    httpStatusCodeSelector: HttpStatusCodeSelector,
    contextSelector: ContextSelector<TContext>,
    handler: JsonRequestHandler<TContext, TPayload>,
    logger?: Logger
  ): (req: Request, res: Response) => Promise<Response<TPayload>>;
};

/**
 * Defines logic remapping a status code returned from a JsonRequestHandler in a
 * JsonRequestHandlerResult type.
 */
export type HttpStatusCodeSelector = (
  httpStatusCode: undefined | number | unknown
) => number;
