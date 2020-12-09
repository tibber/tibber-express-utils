import express, {Router} from 'express';
import request from 'supertest';
import {HttpResult, jsonRouting} from '.';

describe('jsonRouting', () => {
  it('jsonGet', async done => {
    const router = Router({});
    const jsonRouter = jsonRouting(router);
    expect(jsonRouter.jsonGet).toBeTruthy();

    const expected = {foo: 'bar'};

    jsonRouter.jsonGet('/test', () => {
      return new HttpResult(200, expected);
    });

    const app = express();
    app.use(jsonRouter);

    const response = await request(app).get('/test').expect(200);
    expect(response.body).toMatchObject(expected);
    done();
  });

  it('jsonPut', async () => {
    const router = Router({});
    const jsonRouter = jsonRouting(router);
    expect(jsonRouter.jsonPut).toBeTruthy();
  });

  it('jsonPatch', async () => {
    const router = Router({});
    const jsonRouter = jsonRouting(router);
    expect(jsonRouter.jsonPatch).toBeTruthy();
  });

  it('jsonDelete', async () => {
    const router = Router({});
    const jsonRouter = jsonRouting(router);
    expect(jsonRouter.jsonDelete).toBeTruthy();
  });
});
