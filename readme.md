## Install

```
$ npm install --save tibber-express-utils
```

## Usage

```js
import { jsonRouting, HttpResult, ConflictError, NotFoundError, NotAuthorizedError, BadRequestError, ServerError } from 'tibber-express-utils';
//decorate router with jsonrouting
const router = jsonRouting(express.Router());


router.get('/api/test', req=>({test:123})); //return result directy
router.get('/api/test2', req=>(new HttpResult(230, {test:123}))); //return result with customer statuscode
router.get('/api/test3', req=> throw new NotFoundError('this is a test error'));

router.post('/api/test4' async req=>{ //supports promises
    return await someAsyncOperation();
});

router.expressGet('/api/test5', (req, res)=>{
  // regular express func;
});
```