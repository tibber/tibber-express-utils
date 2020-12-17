import {DefaultContextSelector} from './DefaultContextSelector';
import {jsonDelete, jsonGet, jsonPatch, jsonPost, jsonPut} from './handlers';
import {JsonRouter, JsonRouting} from './types';
import {ContextOf} from './utils/ContextOf';

export const jsonRouting: JsonRouting = routingParams => {
  /**
   * If a ContextSelector isn't provided, use the default implementation.
   */
  const _contextSelector =
    routingParams.contextSelector || DefaultContextSelector;

  /**
   * Infer the type of the Context from the ContextSelector provided.
   * We will use this to construct the 'jsonXXX' API.
   */
  type TContext = ContextOf<typeof _contextSelector>;

  /**
   * Use the original Router object as a JsonRouter instance.
   */
  const jsonRouter = routingParams.expressRouter as JsonRouter<TContext>;
  const logger = routingParams.logger;

  //
  // Decorate 'jsonRouter' with each HTTP method by injecting Tibber's jsonMiddleware and providing a default
  // strategy for determining the request's HTTP status code.
  //
  jsonRouter.jsonGet = jsonGet(jsonRouter, _contextSelector, logger);
  jsonRouter.jsonPost = jsonPost(jsonRouter, _contextSelector, logger);
  jsonRouter.jsonPatch = jsonPatch(jsonRouter, _contextSelector, logger);
  jsonRouter.jsonPut = jsonPut(jsonRouter, _contextSelector, logger);
  jsonRouter.jsonDelete = jsonDelete(jsonRouter, _contextSelector, logger);

  return jsonRouter;
};
