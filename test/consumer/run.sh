#!/usr/bin/env bash
#
# Consumer smoke test — verify the PUBLISHED artifact, not the source tree.
#
# The unit suite imports from `../src`, so it cannot catch a broken build, a bad
# `files` list, a renamed export, or declarations a consumer can't resolve. This
# script packs the library exactly as `npm publish` would, installs the tarball
# into a scratch project outside the repo (so nothing resolves via the repo's
# own node_modules), and runs two probes against it:
#
#   probe.cjs  require() + export-surface snapshot + a real Express app
#   probe.ts   tsc --noEmit --strict against the emitted .d.ts
#
# Repeats per Express version because `express` is a peerDependency
# (^4.17.0 || ^5.0.0) and jsonRouting decorates Express's Router object: both
# ends of both supported majors are as much a part of the contract as the newest.
#
# Usage: test/consumer/run.sh [express-version ...]   (default: floor + latest of 4.x and 5.x)
# Exit:  0 all probes passed, non-zero on the first failure.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/test/consumer"
cd "$REPO_ROOT"

# Default matrix: each supported major's floor, and whatever that major resolves
# to today.
EXPRESS_VERSIONS=("$@")
if [ ${#EXPRESS_VERSIONS[@]} -eq 0 ]; then
    EXPRESS_VERSIONS=("4.17.0" "^4.0.0" "5.0.0" "^5.0.0")
fi

# Compile with the repo's own toolchain, then pack. `npm pack` honours `files`,
# so the tarball is byte-identical to what publish would upload.
echo "==> compile"
yarn --silent compile
echo "==> pack"
# Read the filename from --json rather than the last stdout line, so npm printing
# anything else on stdout can't silently yield a wrong path.
#
# --ignore-scripts is required for that to work: the `prepare` hook writes yarn
# and husky chatter to stdout ahead of the JSON. It's also correct here — we
# compiled above, so re-running prepare would only duplicate the build.
TARBALL="$REPO_ROOT/$(npm pack --json --ignore-scripts |
    node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).at(-1).filename')"
[ -f "$TARBALL" ] || { echo "pack produced no tarball at $TARBALL" >&2; exit 1; }

WORKDIRS=()
cleanup() {
    rm -f "$TARBALL"
    for d in ${WORKDIRS+"${WORKDIRS[@]}"}; do rm -rf "$d"; done
}
trap cleanup EXIT

# Probe with the same TypeScript the library is built with: the question is
# whether OUR emitted declarations work, not whether some other tsc likes them.
TS_VERSION="$(node -p "require('$REPO_ROOT/package.json').devDependencies.typescript")"

for EXPRESS_VERSION in "${EXPRESS_VERSIONS[@]}"; do
    WORK="$(mktemp -d)"
    WORKDIRS+=("$WORK")
    echo "==> consumer probe · express@${EXPRESS_VERSION}"

    # @types/express tracks the express major, so pair them: v5 types against an
    # express 4 install (or vice versa) would type-check the wrong contract, and
    # our .d.ts resolves `express` types from the CONSUMER's tree, not ours.
    TYPES_MAJOR="${EXPRESS_VERSION#[\^~]}"
    TYPES_MAJOR="${TYPES_MAJOR%%.*}"

    cp "$HERE/probe.cjs" "$HERE/probe.ts" "$HERE/tsconfig.json" "$HERE/expected-exports.json" "$WORK/"
    cat > "$WORK/package.json" <<'JSON'
{
  "name": "tibber-express-utils-consumer-probe",
  "version": "1.0.0",
  "private": true,
  "description": "Scratch consumer used by test/consumer/run.sh; not published."
}
JSON

    (
        cd "$WORK"
        # The scratch install hits the registry, so it can fail for reasons that
        # have nothing to do with the code under test. This step gates publish —
        # retry a transient blip rather than failing an otherwise-good release.
        # --no-package-lock keeps the scratch install fast and disposable.
        for attempt in 1 2 3; do
            if npm install --silent --no-audit --no-fund --no-package-lock \
                "$TARBALL" \
                "express@${EXPRESS_VERSION}" \
                "typescript@${TS_VERSION}" \
                "@types/express@^${TYPES_MAJOR}" \
                "@types/node@^22" >/dev/null 2>"$WORK/npm-install.log"; then
                break
            fi
            if [ "$attempt" = 3 ]; then
                echo "    ✗ scratch install failed after 3 attempts:" >&2
                tail -20 "$WORK/npm-install.log" >&2
                exit 1
            fi
            echo "    scratch install attempt ${attempt} failed; retrying in $((attempt * 5))s" >&2
            sleep $((attempt * 5))
        done

        echo "    express resolved: $(node -p "require('express/package.json').version")" \
            "· @types/express: $(node -p "require('@types/express/package.json').version")"
        node probe.cjs
        npx --no-install tsc -p tsconfig.json
        echo "  ✓ types: declarations resolve and public generics accept documented usage"
    )
done

echo "==> consumer smoke test passed for ${#EXPRESS_VERSIONS[@]} express version(s)"
