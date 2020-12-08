import test from 'ava';
import {HttpResult} from '.';

test('should be able to create HttpResult', t => {
  const payload = {test: 2};
  const result = new HttpResult(203, payload);

  t.is(result.statusCode, 203);
  t.is(result.payload, payload);
});
