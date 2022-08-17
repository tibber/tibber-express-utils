import {PathParams} from 'express-serve-static-core';
import {NoContentIfNoCodeOtherwiseOk} from '../NoContentIfNoCodeOtherwiseOk';
import {jsonMiddleware} from '../jsonMiddleware';
import {
  ContextSelector,
  JsonRequestHandler,
  JsonRouter,
  Logger,
} from '../types';

export const jsonPost =
  <TContext>(
    jsonRouter: JsonRouter<TContext>,
    _contextSelector: ContextSelector<TContext>,
    logger?: Logger
  ) =>
  <TPayload>(
    path: PathParams,
    handler: JsonRequestHandler<TContext, TPayload>
  ) =>
    jsonRouter.post(
      path,
      jsonMiddleware(
        NoContentIfNoCodeOtherwiseOk,
        _contextSelector,
        handler,
        logger
      )
    );
