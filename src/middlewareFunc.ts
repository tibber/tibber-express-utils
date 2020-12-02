import {HttpResult} from './httpResult';
import {HttpError} from './httpError';
import {ProblemDetailsError} from './problemDetailsError';

export function middlewareFunc(defaultCodeFunc, middleWareFunc, contextFunc) {
  return async (req, res) => {
    try {
      const result = await middleWareFunc(req, contextFunc(req));

      if (result instanceof HttpResult) {
        if (result.headers) {
          for (const header in result.headers) {
            res.set(header, result.headers[header]);
          }
        }
        return res.status(result.statusCode || 200).json(result.payload);
      }
      res.status(defaultCodeFunc(result)).json(result);
    } catch (err) {
      if (err instanceof ProblemDetailsError) {
        const {detail, type, instance, httpStatus: status, title} = err;
        return res.status(status).contentType('application/problem+json').send(
          JSON.stringify({
            detail,
            type,
            instance,
            status,
            title,
          })
        );
      }
      if (err instanceof HttpError) {
        return res.status(err.httpStatus || 500).send({err: err.message});
      }

      res.status(500).send({err: err && err.toString ? err.toString() : err});
    }
  };
}
