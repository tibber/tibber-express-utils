import express, {Router} from 'express';
import request from 'supertest';
import {jsonRouting} from '../src';

describe('Express 5 features', () => {
  it('handles async errors properly (Express 5 feature)', async () => {
    const router = Router({});
    const jsonRouter = jsonRouting({expressRouter: router});

    // Test that async errors are automatically caught and handled
    jsonRouter.jsonGet('/async-error', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      throw new Error('Async error test');
    });

    const app = express();
    app.use(jsonRouter);

    const response = await request(app).get('/async-error').expect(500);

    expect(response.body).toStrictEqual({
      err: 'Error: Async error test',
    });
  });

  it('handles rejected promises properly (Express 5 feature)', async () => {
    const router = Router({});
    const jsonRouter = jsonRouting({expressRouter: router});

    jsonRouter.jsonGet('/rejected-promise', async () => {
      return Promise.reject(new Error('Promise rejection test'));
    });

    const app = express();
    app.use(jsonRouter);

    const response = await request(app).get('/rejected-promise').expect(500);

    expect(response.body).toStrictEqual({
      err: 'Error: Promise rejection test',
    });
  });
});
