# Usage

## Releases & publishing — read before merging a PR

Merging to `master` runs the CircleCI `build_and_deploy` job:
[semantic-release](https://semantic-release.gitbook.io/) computes the version
from the squash-commit title (conventional commits: `fix:` → patch, `feat:` →
minor, `feat!:`/`BREAKING CHANGE` → major; `chore:`/`docs:`/plain titles →
**no release**), pushes the version-bump commit + tag, creates the GitHub
release, and the job then publishes to npm via
[trusted publishing](https://docs.npmjs.com/trusted-publishers) (CircleCI
OIDC — no stored npm token; requires this package's npmjs trusted-publisher
entry and npm ≥ 11.11, i.e. the `cimg/node:24` image).

**Dep-update PRs**: Dependabot's `fix(deps): …` titles trigger a patch
release on merge. A tool that squashes with a plain title (e.g. Renovate's
default `Update dependency x to vY`) will NOT publish — edit the squash
title to `fix(deps): …` if consumers should get the bump.

**If the publish step fails** after semantic-release has pushed the version
bump: just rerun the job — the already-published guard sees the committed
version is missing from npm and publishes it. Note this self-heal applies to
*any* master build, release or not: while the committed version is missing
from npm, the next merge of any kind publishes it. (Versions 4.0.14–4.0.18 were
tagged during the broken-token era but never reached npm; consumers jump
from 4.0.13 straight to the first post-fix release.)

## Tests

| Command | What it covers |
|---|---|
| `yarn test` | Unit suite (jest). Imports from `src/`, so it verifies behaviour but **not** the published package. |
| `yarn test:consumer` | Consumer smoke test. Packs the library and installs the tarball into a scratch project outside the repo, then verifies it as a consumer sees it. |

`yarn test:consumer` ([test/consumer/](test/consumer/)) exists because the unit
suite cannot fail for a whole class of breakage: a bad `main` or `files` entry, a
renamed or dropped export, or `.d.ts` files a consumer can't resolve all leave it
green while shipping a broken package. It asserts:

- the package loads via plain `require`, and its export surface matches the
  committed snapshot in `test/consumer/expected-exports.json` — changing that
  file is how an API addition or removal becomes a reviewable decision;
- a real Express app wired through the **installed** `jsonRouting` serves
  requests, including the per-verb default status selectors (`jsonGet` →
  `undefined` = 404; `jsonDelete` → `undefined` = 204, truthy = 202), thrown
  `HttpError` mapping, that a supplied `Logger` receives handler errors, and that
  errors still propagate via `next(err)` after the response is sent;
- the emitted declarations type-check under `tsc --strict` from a consumer's own
  tsconfig. Note `package.json` declares no `types` field, so type resolution
  relies on tsc's `main` → `<main>.d.ts` fallback — this probe is what keeps that
  working.

It runs against both ends of both supported Express majors (the `4.17.0` and
`5.0.0` floors, plus the newest `^4` and `^5`), with `@types/express` paired to
the express major under test. CI runs it **before** `yarn release`, so none of
the above can publish.

## Requirements

- **Node.js**: 18 or higher
- **Express**: 4.17+ or 5.x (peer dependency)

The library imports Express only as a type — nothing in the emitted JavaScript
references it, and `jsonRouting` decorates whichever `Router` instance you pass
in. So a single build serves both majors, and the shipped declarations resolve
`express` types from *your* `@types/express`, whichever major that is.

## Install

```
$ yarn add tibber-express-utils express
```

## Usage

```js
import { jsonRouting, HttpResult, ConflictError, NotFoundError, NotAuthorizedError, BadRequestError, ServerError } from 'tibber-express-utils';
//decorate router with jsonrouting and provide an (optional) logger to receive messages raised during request handling.
const router = jsonRouting({expressRouter:express.Router(), logger});

/**
 * Use Tibber's middleware shorthand functions with the 'jsonXXX' naming convention.
 */

router.jsonGet('/api/test', req=>({test:123})); //return result directy
router.jsonGet('/api/test2', req=>(new HttpResult(230, {test:123}))); //return result with customer statuscode
router.jsonGet('/api/test3', req=> throw new NotFoundError('this is a test error'));

router.jsonGet('/api/test4', async req=>{ //supports promises
    return await someAsyncOperation();
});

/**
 * Use original express functions as normal
 */
router.get('/api/test5', (req, res)=>{
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

## Upgrading to 3.0.0

Breaking changes in `3.0.0` include:

 - `jsonRouting(...)` now accepts a single object containing the parameters.

Other changes:

 - `jsonRouting(...)` also accepts a logger which is used to log all exceptions occurring during request handling.
## Migration from 2.0.* to 3.0.0

In order to migrate to `3.0.0`:

1. Update `jsonRouting(express.Router(), contextSelector)` statements to `jsonRouting({contextSelector, expressRouter: express.Router()})` or
   more preferably to `jsonRouting({contextSelector, logger, expressRouter: express.Router()})`).

## Upgrading to 4.0.0

Breaking changes in `4.0.0` include:

 - **Express 5 Support**: This version now supports Express 5.x as a peer dependency.
 - **Node.js Requirement**: Minimum Node.js version is now 18.0.0 (required by Express 5).

**Since the peer range widened to `^4.17.0 || ^5.0.0`, Express 5 is no longer
required to be on 4.x** — the Node 18 floor still applies. Express 4 consumers
stranded on `3.5.0` can move to 4.x without touching Express.

### Migration from 3.x.x to 4.0.0

To migrate to `4.0.0`:

1. **Update Node.js**: Ensure you're running Node.js 18 or higher.
2. **Update your package**: Update tibber-express-utils to 4.x:
   ```bash
   yarn add tibber-express-utils@4
   ```
3. **Express is optional**: staying on Express 4.17+ is supported. To also move to
   Express 5, see its
   [migration guide](https://expressjs.com/en/guide/migrating-5.html):
   ```bash
   yarn add express@5
   ```

**Note**: This library maintains the same API and doesn't use any deprecated Express features, so no code changes should be required in most cases.

# Development

Uses `gts`, Google's base `typescript` environment configuration.

To test, run `yarn test`.
To compile, run `yarn compile`. Assets will be in `/build`.

## Linting and formatting

`gts` includes sane (and strict) settings for `eslint` and `prettier`.

Run `yarn lint --fix` to run eslint on the whole project.
