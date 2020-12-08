import {Request, Response} from 'express';
import {HttpError} from './HttpError';
import {HttpResult} from './HttpResult';
import {ProblemDetailsError} from './ProblemDetailsError';

export type HttpStatusCodeSelector = (
  httpStatusCode: undefined | number
) => number;

/**
 * Guard to check whether a RequestHandlerResult is an HttpResult object, preserving its
 * payload type.
 * @param result
 */
const isHttpResult = <TPayload>(
  result: RequestHandlerResult<TPayload>
): result is HttpResult<TPayload> => result instanceof HttpResult;

type RequestHandlerResult<TPayload> = undefined | HttpResult<TPayload> | number;

export type TibberRequestHandler<TContext, TPayload> = (
  req: Request,
  ctx: TContext
) => RequestHandlerResult<TPayload>;

export type Middleware = {
  <TContext, TPayload>(
    httpStatusCodeSelector: HttpStatusCodeSelector,
    contextSelector: ContextSelector<TContext>,
    handler: TibberRequestHandler<TContext, TPayload>
  ): (req: Request, res: Response) => Promise<Response<TPayload>>;
};

/**
 * Where relevant, extracts a context object from the express Request instance.
 */
export type ContextSelector<TContext> = (request: Request) => TContext;

/**
 * By default, Tibber's middleware attempts to obtain a context object from the 'context' property,
 * which may be set on the express Request instance. If one isn't found, it returns undefined.
 */
export const DefaultContextSelector: ContextSelector<unknown> = request => {
  if (!hasOwnProperty(request, 'context')) return undefined;
  return request['context'];
};

const hasOwnProperty = <X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> => {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

export const middleware: Middleware = (
  httpStatusCodeSelector,
  contextSelector,
  handler
) => {
  return async (req: Request, res: Response) => {
    try {
      /**
       * Exeute the RequestHandler provided against the request, extracting the context
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
       * such as an Error instance, from which the HTTP Status Code needs
       * to be manually extracted.
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
      /**
       * If 'err' is a ProblemDetailsError object, extract the status code and send the
       * additional details as a JSON payload.
       */
      if (err instanceof ProblemDetailsError) {
        const {detail, httpStatus: status, instance, title, type} = err;
        return res.status(status).contentType('application/problem+json').send(
          JSON.stringify({
            detail,
            instance,
            status,
            title,
            type,
          })
        );
      }

      /**
       * If 'err' is a vanilla HttpError object, extract status code (defaulting to 500) and
       * message, and send that.
       */
      if (err instanceof HttpError) {
        return res.status(err.httpStatus || 500).send({err: err.message});
      }

      /**
       * If 'err' is an object that has a toString method, call it to get its string representation and
       * send that as the message instead of the error object.
       */
      const errorAsString = err && err.toString ? err.toString() : err;
      return res.status(500).send({err: errorAsString});
    }
  };
};
