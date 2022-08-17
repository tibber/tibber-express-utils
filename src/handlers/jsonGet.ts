import {PathParams} from 'express-serve-static-core';
import {NotFoundIfNoCodeOtherwiseOk} from '../NotFoundIfNoCodeOtherwiseOk';
import {jsonMiddleware} from '../jsonMiddleware';
import {
  ContextSelector,
  JsonRequestHandler,
  JsonRouter,
  Logger,
} from '../types';

export const jsonGet =
  <TContext>(
    jsonRouter: JsonRouter<TContext>,
    _contextSelector: ContextSelector<TContext>,
    logger?: Logger
  ) =>
  <TPayload>(
    path: PathParams,
    handler: JsonRequestHandler<TContext, TPayload>
  ) =>
    jsonRouter.get(
      path,
      jsonMiddleware(
        NotFoundIfNoCodeOtherwiseOk,
        _contextSelector,
        handler,
        logger
      )
    );
