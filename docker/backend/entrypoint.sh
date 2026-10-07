#!/bin/sh
set -eu
if [ "$1" = "php-fpm" ]; then
    php artisan config:cache --no-interaction
    php artisan route:cache --no-interaction
    php artisan view:cache --no-interaction
    chown -R www-data:www-data storage bootstrap/cache
fi
exec docker-php-entrypoint "$@"
