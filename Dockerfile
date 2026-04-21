# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS builder

WORKDIR /workspace
ENV CI=true

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm run setup:wasm
RUN pnpm --filter dbt-docs-redesign run build:standalone

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DBT_UI_DB_PATH=/data/dbt_ui.sqlite

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs dbtui

WORKDIR /app
COPY --from=builder /workspace/apps/web/dbt-docs-redesign/.next/standalone /app

RUN mkdir -p /data && chown -R dbtui:nodejs /app /data

USER dbtui
WORKDIR /app/apps/web/dbt-docs-redesign

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "server.js"]
