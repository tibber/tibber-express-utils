/**
 * Consumer probe — runtime half.
 *
 * Runs inside a scratch project that has installed tibber-express-utils from a
 * packed tarball, so it exercises what a consuming service actually gets:
 * `main`, the emitted `dist/src/**` JS, and CommonJS `require` resolution.
 * The repo's own unit tests import from `../src` and therefore cannot catch a
 * broken build, a bad `files` list, or a renamed export.
 *
 * Asserts, in order:
 *   1. the package resolves via plain `require` (no path tricks),
 *   2. its export surface matches the committed snapshot exactly,
 *   3. a real Express app wired through the INSTALLED jsonRouting serves
 *      requests — success payload, thrown-error mapping, and status-code
 *      returns.
 *
 * Exits non-zero with a specific message on the first failure.
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const expected = JSON.parse(readFileSync(join(__dirname, 'expected-exports.json'), 'utf8'));

const lib = require('tibber-express-utils');
const express = require('express');

// ── 1 + 2: export surface ───────────────────────────────────────────────────
const actualIndex = Object.keys(lib).sort();
assert.deepEqual(
  actualIndex,
  [...expected.index].sort(),
  `public export surface drifted from expected-exports.json\n  expected: ${expected.index.sort()}\n  actual:   ${actualIndex}`
);

const actualErrors = Object.keys(lib.Errors).sort();
assert.deepEqual(
  actualErrors,
  [...expected.Errors].sort(),
  `Errors namespace drifted from expected-exports.json\n  expected: ${expected.Errors.sort()}\n  actual:   ${actualErrors}`
);

// Error classes must remain constructible and keep instanceof working through
// the emitted JS — es6-error subclassing is exactly the kind of thing a
// TypeScript target/lib change can silently break.
const notFound = new lib.Errors.NotFoundError('nope');
assert.ok(notFound instanceof Error, 'NotFoundError must extend Error');
assert.equal(notFound.message, 'nope');

// ── 3: real Express app through the installed package ────────────────────────
const app = express();

// Supplying a Logger both pins that the interface is honoured (it must receive
// handler errors) and keeps the expected /boom stack trace out of CI output.
const logged = [];
const router = lib.jsonRouting({
  expressRouter: express.Router({}),
  logger: {
    debug: () => {},
    info: () => {},
    error: (...args) => logged.push(args),
  },
});

router.jsonGet('/ok/:id', req => new lib.HttpResult(200, {id: req.params.id}));
router.jsonGet('/bare', () => ({bare: true}));
// Default selectors decide the status when the handler does NOT return an
// HttpResult, and the two defaults differ per verb. These are easy to break
// and invisible to a source-level test, so pin both:
//   jsonGet    NotFoundIfNoCodeOtherwiseOk -> undefined = 404, else 200
//   jsonDelete NoContentIfNoCodeOtherwiseOk -> falsy = 204, truthy = 202
router.jsonGet('/nothing', () => undefined);
router.jsonDelete('/gone', () => undefined);
router.jsonDelete('/accepted', () => ({queued: true}));
router.jsonGet('/boom', () => {
  throw new lib.Errors.NotFoundError('missing');
});

app.use(router);

// jsonMiddleware responds AND then calls next(err), so handler errors also
// reach the consumer's Express error pipeline (error-metrics middleware relies
// on this). Terminating it here pins that propagation and keeps Express's
// finalhandler from logging the expected /boom error to stderr.
const propagated = [];
app.use((err, _req, _res, _next) => {
  propagated.push(err);
});

const server = http.createServer(app);

const call = async (path, method = 'GET') => {
  const {port} = server.address();
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {method});
  const text = await res.text();
  return {status: res.status, body: text ? JSON.parse(text) : undefined};
};

const main = async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const ok = await call('/ok/abc');
    assert.equal(ok.status, 200, `HttpResult route: expected 200, got ${ok.status}`);
    assert.deepEqual(ok.body, {id: 'abc'}, 'HttpResult payload must round-trip');

    const bare = await call('/bare');
    assert.equal(bare.status, 200, `bare-payload route: expected 200, got ${bare.status}`);
    assert.deepEqual(bare.body, {bare: true});

    const nothing = await call('/nothing');
    assert.equal(nothing.status, 404, `jsonGet returning undefined must be 404, got ${nothing.status}`);

    const gone = await call('/gone', 'DELETE');
    assert.equal(gone.status, 204, `jsonDelete returning undefined must be 204, got ${gone.status}`);

    const accepted = await call('/accepted', 'DELETE');
    assert.equal(accepted.status, 202, `jsonDelete returning a value must be 202, got ${accepted.status}`);

    const boom = await call('/boom');
    assert.equal(boom.status, 404, `thrown NotFoundError must map to 404, got ${boom.status}`);
    assert.ok(logged.length > 0, 'a supplied logger must receive handler errors');
    assert.ok(
      propagated.some(e => e instanceof lib.Errors.NotFoundError),
      'handler errors must also propagate to the express error pipeline via next(err)'
    );
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  console.log('  ✓ runtime: exports, error classes, and 6 routes served from the installed tarball');
};

main().catch(err => {
  console.error(`  ✗ consumer runtime probe failed: ${err.message}`);
  process.exit(1);
});
