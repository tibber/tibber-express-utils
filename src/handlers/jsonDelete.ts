import {PathParams} from 'express-serve-static-core';
import {NoContentIfNoCodeOtherwiseOk} from '../NoContentIfNoCodeOtherwiseOk';
import {jsonMiddleware} from '../jsonMiddleware';
import {
  ContextSelector,
  JsonRequestHandler,
  JsonRouter,
  Logger,
} from '../types';

export const jsonDelete = <TContext>(
  jsonRouter: JsonRouter<TContext>,
  _contextSelector: ContextSelector<TContext>,
  errorLogger?: Logger
) => <TPayload>(
  path: PathParams,
  handler: JsonRequestHandler<TContext, TPayload>
) =>
  jsonRouter.delete(
    path,
    jsonMiddleware(
      NoContentIfNoCodeOtherwiseOk,
      _contextSelector,
      handler,
      errorLogger
    )
  );
