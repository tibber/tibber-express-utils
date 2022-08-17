import express, {Router} from 'express';
import request from 'supertest';
import {HttpResult} from '../../src';
import {JsonRequestHandlerResult} from '../../src';
import {jsonRouting} from '../../src';
import {HttpError, ProblemDetailsError} from '../../src/errors';

const run =
  <TResult, TPayload>(
    type: 'return' | 'throw',
    result: JsonRequestHandlerResult<TResult>,
    expectCode: number,
    expectPayload: TPayload
  ) =>
  async () => {
    const router = Router({});
    const jsonRouter = jsonRouting({expressRouter: router});

    jsonRouter.jsonPut('/test', () => {
      if (type === 'throw') throw result;
      return result;
    });

    const app = express();
    app.use(jsonRouter);

    const response = await request(app).put('/test').expect(expectCode);
    expect(response.body).toStrictEqual(expectPayload);
  };

describe('jsonPut', () => {
  it(
    "returns 204 (Not Found) when handler returns 'undefined' (falsy)",
    run('return', undefined, 204, {})
  );

  it(
    "returns 204 (Not Found) when handler returns '0' (falsy)",
    run('return', 0, 204, {})
  );

  it(
    'returns 202 (Accepted) when handler returns non-zero / truthy code',
    run('return', {foo: 'bar'}, 202, {foo: 'bar'})
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
