
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# Usage

## Install

```
$ yarn install --save tibber-express-utils
```

## Usage

```js
import { jsonRouting, HttpResult, ConflictError, NotFoundError, NotAuthorizedError, BadRequestError, ServerError } from 'tibber-express-utils';
//decorate router with jsonrouting
const router = jsonRouting(express.Router());


router.get('/api/test', req=>({test:123})); //return result directy
router.get('/api/test2', req=>(new HttpResult(230, {test:123}))); //return result with customer statuscode
router.get('/api/test3', req=> throw new NotFoundError('this is a test error'));

router.post('/api/test4', async req=>{ //supports promises
    return await someAsyncOperation();
});

router.expressGet('/api/test5', (req, res)=>{
  // regular express func;
});
```

## Upgrading to 2.0.0

Breaking changes in `2.0.0` include:

 - `Router.expressXXX(...)` API has been deprecated, in favour of using original HTTP RequestHandler methods.
 - Overridden HTTP RequestHandler methods are now exposed via `Router.jsonXXX(...)` API.
 
Significant changes in terminology:
 
 - `contextFn` is now called `contextSelector`.

Other changes incude:

 - Conversion to `typescript`, including typings.
 
### Migration from 1.8.* to 2.0.0

In order to migrate to `2.0.0`:
 
1. revert all calls to `Router.expressXXX(...)` to their original `Router.XXX(...)` methods.
   - E.g. `router.expressGet(...)` becomes `router.get(...)`
2. update all calls to overriden HTTP RequestHandler methods to `router.jsonXXX(...)`.
   - E.g. `router.get(...)` becomes `router.jsonGet(...)`

# Development

Uses `gts`, Google's base `typescript` environment configuration.

To test, run `yarn test`.
To compile, run `yarn compile`. Assets will be in `/build`.

## Linting and formatting

`gts` includes sane (and strict) settings for `eslint` and `prettier`.

Run `yarn lint --fix` to run eslint on the whole project.
