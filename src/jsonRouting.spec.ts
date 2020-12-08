import test from 'ava';
import {Router} from 'express';
import {jsonRouting} from '.';

test('jsonGet', t => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);
  t.truthy(jsonRouter.jsonGet);
});

test('jsonPost', t => {
  const router = Router({});
  const jsonRouter = jsonRouting(router);
  t.truthy(jsonRouter.jsonPost);
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
