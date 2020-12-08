import {PathParams} from 'express-serve-static-core';
import {NotFoundIfNoCodeOtherwiseOk} from '../NotFoundIfNoCodeOtherwiseOk';
import {jsonMiddleware} from '../jsonMiddleware';
import {ContextSelector, JsonRequestHandler, JsonRouter} from '../types';

export const jsonGet = <TContext>(
  jsonRouter: JsonRouter<TContext>,
  _contextSelector: ContextSelector<TContext>
) => <TPayload>(
  path: PathParams,
  handler: JsonRequestHandler<TContext, TPayload>
) =>
  jsonRouter.get(
    path,
    jsonMiddleware(NotFoundIfNoCodeOtherwiseOk, _contextSelector, handler)
  );
