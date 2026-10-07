#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"
docker compose --env-file .env.production up -d --wait frontend backend
docker compose --env-file .env.production exec -T backend php artisan test --compact tests/Feature/TranslationTest.php
docker compose --env-file .env.production exec -T frontend sh -c 'npm test && npm run lint && npx tsc --noEmit'
bash scripts/test-translation-ui.sh
