import express, {Router} from 'express';
import request from 'supertest';
import {registerDeprecated} from '../src';

describe('registerDeprecated', () => {
  it('sets the headers and reports the call', async () => {
    const onCall = jest.fn();
    const router = Router();
    registerDeprecated(router, '/old/{id}', {
      deprecationDate: '2026-11-01',
      onCall,
      successorRoute: '/new',
      sunsetDate: '2026-12-01',
    });
    router.get('/old/:id', (_, res) => {
      res.sendStatus(204);
    });

    const response = await request(express().use(router))
      .get('/old/1')
      .set('x-tibber-caller', 'test')
      .expect(204);

    expect(response.headers).toMatchObject({
      deprecation: '@1793491200',
      link: '</new>; rel="successor-version"',
      sunset: 'Tue, 01 Dec 2026 00:00:00 GMT',
    });
    expect(onCall).toHaveBeenCalledWith(
      {
        caller: 'test',
        method: 'GET',
        route: '/old/{id}',
        sunsetDate: '2026-12-01',
      },
      expect.anything()
    );
  });

  it('rejects an invalid date when the route is registered', () => {
    expect(() =>
      registerDeprecated(Router(), '/old', {
        deprecationDate: 'soon',
        onCall: jest.fn(),
      })
    ).toThrow('Invalid deprecation date: soon');
  });
});
