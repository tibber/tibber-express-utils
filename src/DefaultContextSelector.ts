import {ContextSelector} from './types';
import {hasOwnProperty} from './utils/hasOwnProperty';

/**
 * By default, Tibber's jsonMiddleware attempts to obtain a context object from the 'context' property,
 * which may be set on the express Request instance. If one isn't found, it returns undefined.
 */
export const DefaultContextSelector: ContextSelector<unknown> = request => {
  if (!hasOwnProperty(request, 'context')) return undefined;
  return request['context'];
};
