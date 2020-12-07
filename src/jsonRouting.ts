import {Router} from 'express';
import {PathParams} from 'express-serve-static-core';
import {
  ContextSelector,
  DefaultContextSelector,
  TibberRequestHandler,
  middleware,
} from './middleware';

/**
 * A JsonRouter is an express.Router instance that also provides shorthand HTTP methods
 * using Tibber's middleware under the 'jsonXXX' naming convention.
 */
export type JsonRouter<TContext> = Router & {
  jsonDelete: JsonRouteMatcher<TContext>;
  jsonGet: JsonRouteMatcher<TContext>;
  jsonPatch: JsonRouteMatcher<TContext>;
  jsonPost: JsonRouteMatcher<TContext>;
  jsonPut: JsonRouteMatcher<TContext>;
};

type JsonRouteMatcher<TContext> = {
  <TPayload>(
    path: PathParams,
    handler: TibberRequestHandler<TContext, TPayload>
  ): JsonRouter<TContext>;
};

type JsonRouting<TContext = unknown> = {
  (
    expressRouter: Router,
    contextSelector?: ContextSelector<TContext>
  ): JsonRouter<TContext>;
};

type ContextOf<
  TContextSelector extends ContextSelector<unknown>
> = TContextSelector extends ContextSelector<infer U> ? U : never;

const NotFoundIfNoCodeOtherwiseOk = (code: undefined | number) =>
  code === undefined ? 404 : 200;

const NoContentIfNoCodeOtherwiseOk = (code: undefined | number) =>
  code ? 202 : 204;

export const jsonRouting: JsonRouting = (expressRouter, contextSelector?) => {
  /**
   * If a ContextSelector isn't provided, use the default implementation.
   */
  const _contextSelector = contextSelector || DefaultContextSelector;

  /**
   * Infer the type of the Context from the ContextSelector provided.
   * We will use this to construct the 'jsonXXX' API.
   */
  type TContext = ContextOf<typeof _contextSelector>;

  /**
   * Use the original Router object as a JsonRouter instance.
   */
  const jsonRouter = expressRouter as JsonRouter<TContext>;

  //
  // Decorate 'jsonRouter' with each HTTP method by injecting Tibber's middleware and providing a default
  // strategy for determining the request's HTTP status code.
  //

  jsonRouter.jsonGet = <TPayload>(
    path: PathParams,
    handler: TibberRequestHandler<TContext, TPayload>
  ) =>
    jsonRouter.get(
      path,
      middleware(NotFoundIfNoCodeOtherwiseOk, _contextSelector, handler)
    );

  jsonRouter.jsonPost = <TPayload>(
    path: PathParams,
    handler: TibberRequestHandler<TContext, TPayload>
  ) =>
    jsonRouter.post(
      path,
      middleware(NoContentIfNoCodeOtherwiseOk, _contextSelector, handler)
    );

  jsonRouter.jsonPatch = <TPayload>(
    path: PathParams,
    handler: TibberRequestHandler<TContext, TPayload>
  ) =>
    jsonRouter.patch(
      path,
      middleware(NoContentIfNoCodeOtherwiseOk, _contextSelector, handler)
    );

  jsonRouter.jsonPut = <TPayload>(
    path: PathParams,
    handler: TibberRequestHandler<TContext, TPayload>
  ) =>
    jsonRouter.put(
      path,
      middleware(NoContentIfNoCodeOtherwiseOk, _contextSelector, handler)
    );

  jsonRouter.jsonDelete = <TPayload>(
    path: PathParams,
    handler: TibberRequestHandler<TContext, TPayload>
  ) =>
    jsonRouter.delete(
      path,
      middleware(NoContentIfNoCodeOtherwiseOk, _contextSelector, handler)
    );

  return jsonRouter;
};
