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
      let errorAsString;

      /**
       * If 'err' is an object that has a toString method, call it to get its string representation.
       */
      if (err instanceof Error) {
        errorAsString = err.toString();
      } else if (typeof err === 'string' || err instanceof String) {
        errorAsString = err;
      }

      if (logger && logger.error) {
        logger.error(`ERROR ${req.method} ${req.url} ${errorAsString}`);
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
       * If 'err' is a vanilla HttpError object, extract status code (defaulting to 500) and
       * message, and send that.
       */
      if (err instanceof HttpError) {
        const response = res
          .status(err.httpStatus || 500)
          .json({err: err.message});
        next(err);
        return response;
      }

      /**
       * As last resort, send error's string representation as the message.
       */
      const response = res.status(500).send({err: errorAsString});
      next(err);
      return response;
    }
  };
};
