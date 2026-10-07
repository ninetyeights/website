FROM php:8.5-fpm-bookworm@sha256:dd198c828c224e479bdaa184cdcf04a28c73d186bf5a885493bf9cc78d7196ef AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libpq-dev libicu-dev libzip-dev libonig-dev \
    && docker-php-ext-install -j$(nproc) pdo_pgsql intl zip mbstring bcmath \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2@sha256:d8f6343d3fae98107426bc49163ccad46ef85aabd4a27d80a74401fab4aba332 /usr/bin/composer /usr/local/bin/composer
WORKDIR /app
ENV COMPOSER_HOME=/tmp/composer
COPY backend/ ./
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    && php artisan filament:assets --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache
COPY docker/backend/php.ini /usr/local/etc/php/conf.d/production.ini
COPY docker/backend/pool.conf /usr/local/etc/php-fpm.d/zz-app.conf
COPY docker/backend/entrypoint.sh /usr/local/bin/app-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/app-entrypoint \
    && chmod +x /usr/local/bin/app-entrypoint
EXPOSE 9000
ENTRYPOINT ["app-entrypoint"]
CMD ["php-fpm"]

FROM runtime AS test
RUN composer install --prefer-dist --no-interaction

FROM nginx:stable-bookworm@sha256:552e7481ca93ffccd046aa658dbbed22caefbc09c66fa7cd247cbb90b8a5c609 AS web
COPY --from=runtime /app/public/ /app/public/
COPY docker/backend/19-validate-host-proxy.sh /docker-entrypoint.d/19-validate-host-proxy.sh
RUN chmod +x /docker-entrypoint.d/19-validate-host-proxy.sh
ENV HOST_PROXY_IP=127.0.0.1
ENV NGINX_ENVSUBST_FILTER=HOST_PROXY_IP
COPY docker/backend/nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/backend/security-headers.inc /etc/nginx/security-headers.inc
COPY docker/backend/admin-security-headers.inc /etc/nginx/admin-security-headers.inc
EXPOSE 8000
