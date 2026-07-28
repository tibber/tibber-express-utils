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
# Repeats per Express version because `express` is a peerDependency (^5.0.0) and
# jsonRouting decorates Express's Router object: the lowest supported version is
# as much a part of the contract as the newest.
#
# Usage: test/consumer/run.sh [express-version ...]   (default: floor + latest 5.x)
# Exit:  0 all probes passed, non-zero on the first failure.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/test/consumer"
cd "$REPO_ROOT"

# Default matrix: the peer-range floor, and whatever the range resolves to today.
EXPRESS_VERSIONS=("$@")
if [ ${#EXPRESS_VERSIONS[@]} -eq 0 ]; then
    EXPRESS_VERSIONS=("5.0.0" "^5.0.0")
fi

# Compile with the repo's own toolchain, then pack. `npm pack` honours `files`,
# so the tarball is byte-identical to what publish would upload.
echo "==> compile"
yarn --silent compile
echo "==> pack"
TARBALL="$REPO_ROOT/$(npm pack --silent | tail -1)"
[ -f "$TARBALL" ] || { echo "pack produced no tarball" >&2; exit 1; }

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
        # --no-package-lock keeps the scratch install fast and disposable.
        npm install --silent --no-audit --no-fund --no-package-lock \
            "$TARBALL" \
            "express@${EXPRESS_VERSION}" \
            "typescript@${TS_VERSION}" \
            "@types/express@^5" \
            "@types/node@^22" >/dev/null

        echo "    express resolved: $(node -p "require('express/package.json').version")"
        node probe.cjs
        npx --no-install tsc -p tsconfig.json
        echo "  ✓ types: declarations resolve and public generics accept documented usage"
    )
done

echo "==> consumer smoke test passed for ${#EXPRESS_VERSIONS[@]} express version(s)"
