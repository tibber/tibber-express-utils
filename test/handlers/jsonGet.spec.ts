import express, {Router} from 'express';
import request from 'supertest';
import {HttpResult} from '../../src';
import {JsonRequestHandlerResult} from '../../src';
import {jsonRouting} from '../../src';
import {HttpError, ProblemDetailsError} from '../../src/errors';

class TestLogger {
  lastError: unknown = '';

  error(...args: unknown[]): void {
    this.lastError = args[0] || undefined;
  }
}

const run =
  <TResult, TPayload>(
    type: 'return' | 'throw',
    result: JsonRequestHandlerResult<TResult>,
    expectCode: number,
    expectPayload: TPayload,
    expectLogMsg?: unknown
  ) =>
  async () => {
    const router = Router({});
    const logger = new TestLogger();
    const jsonRouter = jsonRouting({expressRouter: router, logger});

    jsonRouter.jsonGet('/test', () => {
      if (type === 'throw') throw result;
      return result;
    });

    const app = express();
    app.use(jsonRouter);

    const response = await request(app).get('/test').expect(expectCode);
    expect(response.body).toStrictEqual(expectPayload);
    expect(logger.lastError).toEqual(expectLogMsg);
  };

describe('jsonGet', () => {
  it(
    "returns 404 (Not Found) when handler returns 'undefined' (falsy)",
    run('return', undefined, 404, '', '')
  );

  it(
    'returns 200 (Ok) when handler returns non-zero / truthy code',
    run('return', {foo: 'bar'}, 200, {foo: 'bar'}, '')
  );

  it(
    "returns handler's HTTP status and payload when handler returns HttpResult",
    run('return', new HttpResult(200, {foo: 'bar'}), 200, {foo: 'bar'}, '')
  );

  it(
    "returns error code and 'err' msg when handler throws HttpError",
    run(
      'throw',
      new HttpError('oops', 404),
      404,
      {err: 'oops'},
      'ERROR GET /test HttpError: oops'
    )
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
      },
      'ERROR GET /test ProblemDetailsError: err_detail'
    )
  );

  it(
    'returns 500 and a generic body when handler throws a string',
    run(
      'throw',
      'foo',
      500,
      {
        err: 'Unexpected error',
        error: {
          code: 'INTERNAL',
          message: 'Unexpected error',
          traceId: expect.any(String),
        },
      },
      expect.stringMatching(/^ERROR GET \/test foo \(traceId=[\w-]+\)$/)
    )
  );

  it(
    'returns 500 and a generic body, logging the full error, when handler throws an Error',
    run(
      'throw',
      new Error('foo'),
      500,
      {
        err: 'Unexpected error',
        error: {
          code: 'INTERNAL',
          message: 'Unexpected error',
          traceId: expect.any(String),
        },
      },
      expect.stringMatching(
        /^ERROR GET \/test Error: foo \(traceId=[\w-]+\)\n\s+at /
      )
    )
  );
});
