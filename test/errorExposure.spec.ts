import express, {Router} from 'express';
import request from 'supertest';
import {Errors, jsonRouting} from '../src';

const appThrowing = (thrown: unknown, logged: unknown[] = []) => {
  const jsonRouter = jsonRouting({
    expressRouter: Router({}),
    logger: {error: (...args: unknown[]) => logged.push(args[0])},
  });
  jsonRouter.jsonGet('/test', () => {
    throw thrown;
  });
  const app = express();
  app.use(jsonRouter);
  return app;
};

describe('error exposure', () => {
  it('does not send an upstream URL from an unexpected error', async () => {
    const logged: unknown[] = [];
    const app = appThrowing(
      new Error('GET http://wallet.wallet.svc.cluster.local/x failed'),
      logged
    );

    const response = await request(app).get('/test').expect(500);

    expect(JSON.stringify(response.body)).not.toContain('svc.cluster.local');
    expect(response.body.error.code).toBe('INTERNAL');
    // The caller's traceId finds the full error in the logs.
    expect(logged[0]).toContain('svc.cluster.local');
    expect(logged[0]).toContain(`traceId=${response.body.error.traceId}`);
  });

  it('does not send a TypeError message', async () => {
    const app = appThrowing(
      new TypeError("Cannot read properties of undefined (reading 'x')")
    );

    const response = await request(app).get('/test').expect(500);

    expect(response.body.err).toBe('Unexpected error');
  });

  it('keeps the status of a 5xx HttpError but not its message', async () => {
    const app = appThrowing(new Errors.HttpError('redis at 10.0.0.1', 503));

    const response = await request(app).get('/test').expect(503);

    expect(response.body.err).toBe('Unexpected error');
  });

  it('sends a generic body for a thrown non-Error value', async () => {
    const logged: unknown[] = [];
    const app = appThrowing({secret: 'internal'}, logged);

    const response = await request(app).get('/test').expect(500);

    expect(response.body.err).toBe('Unexpected error');
    expect(logged[0]).toContain('{"secret":"internal"}');
  });

  it('keeps the message of a 4xx HttpError', async () => {
    const app = appThrowing(new Errors.BadRequestError('unknown key: foo'));

    const response = await request(app).get('/test').expect(400);

    expect(response.body).toStrictEqual({err: 'unknown key: foo'});
  });

  it('sends a ProblemDetailsError as built, also for 5xx', async () => {
    const app = appThrowing(
      new Errors.ProblemDetailsError({
        statusCode: 503,
        title: 'Try again later',
        type: 'urn:tibber:unavailable',
      })
    );

    const response = await request(app).get('/test').expect(503);

    expect(response.body).toMatchObject({
      title: 'Try again later',
      type: 'urn:tibber:unavailable',
    });
  });

  it('uses the trace id from a W3C traceparent header', async () => {
    const response = await request(appThrowing(new Error('x')))
      .get('/test')
      .set(
        'traceparent',
        '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      )
      .expect(500);

    expect(response.body.error.traceId).toBe(
      '4bf92f3577b34da6a3ce929d0e0e4736'
    );
  });

  it('uses a well-formed x-request-id and ignores a malformed one', async () => {
    const app = appThrowing(new Error('x'));

    const ok = await request(app)
      .get('/test')
      .set('x-request-id', 'req-123')
      .expect(500);
    const bad = await request(app)
      .get('/test')
      .set('x-request-id', '<script>')
      .expect(500);

    expect(ok.body.error.traceId).toBe('req-123');
    expect(bad.body.error.traceId).not.toBe('<script>');
    expect(bad.body.error.traceId).toMatch(/^[\da-f-]{36}$/);
  });
});
