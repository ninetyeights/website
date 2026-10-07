#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Run against the local Docker development stack; upstream translation is mocked.
docker run --rm --network host \
  -v "$project_root/frontend/tests/ui:/tests:ro" \
  mcr.microsoft.com/playwright:v1.58.2-noble \
  sh -c 'mkdir /work && cp -R /tests /work/tests && cd /work && npm install --no-audit --no-fund playwright@1.58.2 >/dev/null && node --test tests/*.test.mjs'
