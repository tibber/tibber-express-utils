import test from 'ava';
import {Router} from 'express';
import {jsonRouting} from '.';

test('jsonGet', async t => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);
  t.truthy(jsonRouter.jsonGet);
});
