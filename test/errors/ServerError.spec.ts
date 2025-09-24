import express, {Router} from 'express';
import request from 'supertest';
import {jsonRouting} from '../../src';
import {ServerError} from '../../src/errors';

describe('ServerError', () => {
  it('returns 500 status code when ServerError is thrown', async () => {
    const router = Router({});
    const jsonRouter = jsonRouting({expressRouter: router});

    jsonRouter.jsonGet('/server-error', () => {
      throw new ServerError('Internal server error occurred');
    });

    const app = express();
    app.use(jsonRouter);

    const response = await request(app).get('/server-error').expect(500);

    expect(response.body).toStrictEqual({
      err: 'Internal server error occurred',
    });
  });

  it('creates ServerError with correct status code', () => {
    const error = new ServerError('Test server error');

    expect(error.message).toBe('Test server error');
    expect(error.httpStatus).toBe(500);
    expect(error).toBeInstanceOf(ServerError);
    expect(error).toBeInstanceOf(Error);
  });
});
