import {HttpResult} from '../HttpResult';
import {JsonRequestHandlerResult} from '../types';

/**
 * Guard to check whether a JsonRequestHandlerResult is an HttpResult object, preserving its
 * payload type.
 * @param result
 */
export const isHttpResult = <TPayload>(
  result: JsonRequestHandlerResult<TPayload>
): result is HttpResult<TPayload> => result instanceof HttpResult;
