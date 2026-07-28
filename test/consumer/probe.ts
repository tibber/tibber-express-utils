/**
 * Consumer probe — types half. Type-checked with `tsc --noEmit` (strict) inside
 * the scratch project, against the .d.ts files emitted into the tarball.
 *
 * Two things this pins that the repo's own tests cannot:
 *   1. Type resolution works for a consumer. package.json declares no "types"
 *      field, so tsc only finds the declarations via its `main` -> `<main>.d.ts`
 *      fallback. Changing `main`, the `files` list, or the dist layout would
 *      break every TypeScript consumer while the unit tests stay green.
 *   2. The public generics still accept documented usage. A compile error here
 *      is a breaking API change, even if the runtime behaviour is unchanged.
 */
import express, {Router} from 'express';
import {
  Errors,
  HttpResult,
  jsonRouting,
  type JsonRouter,
  type Logger,
} from 'tibber-express-utils';

const app = express();

// A logger is optional and structurally typed — pin that the interface stays
// satisfiable by an ordinary console-shaped object.
const logger: Logger = {
  debug: (...args: unknown[]) => console.debug(...args),
  error: (...args: unknown[]) => console.error(...args),
  info: (...args: unknown[]) => console.info(...args),
};

const router: JsonRouter<unknown> = jsonRouting({
  expressRouter: Router({}),
  logger,
});

// Every documented return shape of a JsonRequestHandler: an HttpResult, a bare
// payload, a status code, and undefined.
router.jsonGet<{name: string}>('/x/:id', req => {
  if (!req.params.id) throw new Errors.BadRequestError('no id');
  return new HttpResult(200, {name: String(req.params.id)});
});
router.jsonPost<{ok: boolean}>('/y', () => ({ok: true}));
// Async handlers must type-check through the PUBLISHED declarations — the
// common case for anything doing I/O. Both explicit and inferred TPayload.
router.jsonGet<{name: string}>('/async/:id', async req => {
  await Promise.resolve();
  return new HttpResult(200, {name: String(req.params.id)});
});
router.jsonPost('/async-inferred', async () => new HttpResult(201, {id: 7}));
router.jsonPut<{ok: boolean}>('/y/:id', () => new HttpResult(200, {ok: true}, {'x-trace': 'abc'}));
router.jsonPatch('/y/:id', () => undefined);
router.jsonDelete('/z/:id', () => 204);

app.use(router);

// Errors are constructible and assignable to Error — consumers catch them.
// ProblemDetailsError takes a named-args object (RFC 9457 shape).
const err: Error = new Errors.ProblemDetailsError({
  statusCode: 400,
  title: 'bad request',
  type: 'https://tibber.com/problems/bad-request',
  detail: 'id was missing',
});
void err;
