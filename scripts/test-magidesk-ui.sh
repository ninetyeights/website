#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
artifacts="${MAGIDESK_ARTIFACTS:-/tmp/magidesk-qa}"
mkdir -p "$artifacts"
docker run --rm --network host \
  -v "$project_root/frontend/tests/ui/magidesk.test.mjs:/source/magidesk.test.mjs:ro" \
  -v "$artifacts:/artifacts" \
  -e MAGIDESK_ARTIFACTS=/artifacts \
  -e TEST_NAME_PATTERN="${TEST_NAME_PATTERN:-.}" \
  -e TEST_BASE_URL="${TEST_BASE_URL:-http://127.0.0.1:3000}" \
  mcr.microsoft.com/playwright:v1.58.2-noble \
  sh -c 'mkdir -p /work/tests && cp /source/magidesk.test.mjs /work/tests/ && cd /work && npm install --no-audit --no-fund playwright@1.58.2 >/dev/null && node --test --test-name-pattern="$TEST_NAME_PATTERN" tests/magidesk.test.mjs'
