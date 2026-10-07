FROM node:24-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG API_INTERNAL_URL=http://backend:8000
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
ARG SITE_URL=https://ninetyeights.com
ENV SITE_URL=${SITE_URL}
COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/scripts/apply-braces-patch.mjs ./scripts/apply-braces-patch.mjs
COPY frontend/patches/ ./patches/
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:24-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir -p .next/cache && chown -R node:node .next
USER node
EXPOSE 3000
CMD ["node", "server.js"]
