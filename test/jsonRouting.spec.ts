import {Router} from 'express';
import {jsonRouting} from '../src';

describe('jsonRouting', () => {
  it("installs all 'jsonXXX' handlers", () => {
    const router = Router({});
    const jsonRouter = jsonRouting({expressRouter: router});
    expect(jsonRouter.jsonDelete).not.toBeNull();
    expect(jsonRouter.jsonGet).not.toBeNull();
    expect(jsonRouter.jsonPatch).not.toBeNull();
    expect(jsonRouter.jsonPut).not.toBeNull();
    expect(jsonRouter.jsonPost).not.toBeNull();
  });
});
