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
) => async () => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);

  expect(jsonRouter.jsonGet).toBeTruthy();

  jsonRouter.jsonGet('/test', req => {
    if (type === 'throw') throw result;
    return result;
  });

  const app = express();
  app.use(jsonRouter);

  const response = await request(app).get('/test').expect(expectCode);
  expect(response.body).toStrictEqual(expectPayload);
};

describe('jsonDelete', () => {
  it(
    "returns 404 (Not Found) when handler returns 'undefined' (falsy)",
    run('return', undefined, 404, '')
  );

  it(
    'returns 200 (Ok) when handler returns non-zero / truthy code',
    run('return', {foo: 'bar'}, 200, {foo: 'bar'})
  );

  it(
    "returns handler's HTTP status and payload when handler returns HttpResult",
    run('return', new HttpResult(200, {foo: 'bar'}), 200, {foo: 'bar'})
  );

  it(
    "returns error code and 'err' msg when handler throws HttpError",
    run('throw', new HttpError('oops', 404), 404, {err: 'oops'})
  );

  it(
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

  it(
    "returns 500 and 'err' msg when handler throws string Error",
    run('throw', 'foo', 500, {
      err: 'foo',
    })
  );

  it(
    "returns 500 and 'err' msg from toString() when handler throws object",
    run('throw', new Error('foo'), 500, {
      err: 'Error: foo',
    })
  );
});
