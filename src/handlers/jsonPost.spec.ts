import test, {ExecutionContext} from 'ava';
import express, {Router} from 'express';
import request from 'supertest';
import {HttpResult} from '../HttpResult';
import {HttpError, ProblemDetailsError} from '../errors';
import {jsonRouting} from '../jsonRouting';

const run = (
  type: 'return' | 'throw',
  result: any,
  expectCode: number,
  expectPayload: any
) => async (t: ExecutionContext) => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);
  t.truthy(jsonRouter.jsonPost);

  jsonRouter.jsonPost('/test', req => {
    if (type === 'throw') throw result;
    return result;
  });

  const app = express();
  app.use(jsonRouter);

  const response = await request(app).post('/test').expect(expectCode);
  t.deepEqual(response.body, expectPayload);
};

test(
  "jsonPost - returns 204 (Not Found) when handler returns 'undefined' (falsy)",
  run('return', undefined, 204, {})
);

test(
  "jsonPost - returns 204 (Not Found) when handler returns '0' (falsy)",
  run('return', 0, 204, {})
);

test(
  'jsonPost - returns 202 (Accepted) when handler returns non-zero / truthy code',
  run('return', {foo: 'bar'}, 202, {foo: 'bar'})
);

test(
  "jsonPost - returns handler's HTTP status and payload when handler returns HttpResult",
  run('return', new HttpResult(200, {foo: 'bar'}), 200, {foo: 'bar'})
);

test(
  'jsonPost - returns error when handler returns HttpError',
  run('throw', new HttpError('oops', 404), 404, {err: 'oops'})
);

test(
  'jsonPost - returns error when handler returns ProblemDetailsError',
  run(
    'throw',
    new ProblemDetailsError({
      detail: 'err_detail',
      instance: 'err_instance',
      statusCode: 123,
      title: 'err_title',
      type: 'err_type',
    }),
    404,
    {err: 'oops'}
  )
);
