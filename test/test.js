import test from 'ava';
import {HttpResult} from '../src/index';

test('should be able to create HttpResult', t=>{

   const result = new HttpResult(203,{test:2});
   t.is(result instanceof HttpResult,true);


   t.is(result.statusCode, 203);

});