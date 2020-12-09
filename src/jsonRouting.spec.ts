import test from 'ava';
import express, {Router} from 'express';
import request from 'supertest';
import {HttpResult, jsonRouting} from '.';

test('jsonGet', async t => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);
  t.truthy(jsonRouter.jsonGet);

  const expected = {foo: 'bar'};

  jsonRouter.jsonGet('/test', () => {
    return new HttpResult(200, expected);
  });

  const app = express();
  app.use(jsonRouter);

  const response = await request(app).get('/test').expect(200);
  t.deepEqual(response.body, expected);
});

test('jsonPut', t => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);
  t.truthy(jsonRouter.jsonPut);
});

test('jsonPatch', t => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);
  t.truthy(jsonRouter.jsonPatch);
});

test('jsonDelete', t => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);
  t.truthy(jsonRouter.jsonDelete);
});
