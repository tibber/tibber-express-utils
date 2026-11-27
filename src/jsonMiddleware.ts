import {randomUUID} from 'crypto';
import {NextFunction, Request, Response} from 'express';
import {HttpError, ProblemDetailsError} from './errors';
import {JsonMiddleware} from './types';
import {isHttpResult} from './utils/isHttpResult';

export const jsonMiddleware: JsonMiddleware = (
  httpStatusCodeSelector,
  contextSelector,
  handler,
  logger
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      /**
       * Execute the RequestHandler provided against the request, extracting the context
       * and providing it as an argument.
       */
      const context = contextSelector(req);
      const result = await handler(req, context);

      /**
       * If the result from the handler is not an HttpResult instance,
       * then extract the HTTP Status Code from the result, using our
       * the httpStatusCodeSelector provided.
       *
       * This might be used if the handler returns a different object,
       * from which the HTTP Status Code needs to be manually extracted.
       */
      if (!isHttpResult(result)) {
        const httpStatusCode = httpStatusCodeSelector(result);
        return res.status(httpStatusCode).json(result);
      }

      /**
       * If the result has headers, set them in the Response.
       */
      if (result.headers) {
        for (const header in result.headers) {
          res.set(header, result.headers[header]);
        }
      }

      /**
       * Apply the HttpResult's HTTP Status Code in the response and serialize
       * the payload as JSON in its body.
       */
      return res.status(result.statusCode || 200).json(result.payload);
    } catch (err) {
      const errorAsString = describeError(err);
      const exposed = isExposed(err);
      const traceId = exposed ? undefined : traceIdOf(req);

      if (logger && logger.error) {
        logger.error(
          exposed
            ? `ERROR ${req.method} ${req.url} ${errorAsString}`
            : `ERROR ${req.method} ${req.url} ${errorAsString} (traceId=${traceId})` +
                stackOf(err)
        );
      }

      /**
       * If 'err' is a ProblemDetailsError object, extract the status code and send the
       * additional details as a JSON payload.
       */
      if (err instanceof ProblemDetailsError) {
        const {
          detail,
          httpStatus: status,
          instance,
          title,
          type,
          extensions,
        } = err;
        const response = res
          .status(status)
          .contentType('application/problem+json')
          .send({
            ...(extensions ?? {}),
            detail,
            instance,
            status,
            title,
            type,
          });
        next(err);
        return response;
      }

      /**
       * An HttpError below 500 was thrown on purpose for the caller: send its message.
       */
      if (exposed) {
        const response = res
          .status((err as HttpError).httpStatus)
          .json({err: (err as HttpError).message});
        next(err);
        return response;
      }

      /**
       * Anything else may carry internal details (upstream URLs, TypeErrors), so the
       * caller only gets a generic body. A 5xx HttpError keeps its status.
       */
      const status =
        err instanceof HttpError && err.httpStatus >= 500 ? err.httpStatus : 500;
      const response = res.status(status).json({
        err: UNEXPECTED_ERROR_MESSAGE,
        error: {
          code: 'INTERNAL',
          message: UNEXPECTED_ERROR_MESSAGE,
          traceId,
        },
      });
      next(err);
      return response;
    }
  };
};

const UNEXPECTED_ERROR_MESSAGE = 'Unexpected error';

const isExposed = (err: unknown): boolean =>
  err instanceof ProblemDetailsError ||
  (err instanceof HttpError &&
    typeof err.httpStatus === 'number' &&
    err.httpStatus > 0 &&
    err.httpStatus < 500);

const describeError = (err: unknown): string | undefined => {
  if (err instanceof Error) return err.toString();
  if (typeof err === 'string' || err instanceof String) return String(err);
  try {
    return JSON.stringify(err);
  } catch {
    return undefined;
  }
};

const stackOf = (err: unknown): string => {
  if (!(err instanceof Error) || !err.stack) return '';
  // The first stack line repeats err.toString(), which is already logged.
  const frames = err.stack.split('\n').slice(1).join('\n');
  return frames ? `\n${frames}` : '';
};

const TRACEPARENT = /^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/;
const SAFE_REQUEST_ID = /^[\w.-]{1,128}$/;

/**
 * Correlates the generic 500 body with the logged error: the W3C trace id if the
 * caller sent one, else a well-formed x-request-id, else a fresh UUID.
 */
const traceIdOf = (req: Request): string => {
  const traceparent = TRACEPARENT.exec(req.get('traceparent') ?? '');
  if (traceparent) return traceparent[1];
  const requestId = req.get('x-request-id');
  if (requestId && SAFE_REQUEST_ID.test(requestId)) return requestId;
  return randomUUID();
};
