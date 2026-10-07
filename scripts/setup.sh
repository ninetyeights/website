#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
fi
[ -f backend/.env.production ] || cp backend/.env.production.example backend/.env.production
docker compose --env-file .env.production build
if ! grep -q '^APP_KEY=base64:' backend/.env.production; then
  generated_key=$(docker compose --env-file .env.production run --rm --no-deps php php artisan key:generate --show --no-interaction)
  sed -i "s|^APP_KEY=.*|APP_KEY=$generated_key|" backend/.env.production
fi
docker compose --env-file .env.production up -d --wait postgres
docker compose --env-file .env.production run --rm php php artisan migrate --force --no-interaction
docker compose --env-file .env.production up -d --wait
