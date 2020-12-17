import test from 'ava';
import {Router} from 'express';
import {jsonRouting} from '../src';

test("installs all 'jsonXXX' handlers", async t => {
  const router = Router({});
  const jsonRouter = jsonRouting({expressRouter: router});
  t.truthy(jsonRouter.jsonDelete);
  t.truthy(jsonRouter.jsonGet);
  t.truthy(jsonRouter.jsonPatch);
  t.truthy(jsonRouter.jsonPut);
  t.truthy(jsonRouter.jsonPost);
});
