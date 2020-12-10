import test, {ExecutionContext} from 'ava';
import express, {Router} from 'express';
import request from 'supertest';
import {HttpResult} from '../HttpResult';
import {HttpError, ProblemDetailsError} from '../errors';
import {jsonRouting} from '../jsonRouting';
import {JsonRequestHandlerResult} from '../types';

const run = <TResult, TPayload>(
  type: 'return' | 'throw',
  result: JsonRequestHandlerResult<TResult>,
  expectCode: number,
  expectPayload: TPayload
) => async (t: ExecutionContext) => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);

  jsonRouter.jsonGet('/test', () => {
    if (type === 'throw') throw result;
    return result;
  });

  const app = express();
  app.use(jsonRouter);

  const response = await request(app).get('/test').expect(expectCode);
  t.deepEqual(response.body, expectPayload);
};

test(
  "returns 404 (Not Found) when handler returns 'undefined' (falsy)",
  run('return', undefined, 404, '')
);

test(
  'returns 200 (Ok) when handler returns non-zero / truthy code',
  run('return', {foo: 'bar'}, 200, {foo: 'bar'})
);

test(
  "returns handler's HTTP status and payload when handler returns HttpResult",
  run('return', new HttpResult(200, {foo: 'bar'}), 200, {foo: 'bar'})
);

test(
  "returns error code and 'err' msg when handler throws HttpError",
  run('throw', new HttpError('oops', 404), 404, {err: 'oops'})
);

test(
  'returns error code and JSON error details when handler throws ProblemDetailsError',
  run(
    'throw',
    new ProblemDetailsError({
      detail: 'err_detail',
      instance: 'err_instance',
      statusCode: 403,
      title: 'err_title',
      type: 'err_type',
    }),
    403,
    {
      detail: 'err_detail',
      instance: 'err_instance',
      status: 403,
      title: 'err_title',
      type: 'err_type',
    }
  )
);

test(
  "returns 500 and 'err' msg when handler throws string Error",
  run('throw', 'foo', 500, {
    err: 'foo',
  })
);

test(
  "returns 500 and 'err' msg from toString() when handler throws object",
  run('throw', new Error('foo'), 500, {
    err: 'Error: foo',
  })
);
