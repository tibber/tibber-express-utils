import {HttpResult} from '../src';

describe('HttpResult', () => {
  it('should be able to create HttpResult', () => {
    const payload = {test: 2};
    const result = new HttpResult(203, payload);

    expect(result.statusCode).toBe(203);
    expect(result.payload).toBe(payload);
  });
});
