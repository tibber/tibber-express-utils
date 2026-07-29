import express, {
  Router,
  type ErrorRequestHandler,
} from 'express';
import request from 'supertest';
import {Errors, HttpResult, jsonRouting} from '../src';

/**
 * jsonMiddleware has always awaited the handler's return value, so async
 * handlers worked at runtime — but JsonRequestHandler's return type did not
 * include a Promise arm, so `async` handlers failed to compile for consumers
 * and no test exercised one. These tests are the regression guard: they are
 * written with `async` handlers throughout, so the suite stops compiling if the
 * Promise arm is ever removed again.
 */
describe('async handlers', () => {
  const appWith = (mount: (router: ReturnType<typeof jsonRouting>) => void) => {
    const router = jsonRouting({expressRouter: Router({})});
    mount(router);
    const app = express();
    app.use(router);
    // jsonMiddleware calls next(err) after responding; swallow it so express'
    // finalhandler doesn't log expected errors during the run.
    const swallow: ErrorRequestHandler = () => {};
    app.use(swallow);
    return app;
  };

  it('resolves an HttpResult returned from an async handler', async () => {
    const app = appWith(router => {
      router.jsonGet<{name: string}>('/thing', async () => {
        await Promise.resolve();
        return new HttpResult(200, {name: 'async'});
      });
    });

    const response = await request(app).get('/thing').expect(200);
    expect(response.body).toEqual({name: 'async'});
  });

  it('applies the default status selector to a bare async payload', async () => {
    const app = appWith(router => {
      router.jsonGet('/bare', async () => ({bare: true}));
    });

    const response = await request(app).get('/bare').expect(200);
    expect(response.body).toEqual({bare: true});
  });

  it('treats an async undefined as "no code" per the verb default', async () => {
    const app = appWith(router => {
      // NotFoundIfNoCodeOtherwiseOk for GET, NoContentIfNoCodeOtherwiseOk for DELETE.
      router.jsonGet('/missing', async () => undefined);
      router.jsonDelete('/gone', async () => undefined);
    });

    await request(app).get('/missing').expect(404);
    await request(app).delete('/gone').expect(204);
  });

  it('maps an error thrown inside an async handler (rejected promise)', async () => {
    const app = appWith(router => {
      router.jsonGet('/boom', async () => {
        await Promise.resolve();
        throw new Errors.NotFoundError('nope');
      });
    });

    const response = await request(app).get('/boom').expect(404);
    expect(response.body).toEqual({err: 'nope'});
  });

  it('infers TPayload through the Promise arm, not as the Promise itself', async () => {
    const app = appWith(router => {
      // No explicit type argument: TPayload must be inferred from inside the
      // Promise. If it were inferred as Promise<...>, the HttpResult below
      // would not type-check against the handler's payload type.
      router.jsonPost('/inferred', async () => new HttpResult(201, {id: 7}));
    });

    const response = await request(app).post('/inferred').expect(201);
    expect(response.body).toEqual({id: 7});
  });
});
